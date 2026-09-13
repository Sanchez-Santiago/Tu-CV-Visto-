import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import type { PostulacionRow, UsuarioRow } from '../src/types/models';
import { firmarToken } from '../src/utils/jwt';
import { resetTestDb } from './helpers/test-db';

let usuario: UsuarioRow;
let token = '';

function addDays(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

async function crearEmpresa(nombre: string, cadencia?: number): Promise<number> {
  const res = await request(app)
    .post('/api/empresas')
    .send({ nombre, ...(cadencia ? { cadencia_contacto: cadencia } : {}) });
  return res.body.data.id as number;
}

async function crearPostulacion(
  empresaId: number,
  overrides: Record<string, unknown> = {},
): Promise<PostulacionRow> {
  const res = await request(app)
    .post('/api/postulaciones')
    .send({
      usuario_id: usuario.id,
      empresa_id: empresaId,
      puesto: 'Puesto ' + Math.random().toString(36).slice(2, 8),
      ...overrides,
    });
  return res.body.data as PostulacionRow;
}

function auth(): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
  await resetTestDb(db);

  usuario = await UsuarioModel.crear({
    nombre: 'Candidato Estrategia',
    email: 'estrategia@test.com',
  });
  token = await firmarToken({
    usuario_id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
  });
});

afterAll(async () => {
  await db.close();
});

describe('GET /api/estrategia/debidas', () => {
  it('lista solo postulaciones que conviene contactar', async () => {
    const hoy = new Date().toISOString().slice(0, 10);

    const e1 = await crearEmpresa('Estrategia A', 10);
    const debida = await crearPostulacion(e1, {
      cantidad_mails_enviados: 1,
      ultimo_contacto: addDays(hoy, -30),
    });

    const e2 = await crearEmpresa('Estrategia B');
    const reciente = await crearPostulacion(e2, {
      cantidad_mails_enviados: 1,
      ultimo_contacto: addDays(hoy, -5),
    });
    const dentroDeCadencia = await crearPostulacion(e2, {
      cantidad_mails_enviados: 1,
      ultimo_contacto: addDays(hoy, -20),
    });

    const res = await request(app).get('/api/estrategia/debidas').set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    const ids = res.body.data.map(
      (d: { postulacion_id: number }) => d.postulacion_id,
    );
    expect(ids).toContain(debida.id);
    expect(ids).not.toContain(reciente.id);
    expect(ids).not.toContain(dentroDeCadencia.id);

    const filaDebida = res.body.data.find(
      (d: { postulacion_id: number }) => d.postulacion_id === debida.id,
    );
    expect(filaDebida.tipo_sugerido).toBe('novedad');
    expect(filaDebida.dias_desde_ultimo_contacto).toBe(30);
  });

  it('recomienda disponibilidad tras 90 días sin contacto y sin envíos', async () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const e = await crearEmpresa('Estrategia Global');
    const vieja = await crearPostulacion(e, {
      cantidad_mails_enviados: 1,
      ultimo_contacto: addDays(hoy, -120),
    });

    const res = await request(app).get('/api/estrategia/debidas').set(auth());
    const fila = res.body.data.find(
      (d: { postulacion_id: number }) => d.postulacion_id === vieja.id,
    );
    expect(fila).toBeDefined();
    expect(fila.tipo_sugerido).toBe('disponibilidad');
  });

  it('marca como debida una postulacion con proxima_contacto vencida', async () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const e = await crearEmpresa('Estrategia Vencida', 30);
    const vencida = await crearPostulacion(e, {
      ultimo_contacto: addDays(hoy, -120),
      proxima_contacto: addDays(hoy, -2),
    });

    const res = await request(app).get('/api/estrategia/debidas').set(auth());
    const fila = res.body.data.find(
      (d: { postulacion_id: number }) => d.postulacion_id === vencida.id,
    );
    expect(fila).toBeDefined();
    expect(fila.dias_para_proximo_contacto).toBe(-2);
  });

  it('no incluye postulaciones cerradas', async () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const e = await crearEmpresa('Estrategia Cerrada', 10);
    const cerrada = await crearPostulacion(e, {
      estado: 'rechazado',
      ultimo_contacto: addDays(hoy, -60),
    });

    const res = await request(app).get('/api/estrategia/debidas').set(auth());
    const ids = res.body.data.map(
      (d: { postulacion_id: number }) => d.postulacion_id,
    );
    expect(ids).not.toContain(cerrada.id);
  });
});