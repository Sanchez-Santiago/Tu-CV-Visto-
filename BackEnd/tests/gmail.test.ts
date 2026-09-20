import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { PostulacionModel } from '../src/models/postulacion.model';
import { SeguimientoModel } from '../src/models/seguimiento.model';
import { UsuarioModel } from '../src/models/usuario.model';
import { firmarToken } from '../src/utils/jwt';
import { resetTestDb } from './helpers/test-db';
import {
  codificarCabecera,
  codificarDireccion,
} from '../src/services/gmail.service';

function rawEnviado(): string {
  const llamadaEnvio = fetchMock.mock.calls[0]!;
  const bodyEnviado = JSON.parse(String((llamadaEnvio[1] as RequestInit).body));
  return Buffer.from(bodyEnviado.raw as string, 'base64url').toString('utf8');
}

/** Decodifica un Subject RFC 2047 (=?UTF-8?B?...?=) a texto plano. */
function asuntoDecodificado(raw: string): string {
  const plano = raw.replace(/\r\n /g, '');
  const linea =
    plano.split('\r\n').find((l) => l.startsWith('Subject: ')) ?? '';
  return linea
    .slice('Subject: '.length)
    .replace(/=\?UTF-8\?B\?([^?]+)\?=/g, (_, b64: string) =>
      Buffer.from(b64, 'base64').toString('utf8'),
    );
}

/** Extrae y decodifica en base64 una parte text/plain o text/html. */
function parteDecodificada(raw: string, mime: string): string {
  const lineas = raw.split('\r\n');
  const i = lineas.findIndex((l) => l.includes(`Content-Type: ${mime}`));
  if (i === -1) return '';
  let j = i + 1;
  while (j < lineas.length && lineas[j] !== '') j += 1;
  const chunks: string[] = [];
  for (let k = j + 1; k < lineas.length; k++) {
    const linea = lineas[k] ?? '';
    if (linea.startsWith('--')) break;
    chunks.push(linea);
  }
  return Buffer.from(chunks.join(''), 'base64').toString('utf8');
}

const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
  void init;
  const ruta = String(url);
  if (ruta.endsWith('/messages/send')) {
    return new Response(
      JSON.stringify({
        id: 'gmail-msg-999',
        threadId: 'thread-abc',
        snippet: 'Hola, soy tu postulante ideal',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (ruta.includes('/messages/gmail-msg-1')) {
    return new Response(
      JSON.stringify({
        id: 'gmail-msg-1',
        threadId: 'thread-1',
        snippet: 'Respuesta de RRHH',
        internalDate: '1760000000000',
        payload: {
          headers: [
            { name: 'From', value: 'rrhh@empresa.com' },
            { name: 'To', value: 'candidato@test.com' },
            { name: 'Subject', value: 'Tu postulación' },
          ],
          body: { data: Buffer.from('Hola, te invitamos a una entrevista').toString('base64url') },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (ruta.includes('/messages?')) {
    return new Response(
      JSON.stringify({
        messages: [
          { id: 'gmail-msg-1', threadId: 'thread-1', snippet: 'Respuesta de RRHH' },
          { id: 'gmail-msg-2', threadId: 'thread-2', snippet: 'Gracias por tu interés' },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (ruta.includes('/messages/forbidden-api')) {
    return new Response(
      JSON.stringify({
        error: {
          code: 403,
          message:
            'Gmail API has not been used in project 123 or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/gmail.googleapis.com/overview',
          status: 'PERMISSION_DENIED',
        },
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (ruta.includes('/messages/quota-limit')) {
    return new Response(
      JSON.stringify({
        error: {
          code: 403,
          status: 'RATE_LIMIT',
          message:
            "Quota exceeded for quota metric 'Total Query Cost' and limit 'Units per minute per user' of service 'gmail.googleapis.com' for consumer 'project_number:123'.",
        },
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
});

let usuarioId = 0;
let empresaId = 0;
let postulacionId = 0;
let token = '';

beforeAll(async () => {
  vi.stubGlobal('fetch', fetchMock);

  await resetTestDb(db);

  const usuario = await UsuarioModel.crear({
    nombre: 'Candidato Gmail',
    email: 'candidato@test.com',
  });
  usuarioId = usuario.id;

  const empresa = await db.execute({
    sql: "INSERT INTO empresas (nombre) VALUES (?) RETURNING id",
    args: ['Empresa Gmail'],
  });
  empresaId = Number(empresa.rows[0]!.id);

  const postulacionRes = await request(app)
    .post('/api/postulaciones')
    .send({
      usuario_id: usuarioId,
      empresa_id: empresaId,
      puesto: 'Backend Engineer',
    });
  postulacionId = postulacionRes.body.data.id;

  await db.execute({
    sql: `
      INSERT INTO cuentas_google
        (usuario_id, google_id, access_token, refresh_token, token_expires_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    args: [
      usuarioId,
      'google-id-1',
      'access-token-valido',
      'refresh-token-1',
      new Date(Date.now() + 3_600_000).toISOString(),
    ],
  });

  token = await firmarToken({
    usuario_id: usuarioId,
    email: usuario.email,
    nombre: usuario.nombre,
  });
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await db.close();
});

describe('POST /api/gmail/enviar', () => {
  it('responde 401 sin autenticación', async () => {
    const res = await request(app).post('/api/gmail/enviar').send({
      destinatario: 'rrhh@empresa.com',
      asunto: 'Postulación',
      cuerpo: 'Hola',
    });
    expect(res.status).toBe(401);
  });

  it('genera asunto y cuerpo con la plantilla si no vienen', async () => {
    fetchMock.mockClear();
    const res = await request(app)
      .post('/api/gmail/enviar')
      .set('Authorization', `Bearer ${token}`)
      .send({ postulacion_id: postulacionId, destinatario: 'rrhh@empresa.com' });

    expect(res.status).toBe(201);
    expect(res.body.data.tipo_seguimiento).toBeNull();
    expect(res.body.data.asunto).toContain('Actualización de mi perfil');

    const llamadaEnvio = fetchMock.mock.calls[0]!;
    const bodyEnviado = JSON.parse(String((llamadaEnvio[1] as RequestInit).body));
    const raw = Buffer.from(bodyEnviado.raw as string, 'base64url').toString('utf8');
    expect(raw).toContain('Subject: =?UTF-8?B?');
    expect(asuntoDecodificado(raw)).toBe(res.body.data.asunto);
    expect(asuntoDecodificado(raw)).toContain('Actualización de mi perfil');
    expect(parteDecodificada(raw, 'text/plain')).toContain('Empresa Gmail');
    expect(parteDecodificada(raw, 'text/plain')).toContain('Backend Engineer');

    const postulacion = await PostulacionModel.obtenerPorId(postulacionId);
    expect(postulacion?.proxima_contacto).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('usa la plantilla correcta según tipo_seguimiento', async () => {
    fetchMock.mockClear();
    const res = await request(app)
      .post('/api/gmail/enviar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postulacion_id: postulacionId,
        destinatario: 'rrhh@empresa.com',
        tipo_seguimiento: 'nuevo_proyecto',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.tipo_seguimiento).toBe('nuevo_proyecto');
    expect(res.body.data.asunto).toContain('Nuevo proyecto');
  });

  it('respeta asunto y cuerpo propios y guarda el tipo_seguimiento', async () => {
    fetchMock.mockClear();
    const res = await request(app)
      .post('/api/gmail/enviar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postulacion_id: postulacionId,
        destinatario: 'rrhh@empresa.com',
        asunto: 'Mensaje propio',
        cuerpo: 'Texto libre',
        tipo_seguimiento: 'disponibilidad',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.tipo_seguimiento).toBe('disponibilidad');

    const llamadaEnvio = fetchMock.mock.calls[0]!;
    const bodyEnviado = JSON.parse(String((llamadaEnvio[1] as RequestInit).body));
    const raw = Buffer.from(bodyEnviado.raw as string, 'base64url').toString('utf8');
    expect(raw).toContain('Subject: Mensaje propio');
    expect(parteDecodificada(raw, 'text/plain')).toContain('Texto libre');
  });

  it('responde 404 si la postulación no existe', async () => {
    const res = await request(app)
      .post('/api/gmail/enviar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postulacion_id: 999999,
        destinatario: 'rrhh@empresa.com',
        asunto: 'Hola',
        cuerpo: 'Mundo',
      });
    expect(res.status).toBe(404);
  });

  it('responde 401 si el usuario no tiene cuenta de Google', async () => {
    const sinCuenta = await UsuarioModel.crear({
      nombre: 'Sin Google',
      email: 'singuacenta@test.com',
    });
    const tokenSinCuenta = await firmarToken({
      usuario_id: sinCuenta.id,
      email: sinCuenta.email,
      nombre: sinCuenta.nombre,
    });
    const res = await request(app)
      .post('/api/gmail/enviar')
      .set('Authorization', `Bearer ${tokenSinCuenta}`)
      .send({
        postulacion_id: postulacionId,
        destinatario: 'rrhh@empresa.com',
        asunto: 'Hola',
        cuerpo: 'Mundo',
      });
    expect(res.status).toBe(401);
  });

  it('envía el email, lo registra en la BD y actualiza la postulación', async () => {
    fetchMock.mockClear();
    const res = await request(app)
      .post('/api/gmail/enviar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postulacion_id: postulacionId,
        tipo: 'seguimiento',
        destinatario: 'rrhh@empresa.com',
        asunto: 'Seguimiento de postulación',
        cuerpo: 'Quería continuar con el proceso',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.gmail_message_id).toBe('gmail-msg-999');
    expect(res.body.data.postulacion_id).toBe(postulacionId);
    expect(res.body.data.enviado).toBe(1);
    expect(res.body.data.remitente).toBe('candidato@test.com');

    const llamadaEnvio = fetchMock.mock.calls[0]!;
    expect(String(llamadaEnvio[0])).toContain('/messages/send');
    const bodyEnviado = JSON.parse(String((llamadaEnvio[1] as RequestInit).body));
    expect(bodyEnviado.raw).toBeTruthy();

    const postulacion = await PostulacionModel.obtenerPorId(postulacionId);
    expect(postulacion?.cantidad_mails_enviados).toBeGreaterThanOrEqual(1);
    expect(postulacion?.ultimo_contacto).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(postulacion?.proxima_contacto).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('crea un seguimiento cuando se solicita crear_seguimiento', async () => {
    await request(app)
      .post('/api/gmail/enviar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postulacion_id: postulacionId,
        destinatario: 'rrhh@empresa.com',
        asunto: 'Nuevo seguimiento',
        cuerpo: 'Mensaje',
        crear_seguimiento: true,
        fecha_programada: '2026-09-20',
      })
      .expect(201);

    const seguimientos = await SeguimientoModel.listar({ postulacionId });
    const creado = seguimientos.find((s) => s.fecha_programada === '2026-09-20');
    expect(creado).toBeDefined();
    expect(creado!.enviado).toBe(1);
    expect(creado!.fecha_envio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('envía sin postulación vinculada y guarda el email como suelto', async () => {
    fetchMock.mockClear();
    const res = await request(app)
      .post('/api/gmail/enviar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        destinatario: 'contacto@empresa.com',
        asunto: 'Mensaje libre',
        cuerpo: 'Hola contacto',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.gmail_message_id).toBe('gmail-msg-999');
    expect(res.body.data.postulacion_id).toBeNull();
    expect(res.body.data.tipo).toBe('seguimiento');
    expect(res.body.data.enviado).toBe(1);
    expect(res.body.data.remitente).toBe('candidato@test.com');
    expect(res.body.data.destinatario).toBe('contacto@empresa.com');

    const postulacion = await PostulacionModel.obtenerPorId(postulacionId);
    expect(postulacion?.cantidad_mails_enviados).toBeGreaterThanOrEqual(1);

    const contacto = await db.execute({
      sql: 'SELECT * FROM contactos_rrhh WHERE email = ?',
      args: ['contacto@empresa.com'],
    });
    expect(contacto.rows.length).toBe(1);
  });

  it('no permite enviar sin postulación si faltan asunto y cuerpo', async () => {
    const res = await request(app)
      .post('/api/gmail/enviar')
      .set('Authorization', `Bearer ${token}`)
      .send({ destinatario: 'contacto@empresa.com' });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.error.message)).toContain(
      'asunto y cuerpo son obligatorios',
    );
  });

  it('envía con cc y lo incluye como header', async () => {
    fetchMock.mockClear();
    const res = await request(app)
      .post('/api/gmail/enviar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postulacion_id: postulacionId,
        destinatario: 'rrhh@empresa.com',
        cc: 'manager@empresa.com',
        asunto: 'Postulación con copia',
        cuerpo: 'Mensaje con CC',
      });

    expect(res.status).toBe(201);

    const llamadaEnvio = fetchMock.mock.calls[0]!;
    const bodyEnviado = JSON.parse(String((llamadaEnvio[1] as RequestInit).body));
    const raw = Buffer.from(bodyEnviado.raw as string, 'base64url').toString('utf8');
    expect(raw).toContain('Cc: manager@empresa.com');
    expect(raw).toContain('To: rrhh@empresa.com');
    expect(asuntoDecodificado(raw)).toBe('Postulación con copia');
  });

  it('envía con adjuntos y genera multipart/mixed', async () => {
    fetchMock.mockClear();
    const adjuntoBase64 = Buffer.from('contenido-fake-del-pdf').toString('base64');
    const res = await request(app)
      .post('/api/gmail/enviar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postulacion_id: postulacionId,
        destinatario: 'rrhh@empresa.com',
        asunto: 'CV con adjunto',
        cuerpo: 'Adjunto mi CV',
        adjuntos: [
          { nombre: 'cv.pdf', mime_type: 'application/pdf', contenido_base64: adjuntoBase64 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.gmail_message_id).toBe('gmail-msg-999');

    const llamadaEnvio = fetchMock.mock.calls[0]!;
    const bodyEnviado = JSON.parse(String((llamadaEnvio[1] as RequestInit).body));
    const raw = Buffer.from(bodyEnviado.raw as string, 'base64url').toString('utf8');
    expect(raw).toContain('Content-Type: multipart/mixed; boundary=');
    expect(raw).toContain('Content-Disposition: attachment; filename="cv.pdf"');
    expect(raw).toContain('Content-Transfer-Encoding: base64');
    expect(raw).toContain(adjuntoBase64);
    expect(parteDecodificada(raw, 'text/plain')).toContain('Adjunto mi CV');
  });

  it('preserva tildes y caracteres especiales (round-trip UTF-8)', async () => {
    fetchMock.mockClear();
    const res = await request(app)
      .post('/api/gmail/enviar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postulacion_id: postulacionId,
        destinatario: 'rrhh@empresa.com',
        asunto: 'Actualización de mi perfil — Santiago Sánchez',
        cuerpo: 'Hola, adjunto mi CV actualizado: experiencia en Node.js y más.',
      });

    expect(res.status).toBe(201);

    const raw = rawEnviado();
    // Sin rastro de texto no-ASCII en crudo fuera de los blobs base64.
    expect(raw).not.toContain('Actualización de mi perfil —');
    expect(asuntoDecodificado(raw)).toBe(
      'Actualización de mi perfil — Santiago Sánchez',
    );
    expect(parteDecodificada(raw, 'text/plain')).toContain(
      'Hola, adjunto mi CV actualizado: experiencia en Node.js y más.',
    );
    expect(parteDecodificada(raw, 'text/html')).toContain('Node.js');
  });

  it('codifica nombres de adjunto no ASCII con filename* (RFC 2231)', async () => {
    fetchMock.mockClear();
    const adjuntoBase64 = Buffer.from('fake-pdf').toString('base64');
    const res = await request(app)
      .post('/api/gmail/enviar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postulacion_id: postulacionId,
        destinatario: 'rrhh@empresa.com',
        asunto: 'CV con adjunto',
        cuerpo: 'Va mi currículum',
        adjuntos: [
          {
            nombre: 'Currículum Santiago.pdf',
            mime_type: 'application/pdf',
            contenido_base64: adjuntoBase64,
          },
        ],
      });

    expect(res.status).toBe(201);

    const raw = rawEnviado();
    expect(raw).toContain("filename*=UTF-8''Curr%C3%ADculum%20Santiago.pdf");
  });
});

describe('codificarCabecera / codificarDireccion (RFC 2047)', () => {
  it('deja el ASCII intacto', () => {
    expect(codificarCabecera('Mensaje propio')).toBe('Mensaje propio');
  });

  it('codifica asunto con tildes y round-trip sin pérdida', () => {
    const original = 'Actualización de mi perfil — Santiago Sánchez';
    const codificado = codificarCabecera(original);
    expect(codificado.replace(/\r\n /g, '')).toMatch(
      /^=\?UTF-8\?B\?.+\?=$/,
    );
    expect(asuntoDecodificado(`Subject: ${codificado}`)).toBe(original);
  });

  it('codifica solo el display-name y deja el email intacto', () => {
    const codificado = codificarDireccion('Santiago Sánchez <rrhh@empresa.com>');
    expect(codificado).toContain('<rrhh@empresa.com>');
    expect(codificado).toMatch(/^=\?UTF-8\?B\?.+\?= <rrhh@empresa\.com>$/);
  });

  it('deja direcciones simples intactas', () => {
    expect(codificarDireccion('rrhh@empresa.com')).toBe('rrhh@empresa.com');
  });
});

describe('GET /api/gmail/mensajes', () => {
  it('responde 401 sin autenticación', async () => {
    const res = await request(app).get('/api/gmail/mensajes');
    expect(res.status).toBe(401);
  });

  it('lista mensajes por defecto', async () => {
    fetchMock.mockClear();
    const res = await request(app)
      .get('/api/gmail/mensajes')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    const url = String(fetchMock.mock.calls[0]![0]);
    expect(url).toContain('maxResults=10');
  });

  it('respeta max_results y q', async () => {
    fetchMock.mockClear();
    await request(app)
      .get('/api/gmail/mensajes?max_results=5&q=entrevista')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const url = String(fetchMock.mock.calls[0]![0]);
    expect(url).toContain('maxResults=5');
    expect(url).toContain('q=entrevista');
  });
});

describe('GET /api/gmail/mensajes/:id', () => {
  it('responde 401 sin autenticación', async () => {
    const res = await request(app).get('/api/gmail/mensajes/gmail-msg-1');
    expect(res.status).toBe(401);
  });

  it('devuelve el detalle del mensaje decodificado', async () => {
    const res = await request(app)
      .get('/api/gmail/mensajes/gmail-msg-1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.cabeceras.asunto).toBe('Tu postulación');
    expect(res.body.data.cuerpo).toContain('entrevista');
    expect(res.body.data.fecha).toBeTruthy();
  });

  it('explica el 403 cuando la Gmail API no está habilitada', async () => {
    const res = await request(app)
      .get('/api/gmail/mensajes/forbidden-api')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(502);
    expect(res.body.error.message).toContain('no está habilitada');
    expect(JSON.stringify(res.body.error.details)).toContain('PERMISSION_DENIED');
  });

  it('explica el 403 por superación de cuota', async () => {
    const res = await request(app)
      .get('/api/gmail/mensajes/quota-limit')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(503);
    expect(res.body.error.message).toContain('cuota');
  });
});