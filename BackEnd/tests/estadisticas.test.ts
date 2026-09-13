import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import { firmarToken } from '../src/utils/jwt';
import { resetTestDb } from './helpers/test-db';

let usuarioId = 0;
let token = '';

function auth(): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  await resetTestDb(db);

  const usuario = await UsuarioModel.crear({
    nombre: 'Estrategia Stats',
    email: 'stats@test.com',
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

describe('GET /api/estrategia/estadisticas', () => {
  it('calcula métricas a partir de postulaciones y emails', async () => {
    const e = await crearEmpresa('Stats Empresa');

    // Postulación A: con respuesta positiva (entrevista)
    const a = await crearPostulacion(e, {
      estado: 'entrevista',
      cantidad_mails_enviados: 2,
    });
    await request(app).post('/api/emails').send({
      postulacion_id: a,
      tipo: 'seguimiento',
      remitente: 'stats@test.com',
      destinatario: 'rrhh@stats.com',
      asunto: 'Contacto',
      fecha: new Date().toISOString(),
      enviado: 1,
    });

    // Postulación B: respondió y fue rechazada (confirmada)
    const b = await crearPostulacion(e, {
      estado: 'rechazado',
      respondio: 1,
      cantidad_mails_enviados: 1,
    });
    await request(app).post('/api/emails').send({
      postulacion_id: b,
      tipo: 'respuesta',
      remitente: 'rrhh@stats.com',
      destinatario: 'stats@test.com',
      asunto: 'Resultado',
      fecha: new Date().toISOString(),
      enviado: 0,
      gmail_message_id: 'gmail-stats-1',
      contenido_resumen: 'Gracias por tu interés, no preseleccionado.',
    });

    const res = await request(app)
      .get('/api/estrategia/estadisticas')
      .set(auth());

    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.total_postulaciones).toBe(2);
    expect(d.activas).toBe(1);
    expect(d.respondidas).toBe(2);
    expect(d.mails_enviados).toBe(1);
    expect(d.mails_recibidos).toBe(1);
    expect(d.tasa_respuesta).toBe(100);
    expect(d.positivas).toBe(1);
    expect(d.rechazadas).toBe(1);
    expect(d.entrevistas).toBe(1);

    const mesActual = new Date().toISOString().slice(0, 7);
    expect(d.mails_por_mes).toContainEqual(
      expect.objectContaining({ mes: mesActual, enviados: 1, recibidos: 1 }),
    );

    expect(d.mails_por_puesto.length).toBe(2);
  });

  it('retorna todos los recursos en cero si no hay actividad', async () => {
    const usuarioVacio = await UsuarioModel.crear({
      nombre: 'Estrategia Vacio',
      email: 'vacio@test.com',
    });
    const res = await request(app)
      .get('/api/estrategia/estadisticas')
      .set(
        'Authorization',
        `Bearer ${await firmarToken({
          usuario_id: usuarioVacio.id,
          email: usuarioVacio.email,
          nombre: usuarioVacio.nombre,
        })}`,
      );

    expect(res.status).toBe(200);
    expect(res.body.data.total_postulaciones).toBe(0);
    expect(res.body.data.mails_enviados).toBe(0);
    expect(res.body.data.tasa_respuesta).toBe(0);
  });
});