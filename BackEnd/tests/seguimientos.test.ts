import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import type { EmpresaRow, PostulacionRow, SeguimientoRow, UsuarioRow } from '../src/types/models';
import { resetTestDb } from './helpers/test-db';

let usuario: UsuarioRow;
let empresa: EmpresaRow;
let postulacion: PostulacionRow;

beforeAll(async () => {
  await resetTestDb(db);

  usuario = await UsuarioModel.crear({
    nombre: 'Candidato Seguim.',
    email: 'seguimiento@test.com',
  });
  const resEmpresa = await request(app)
    .post('/api/empresas')
    .send({ nombre: 'Empresa Seguim.' });
  empresa = resEmpresa.body.data as EmpresaRow;

  const resPost = await request(app)
    .post('/api/postulaciones')
    .send({
      usuario_id: usuario.id,
      empresa_id: empresa.id,
      puesto: 'Data Analyst',
    });
  postulacion = resPost.body.data as PostulacionRow;
});

afterAll(async () => {
  await db.close();
});

describe('Seguimientos — POST', () => {
  it('crea un seguimiento pendiente con aprobación', async () => {
    const res = await request(app)
      .post('/api/seguimientos')
      .send({
        postulacion_id: postulacion.id,
        fecha_programada: '2026-09-13',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.requiere_aprobacion).toBe(1);
    expect(res.body.data.enviado).toBe(0);
    expect(res.body.data.tipo_seguimiento).toBe('consulta');
  });

  it('rechaza una fecha_programada con formato inválido', async () => {
    const res = await request(app)
      .post('/api/seguimientos')
      .send({
        postulacion_id: postulacion.id,
        fecha_programada: '13-09-2026',
      });
    expect(res.status).toBe(400);
  });

  it('responde 404 si la postulación no existe', async () => {
    const res = await request(app)
      .post('/api/seguimientos')
      .send({
        postulacion_id: 999999,
        fecha_programada: '2026-09-13',
      });
    expect(res.status).toBe(404);
  });
});

describe('Seguimientos — GET', () => {
  it('lista y filtra por postulación', async () => {
    await creaSeguimiento('2026-09-13');
    const res = await request(app).get('/api/seguimientos');
    expect((res.body.data as SeguimientoRow[]).length).toBeGreaterThanOrEqual(1);

    const deLa = await request(app)
      .get('/api/seguimientos')
      .query({ postulacion_id: postulacion.id });
    for (const s of deLa.body.data as SeguimientoRow[]) {
      expect(s.postulacion_id).toBe(postulacion.id);
    }
  });

  it('expone /pendientes', async () => {
    const res = await request(app).get('/api/seguimientos/pendientes');
    expect(res.status).toBe(200);
    for (const s of res.body.data as SeguimientoRow[]) {
      expect(s.enviado).toBe(0);
    }
  });

  it('responde 404 para un seguimiento inexistente', async () => {
    const res = await request(app).get('/api/seguimientos/999999');
    expect(res.status).toBe(404);
  });
});

describe('Seguimientos — PUT', () => {
  it('asigna fecha de envío automáticamente al marcarlo como enviado', async () => {
    const creado = await creaSeguimiento('2026-09-20');
    const res = await request(app)
      .put(`/api/seguimientos/${creado.id}`)
      .send({ enviado: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.enviado).toBe(1);
    expect(res.body.data.fecha_envio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('respeta una fecha de envío explícita', async () => {
    const creado = await creaSeguimiento('2026-09-21');
    const res = await request(app)
      .put(`/api/seguimientos/${creado.id}`)
      .send({ enviado: 1, fecha_envio: '2026-09-21' });
    expect(res.body.data.fecha_envio).toBe('2026-09-21');
  });
});

describe('Seguimientos — DELETE', () => {
  it('elimina un seguimiento existente', async () => {
    const creado = await creaSeguimiento('2026-10-01');
    expect((await request(app).delete(`/api/seguimientos/${creado.id}`)).status).toBe(204);
    expect((await request(app).get(`/api/seguimientos/${creado.id}`)).status).toBe(404);
  });

  it('responde 404 al eliminar un inexistente', async () => {
    const res = await request(app).delete('/api/seguimientos/999999');
    expect(res.status).toBe(404);
  });
});

async function creaSeguimiento(fechaProgramada: string): Promise<SeguimientoRow> {
  const res = await request(app)
    .post('/api/seguimientos')
    .send({ postulacion_id: postulacion.id, fecha_programada: fechaProgramada });
  return res.body.data as SeguimientoRow;
}