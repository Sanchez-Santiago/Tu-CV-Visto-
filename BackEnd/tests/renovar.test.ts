import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import { firmarToken } from '../src/utils/jwt';
import { resetTestDb } from './helpers/test-db';

const fetchMock = vi.fn(async (url: string | URL) => {
  const ruta = String(url);
  if (ruta.endsWith('/messages/send')) {
    return new Response(
      JSON.stringify({
        id: 'gmail-renov-999',
        threadId: 'thread-renov',
        snippet: 'Hola, seguimos en contacto',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
});

let usuarioId = 0;
let token = '';

function auth(): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  vi.stubGlobal('fetch', fetchMock);
  await resetTestDb(db);

  const usuario = await UsuarioModel.crear({
    nombre: 'Estrategia Renovar',
    email: 'renovar@test.com',
  });
  usuarioId = usuario.id;

  await db.execute({
    sql: `
      INSERT INTO cuentas_google
        (usuario_id, google_id, access_token, refresh_token, token_expires_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    args: [
      usuarioId,
      'google-id-renov',
      'access-token-renov',
      'refresh-token-renov',
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

async function crearEmpresa(nombre: string): Promise<number> {
  const res = await request(app)
    .post('/api/empresas')
    .send({ nombre });
  return res.body.data.id as number;
}

async function crearPostulacion(
  empresaId: number,
  overrides: Record<string, unknown> = {},
): Promise<number> {
  const res = await request(app)
    .post('/api/postulaciones')
    .send({
      usuario_id: usuarioId,
      empresa_id: empresaId,
      puesto: 'Puesto ' + Math.random().toString(36).slice(2, 8),
      ...overrides,
    });
  return res.body.data.id as number;
}

async function registrarEmailSaliente(postulacionId: number): Promise<void> {
  await request(app).post('/api/emails').send({
    postulacion_id: postulacionId,
    tipo: 'seguimiento',
    remitente: 'renovar@test.com',
    destinatario: 'rrhh@empresa.com',
    asunto: 'Primer contacto',
    fecha: new Date().toISOString(),
    enviado: 1,
    gmail_message_id: 'gmail-out-renov',
  });
}

async function crearFirmaImagen(enlace: string): Promise<number> {
  const res = await request(app)
    .post('/api/firmas')
    .set(auth())
    .send({
      nombre: 'Firma Imagen',
      tipo: 'imagen',
      imagen_mime: 'image/png',
      imagen_base64:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      enlace,
    });
  return res.body.data.id as number;
}

describe('POST /api/estrategia/renovar', () => {
  it('requiere autenticación', async () => {
    const res = await request(app)
      .post('/api/estrategia/renovar')
      .send({ items: [{ postulacion_id: 1 }] });
    expect(res.status).toBe(401);
  });

  it('envía renovaciones en lote y actualiza contadores', async () => {
    const empresa = await crearEmpresa('Renovar Lote');
    const postulacionId = await crearPostulacion(empresa);
    await registrarEmailSaliente(postulacionId);

    const res = await request(app)
      .post('/api/estrategia/renovar')
      .set(auth())
      .send({ items: [{ postulacion_id: postulacionId }] });

    expect(res.status).toBe(200);
    expect(res.body.data.enviados).toBe(1);
    expect(res.body.data.emails[0].gmail_message_id).toBe('gmail-renov-999');

    const emails = await request(app).get(
      `/api/emails?postulacion_id=${postulacionId}`,
    );
    const enviados = emails.body.data.filter(
      (e: { enviado: number }) => e.enviado === 1,
    );
    expect(enviados.length).toBe(2);

    const postulacion = await request(app).get(
      `/api/postulaciones/${postulacionId}`,
    );
    expect(postulacion.body.data.cantidad_mails_enviados).toBe(2);
  });

  it('respeta asunto y cuerpo editados por el usuario', async () => {
    const empresa = await crearEmpresa('Renovar Editable');
    const postulacionId = await crearPostulacion(empresa);
    await registrarEmailSaliente(postulacionId);

    const res = await request(app)
      .post('/api/estrategia/renovar')
      .set(auth())
      .send({
        items: [
          {
            postulacion_id: postulacionId,
            asunto: 'Asunto personalizado',
            cuerpo: 'Cuerpo personalizado sin plantilla',
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.emails[0].asunto).toBe('Asunto personalizado');

    const emails = await request(app).get(
      `/api/emails?postulacion_id=${postulacionId}`,
    );
    const ultimo = emails.body.data.find(
      (e: { enviado: number; asunto: string }) =>
        e.enviado === 1 && e.asunto === 'Asunto personalizado',
    );
    expect(ultimo).toBeDefined();
  });

  it('incluye la firma de imagen con enlace normalizado en el envío', async () => {
    const empresa = await crearEmpresa('Renovar Firma');
    const postulacionId = await crearPostulacion(empresa);
    await registrarEmailSaliente(postulacionId);

    const firmaId = await crearFirmaImagen('https://linkedin.com/in/test');
    // Enlace sin esquema (dato viejo o cargado a mano) para verificar la normalización.
    await db.execute({
      sql: 'UPDATE firmas SET enlace = ? WHERE id = ?',
      args: ['www.linkedin.com/in/test', firmaId],
    });

    const res = await request(app)
      .post('/api/estrategia/renovar')
      .set(auth())
      .send({ items: [{ postulacion_id: postulacionId }], firmas: [firmaId] });

    expect(res.status).toBe(200);

    const emails = await request(app).get(
      `/api/emails?postulacion_id=${postulacionId}`,
    );
    const enviado = emails.body.data.find(
      (e: { enviado: number; cuerpo_html: string | null }) =>
        e.enviado === 1 && (e.cuerpo_html ?? '').includes('cid:firma_'),
    );
    expect(enviado).toBeDefined();
    expect(enviado.cuerpo_html).toContain(`cid:firma_${firmaId}`);
    expect(enviado.cuerpo_html).toContain('target="_blank"');
    expect(enviado.cuerpo_html).toContain(
      'href="https://www.linkedin.com/in/test"',
    );
  });

  it('renovar reinicia respondio para un nuevo ciclo de espera', async () => {
    const empresa = await crearEmpresa('Renovar Ciclo');
    const postulacionId = await crearPostulacion(empresa);
    await registrarEmailSaliente(postulacionId);
    await db.execute({
      sql: 'UPDATE postulaciones SET respondio = 1 WHERE id = ?',
      args: [postulacionId],
    });

    const res = await request(app)
      .post('/api/estrategia/renovar')
      .set(auth())
      .send({ items: [{ postulacion_id: postulacionId }] });

    expect(res.status).toBe(200);

    const postulacion = await request(app).get(
      `/api/postulaciones/${postulacionId}`,
    );
    expect(postulacion.body.data.respondio).toBe(0);
  });

  it('devuelve 400 si no hay destinatario para la postulación', async () => {
    const empresa = await crearEmpresa('Renovar Sin Destino');
    const postulacionId = await crearPostulacion(empresa, {
      cantidad_mails_enviados: 1,
    });

    const res = await request(app)
      .post('/api/estrategia/renovar')
      .set(auth())
      .send({ items: [{ postulacion_id: postulacionId }] });
    expect(res.status).toBe(400);
  });

  it('devuelve 404 ante una postulación ajena', async () => {
    const res = await request(app)
      .post('/api/estrategia/renovar')
      .set(auth())
      .send({ items: [{ postulacion_id: 999999 }] });
    expect(res.status).toBe(404);
  });
});