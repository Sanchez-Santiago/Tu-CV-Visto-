import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import { firmarToken } from '../src/utils/jwt';
import { resetTestDb } from './helpers/test-db';

function base64url(texto: string): string {
  return Buffer.from(texto, 'utf8').toString('base64url');
}

const fetchMock = vi.fn(async (url: string | URL) => {
  const ruta = String(url);
  if (ruta.includes('/messages/gmail-msg-10')) {
    return new Response(
      JSON.stringify({
        id: 'gmail-msg-10',
        threadId: 'thread-10',
        snippet: 'Entrevista la semana que viene',
        internalDate: String(Date.now()),
        payload: {
          headers: [
            { name: 'From', value: 'RRHH Empresa <rrhh@empresa.com>' },
            { name: 'To', value: 'candidato@test.com' },
            { name: 'Subject', value: 'Siguiente paso' },
          ],
          body: {
            data: base64url(
              'Te invitamos a una entrevista el próximo lunes a las 10hs.',
            ),
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (ruta.includes('/messages/gmail-msg-20')) {
    return new Response(
      JSON.stringify({
        id: 'gmail-msg-20',
        threadId: 'thread-20',
        snippet: 'Gracias por tu interés',
        internalDate: String(Date.now()),
        payload: {
          headers: [
            { name: 'From', value: 'Otro <otro@correo.com>' },
            { name: 'To', value: 'candidato@test.com' },
            { name: 'Subject', value: 'Resultado' },
          ],
          body: {
            data: base64url(
              'Gracias por tu interés. No preseleccionado, otro correo.',
            ),
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (ruta.includes('/messages/gmail-sent-30')) {
    return new Response(
      JSON.stringify({
        id: 'gmail-sent-30',
        threadId: 'thread-30',
        snippet: 'Candidatura Backend',
        internalDate: String(Date.now()),
        payload: {
          headers: [
            { name: 'From', value: 'Candidato Sync <candidato@test.com>' },
            { name: 'To', value: 'RRHH Empresa <rrhh@empresa.com>' },
            { name: 'Subject', value: 'Candidatura Backend' },
          ],
          body: {
            data: base64url('Les escribo por la vacante de Backend.'),
          },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (ruta.includes('/messages?')) {
    if (decodeURIComponent(ruta).includes('in:sent')) {
      return new Response(
        JSON.stringify({ messages: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response(
      JSON.stringify({
        messages: [
          { id: 'gmail-msg-10', threadId: 'thread-10', snippet: 'Entrevista' },
          { id: 'gmail-msg-20', threadId: 'thread-20', snippet: 'Gracias' },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
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
    nombre: 'Candidato Sync',
    email: 'candidato@test.com',
  });
  usuarioId = usuario.id;

  const empresa = await db.execute({
    sql: "INSERT INTO empresas (nombre) VALUES (?) RETURNING id",
    args: ['Empresa Sync'],
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
      'google-id-sync',
      'access-token-sync',
      'refresh-token-sync',
      new Date(Date.now() + 3_600_000).toISOString(),
    ],
  });

  await request(app).post('/api/emails').send({
    postulacion_id: postulacionId,
    tipo: 'seguimiento',
    remitente: usuario.email,
    destinatario: 'rrhh@empresa.com',
    fecha: new Date().toISOString(),
    enviado: 1,
    gmail_message_id: 'gmail-out-10',
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

describe('GET /api/gmail/sincronizar', () => {
  it('responde 401 sin autenticación', async () => {
    const res = await request(app).get('/api/gmail/sincronizar');
    expect(res.status).toBe(401);
  });

  it('importa respuestas de Gmail, las clasifica y marca respondio', async () => {
    const res = await request(app)
      .get('/api/gmail/sincronizar')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.importados).toBe(2);
    expect(res.body.data.sinMatch).toBe(1);
    expect(res.body.data.estados_actualizados).toBe(1);
    expect(res.body.data.resumen.entrevista).toBe(1);
    expect(res.body.data.resumen.rechazo).toBe(1);
    const detalleMatch = res.body.data.detalle.find(
      (d: { postulacion_id: number | null }) =>
        d.postulacion_id === postulacionId,
    );
    expect(detalleMatch).toBeDefined();
    expect(detalleMatch.estado_anterior).toBe('pendiente');
    expect(detalleMatch.estado_nuevo).toBe('entrevista');

    const postulacion = await request(app).get(
      `/api/postulaciones/${postulacionId}`,
    );
    expect(postulacion.body.data.respondio).toBe(1);
    expect(postulacion.body.data.estado).toBe('entrevista');
  });

  it('guarda el email recibido con tipo respuesta', async () => {
    const res = await request(app).get(
      `/api/emails?postulacion_id=${postulacionId}`,
    );
    const recibido = res.body.data.find(
      (e: { tipo: string }) => e.tipo === 'respuesta',
    );
    expect(recibido).toBeDefined();
    expect(recibido.gmail_message_id).toBe('gmail-msg-10');
    expect(recibido.remitente).toBe('rrhh@empresa.com');
    expect(recibido.enviado).toBe(0);
  });

  it('guarda los emails sin match con postulacion_id null', async () => {
    const res = await request(app).get('/api/emails');
    const sinAsociar = res.body.data.find(
      (e: { gmail_message_id: string }) => e.gmail_message_id === 'gmail-msg-20',
    );
    expect(sinAsociar).toBeDefined();
    expect(sinAsociar.postulacion_id).toBeNull();
    expect(sinAsociar.tipo).toBe('respuesta');
    expect(sinAsociar.enviado).toBe(0);
  });

  it('guarda el contenido completo en cuerpo_html', async () => {
    const res = await request(app).get('/api/emails');
    const recibido = res.body.data.find(
      (e: { gmail_message_id: string }) => e.gmail_message_id === 'gmail-msg-10',
    );
    expect(recibido?.cuerpo_html).toContain('Te invitamos a una entrevista');
    const resumen = res.body.data.find(
      (e: { gmail_message_id: string }) => e.gmail_message_id === 'gmail-msg-20',
    );
    expect(resumen?.cuerpo_html).toContain('No preseleccionado');
  });

  it('crea empresas y contactos automáticamente desde los remitentes', async () => {
    const empresas = await request(app)
      .get('/api/empresas')
      .set('Authorization', `Bearer ${token}`);
    const nombres = empresas.body.data.map((e: { nombre: string }) => e.nombre);
    expect(nombres).toContain('empresa');
    expect(nombres).toContain('correo');

    const contacto = await db.execute({
      sql: 'SELECT * FROM contactos_rrhh WHERE email = ?',
      args: ['rrhh@empresa.com'],
    });
    expect(contacto.rows.length).toBe(1);
  });

  it('es idempotente: no duplica mails ya importados', async () => {
    const res = await request(app)
      .get('/api/gmail/sincronizar')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data.importados).toBe(0);
    expect(res.body.data.yaExistentes).toBe(2);

    const emails = await request(app).get(
      `/api/emails?postulacion_id=${postulacionId}`,
    );
    const recibidos = emails.body.data.filter(
      (e: { tipo: string }) => e.tipo === 'respuesta',
    );
    expect(recibidos.length).toBe(1);
  });

  it('pide como máximo 100 mensajes y no vuelve a descargar los ya importados', async () => {
    fetchMock.mockClear();
    await request(app)
      .get('/api/gmail/sincronizar')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const urls = fetchMock.mock.calls.map(([u]) => String(u));
    expect(
      urls.some((u) => u.includes('/messages?') && u.includes('maxResults=100')),
    ).toBe(true);
    expect(urls.some((u) => u.includes('/messages/gmail-msg-10'))).toBe(false);
    expect(urls.some((u) => u.includes('/messages/gmail-msg-20'))).toBe(false);
  });

  it('pagina hasta traer todos los mensajes de la ventana', async () => {
    let llamadasInbox = 0;
    const mockPagina = vi.fn(async (url: string | URL) => {
      const ruta = String(url);
      if (ruta.includes('/messages?')) {
        const q = new URL(ruta).searchParams.get('q') ?? '';
        if (q.includes('in:sent')) {
          return new Response(JSON.stringify({ messages: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        llamadasInbox += 1;
        if (llamadasInbox === 1) {
          return new Response(
            JSON.stringify({
              messages: [
                { id: 'gmail-pag-1', threadId: 'tp-1', snippet: 'uno' },
              ],
              nextPageToken: 'token-2',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response(
          JSON.stringify({
            messages: [
              { id: 'gmail-pag-2', threadId: 'tp-2', snippet: 'dos' },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (ruta.includes('/messages/gmail-pag-1')) {
        return new Response(
          JSON.stringify({
            id: 'gmail-pag-1',
            threadId: 'tp-1',
            snippet: 'uno',
            internalDate: String(Date.now()),
            payload: {
              headers: [
                { name: 'From', value: 'RRHH Empresa <rrhh@empresa.com>' },
                { name: 'To', value: 'candidato@test.com' },
                { name: 'Subject', value: 'Vacante' },
              ],
              body: { data: base64url('Hola desde la primera página.') },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (ruta.includes('/messages/gmail-pag-2')) {
        return new Response(
          JSON.stringify({
            id: 'gmail-pag-2',
            threadId: 'tp-2',
            snippet: 'dos',
            internalDate: String(Date.now()),
            payload: {
              headers: [
                { name: 'From', value: 'RRHH Empresa <rrhh@empresa.com>' },
                { name: 'To', value: 'candidato@test.com' },
                { name: 'Subject', value: 'Vacante' },
              ],
              body: { data: base64url('Hola desde la segunda página.') },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({ error: 'not found' }), {
        status: 404,
      });
    });
    vi.stubGlobal('fetch', mockPagina);
    try {
      const res = await request(app)
        .get('/api/gmail/sincronizar')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(llamadasInbox).toBeGreaterThanOrEqual(2);
      expect(res.body.data.importados).toBe(2);

      const emails = await request(app).get('/api/emails');
      const ids = emails.body.data.map(
        (e: { gmail_message_id: string }) => e.gmail_message_id,
      );
      expect(ids).toContain('gmail-pag-1');
      expect(ids).toContain('gmail-pag-2');
    } finally {
      vi.stubGlobal('fetch', fetchMock);
    }
  });

  it('importa también los mails enviados por Gmail (in:sent)', async () => {
    const mockEnviados = vi.fn(async (url: string | URL) => {
      const ruta = String(url);
      if (ruta.includes('/messages?')) {
        const q = new URL(ruta).searchParams.get('q') ?? '';
        if (q.includes('in:sent')) {
          return new Response(
            JSON.stringify({
              messages: [
                {
                  id: 'gmail-sent-30',
                  threadId: 'thread-30',
                  snippet: 'Candidatura',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response(JSON.stringify({ messages: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (ruta.includes('/messages/gmail-sent-30')) {
        return new Response(
          JSON.stringify({
            id: 'gmail-sent-30',
            threadId: 'thread-30',
            snippet: 'Candidatura Backend',
            internalDate: String(Date.now()),
            payload: {
              headers: [
                { name: 'From', value: 'Candidato Sync <candidato@test.com>' },
                { name: 'To', value: 'RRHH Empresa <rrhh@empresa.com>' },
                { name: 'Subject', value: 'Candidatura Backend' },
              ],
              body: { data: base64url('Les escribo por la vacante de Backend.') },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({ error: 'not found' }), {
        status: 404,
      });
    });
    vi.stubGlobal('fetch', mockEnviados);
    try {
      const res = await request(app)
        .get('/api/gmail/sincronizar')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.importados).toBe(1);
      expect(res.body.data.resumen.otro).toBe(0);
    } finally {
      vi.stubGlobal('fetch', fetchMock);
    }

    const emails = await request(app).get('/api/emails');
    const enviado = emails.body.data.find(
      (e: { gmail_message_id: string }) => e.gmail_message_id === 'gmail-sent-30',
    );
    expect(enviado).toBeDefined();
    expect(enviado.enviado).toBe(1);
    expect(enviado.remitente).toBe('candidato@test.com');
    expect(enviado.destinatario).toBe('rrhh@empresa.com');
    expect(enviado.postulacion_id).toBe(postulacionId);
    expect(enviado.tipo).toBe('postulacion');
  });

  it('una alerta vinculada no marca respondio en la postulación', async () => {
    const empresaRes = await db.execute({
      sql: 'INSERT INTO empresas (nombre) VALUES (?) RETURNING id',
      args: ['Empresa Alerta'],
    });
    const empresaAlertaId = Number(empresaRes.rows[0]!.id);
    const postRes = await request(app).post('/api/postulaciones').send({
      usuario_id: usuarioId,
      empresa_id: empresaAlertaId,
      puesto: 'Frontend Developer',
    });
    const postulacionAlertaId = postRes.body.data.id as number;

    const mockAlerta = vi.fn(async (url: string | URL) => {
      const ruta = String(url);
      if (ruta.includes('/messages?')) {
        const q = new URL(ruta).searchParams.get('q') ?? '';
        if (q.includes('in:sent')) {
          return new Response(JSON.stringify({ messages: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(
          JSON.stringify({
            messages: [
              {
                id: 'gmail-alert-40',
                threadId: 'thread-40',
                snippet: 'Alerta',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (ruta.includes('/messages/gmail-alert-40')) {
        return new Response(
          JSON.stringify({
            id: 'gmail-alert-40',
            threadId: 'thread-40',
            snippet: 'Trabajo Copado',
            internalDate: String(Date.now()),
            payload: {
              headers: [
                {
                  name: 'From',
                  value: 'Trabajo Copado <alertas@empresaalerta.com>',
                },
                { name: 'To', value: 'candidato@test.com' },
                {
                  name: 'Subject',
                  value: 'Trabajo Copado: Frontend Developer',
                },
              ],
              body: {
                data: base64url('Nuevas ofertas que te pueden interesar.'),
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({ error: 'not found' }), {
        status: 404,
      });
    });
    vi.stubGlobal('fetch', mockAlerta);
    try {
      const res = await request(app)
        .get('/api/gmail/sincronizar')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.importados).toBe(1);
    } finally {
      vi.stubGlobal('fetch', fetchMock);
    }

    const emails = await request(app).get('/api/emails');
    const alerta = emails.body.data.find(
      (e: { gmail_message_id: string }) =>
        e.gmail_message_id === 'gmail-alert-40',
    );
    expect(alerta).toBeDefined();
    expect(alerta.postulacion_id).toBe(postulacionAlertaId);
    // El sync solo persiste tipo_respuesta para rechazo/entrevista;
    // lo importante es que no marcó respondio.
    expect(alerta.tipo_respuesta).toBeNull();

    const postulacion = await request(app).get(
      `/api/postulaciones/${postulacionAlertaId}`,
    );
    expect(postulacion.body.data.respondio).toBe(0);
    expect(postulacion.body.data.estado).toBe('pendiente');
  });

  it('usa la ventana de días solicitada (60 días) en las consultas a Gmail', async () => {
    fetchMock.mockClear();
    await request(app)
      .get('/api/gmail/sincronizar?dias=60')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const urls = fetchMock.mock.calls.map(([u]) =>
      decodeURIComponent(String(u)),
    );
    expect(urls.some((u) => u.includes('newer_than:60d'))).toBe(true);
    expect(urls.some((u) => u.includes('newer_than:14d'))).toBe(false);
  });
});