import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import { firmarToken } from '../src/utils/jwt';
import { resetTestDb } from './helpers/test-db';

let usuarioId = 0;
let token = '';

function addDays(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function auth(): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

async function crearEmpresa(nombre: string): Promise<number> {
  const res = await request(app)
    .post('/api/empresas')
    .send({ nombre, cadencia_contacto: 10 });
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

beforeAll(async () => {
  await resetTestDb(db);

  const usuario = await UsuarioModel.crear({
    nombre: 'Estrategia Renov',
    email: 'renov@test.com',
  });
  usuarioId = usuario.id;
  token = await firmarToken({
    usuario_id: usuarioId,
    email: usuario.email,
    nombre: usuario.nombre,
  });
});

afterAll(async () => {
  await db.close();
});

describe('GET /api/estrategia/renovaciones', () => {
  it('requiere autenticación', async () => {
    const res = await request(app).get('/api/estrategia/renovaciones');
    expect(res.status).toBe(401);
  });

  it('sugiere renovación solo para postulaciones vencidas sin respuesta', async () => {
    const hoy = new Date().toISOString().slice(0, 10);

    const e = await crearEmpresa('Renov A');
    const vencida = await crearPostulacion(e, {
      cantidad_mails_enviados: 1,
      ultimo_contacto: addDays(hoy, -40),
    });
    const respondida = await crearPostulacion(e, {
      cantidad_mails_enviados: 1,
      respondio: 1,
      ultimo_contacto: addDays(hoy, -40),
    });
    const cerrada = await crearPostulacion(e, {
      estado: 'rechazado',
      ultimo_contacto: addDays(hoy, -60),
    });

    const res = await request(app)
      .get('/api/estrategia/renovaciones')
      .set(auth());

    expect(res.status).toBe(200);
    const ids = res.body.data.map(
      (r: { postulacion_id: number }) => r.postulacion_id,
    );
    expect(ids).toContain(vencida);
    expect(ids).not.toContain(respondida);
    expect(ids).not.toContain(cerrada);

    const candidata = res.body.data.find(
      (r: { postulacion_id: number }) => r.postulacion_id === vencida,
    );
    expect(candidata).toBeDefined();
    expect(candidata.dias_desde_ultimo_contacto).toBe(40);
    expect(candidata.tipo_sugerido).toBe('novedad');
    expect(candidata.asunto_sugerido).toContain('Actualización');
  });

  it('excluye postulaciones con respuesta detectada', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const e = await crearEmpresa('Renov B');
    const conRespuesta = await crearPostulacion(e, {
      cantidad_mails_enviados: 1,
      respondio: 1,
      ultimo_contacto: addDays(today, -20),
      proxima_contacto: addDays(today, -1),
    });

    const res = await request(app)
      .get('/api/estrategia/renovaciones')
      .set(auth());
    const ids = res.body.data.map(
      (r: { postulacion_id: number }) => r.postulacion_id,
    );
    expect(ids).not.toContain(conRespuesta);
  });

  it('aplica la regla de 48 horas hábiles para postulaciones enviadas sin respuesta', async () => {
    const e = await crearEmpresa('Empresa 48h');
    // Enviada hace 4 días hábiles (más de 48h hábiles) sin respuesta
    const vencida48h = await crearPostulacion(e, {
      cantidad_mails_enviados: 1,
      respondio: 0,
      ultimo_contacto: addDays(new Date().toISOString().slice(0, 10), -7),
    });

    const res1 = await request(app)
      .get('/api/estrategia/renovaciones')
      .set(auth());
    const ids1 = res1.body.data.map(
      (r: { postulacion_id: number }) => r.postulacion_id,
    );
    expect(ids1).toContain(vencida48h);

    // Cuando posteriormente llega una respuesta, se actualiza respondio: 1 y sale de Estrategia
    await db.execute({
      sql: 'UPDATE postulaciones SET respondio = 1, estado = ? WHERE id = ?',
      args: ['en_proceso', vencida48h],
    });

    const res2 = await request(app)
      .get('/api/estrategia/renovaciones')
      .set(auth());
    const ids2 = res2.body.data.map(
      (r: { postulacion_id: number }) => r.postulacion_id,
    );
    expect(ids2).not.toContain(vencida48h);
  });
});

describe('GET /api/estrategia/revision-rechazos y confirmar-rechazo', () => {
  it('detecta rechazos en emails recibidos y permite confirmarlos', async () => {
    const e = await crearEmpresa('Rechazos SA');
    const postulacionId = await crearPostulacion(e, {
      cantidad_mails_enviados: 1,
    });

    await request(app).post('/api/emails').send({
      postulacion_id: postulacionId,
      tipo: 'respuesta',
      remitente: 'rrhh@rechazos.com',
      destinatario: 'renov@test.com',
      asunto: 'Resultado',
      fecha: new Date().toISOString(),
      enviado: 0,
      gmail_message_id: 'gmail-rechazo-1',
      contenido_resumen:
        'Gracias por tu interés. Lamentablemente no preseleccionado.',
    });

    const revision = await request(app)
      .get('/api/estrategia/revision-rechazos')
      .set(auth());
    expect(revision.status).toBe(200);
    const postulacionesConRechazo = revision.body.data.map(
      (r: { postulacion_id: number }) => r.postulacion_id,
    );
    expect(postulacionesConRechazo).toContain(postulacionId);

    const actual = await request(app)
      .post('/api/estrategia/confirmar-rechazo')
      .set(auth())
      .send({ postulacion_id: postulacionId });
    expect(actual.status).toBe(200);
    expect(actual.body.data.estado).toBe('rechazado');
    expect(actual.body.data.respondio).toBe(1);

    const luego = await request(app)
      .get('/api/estrategia/revision-rechazos')
      .set(auth());
    const ids = luego.body.data.map(
      (r: { postulacion_id: number }) => r.postulacion_id,
    );
    expect(ids).not.toContain(postulacionId);
  });

  it('devuelve error si la postulación no pertenece al usuario', async () => {
    const otro = await UsuarioModel.crear({
      nombre: 'Otro Usuario',
      email: 'otro@test.com',
    });
    const e = await crearEmpresa('Empresa Ajena');
    const ajena = await crearPostulacion(e);

    const res = await request(app)
      .post('/api/estrategia/confirmar-rechazo')
      .set('Authorization', `Bearer ${await firmarToken({
        usuario_id: otro.id,
        email: otro.email,
        nombre: otro.nombre,
      })}`)
      .send({ postulacion_id: ajena });
    expect(res.status).toBe(404);
  });
});