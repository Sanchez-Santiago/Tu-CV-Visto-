import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import type { UsuarioRow } from '../src/types/models';
import { resetTestDb } from './helpers/test-db';

let usuario: UsuarioRow;
let postulacionId: number;
let contactoId: number;

beforeAll(async () => {
  await resetTestDb(db);

  usuario = await UsuarioModel.crear({
    nombre: 'Usuario Junción',
    email: 'juncion@test.com',
  });

  const empresa = await request(app)
    .post('/api/empresas')
    .send({ nombre: 'Empresa Postulación' });

  const contacto = await request(app)
    .post('/api/contactos-rrhh')
    .send({
      empresa_id: empresa.body.data.id,
      nombre: 'Contacto Postulación',
      email: 'contacto@postulacion.com',
    });
  contactoId = contacto.body.data.id as number;

  const fila = await db.execute({
    sql: `
      INSERT INTO postulaciones (usuario_id, empresa_id, puesto)
      VALUES (?, ?, ?)
    `,
    args: [usuario.id, empresa.body.data.id, 'Backend Developer'],
  });
  postulacionId = Number(fila.lastInsertRowid);
});

afterAll(async () => {
  await db.close();
});

describe('postulacion_contactos — POST', () => {
  it('asigna un contacto RRHH a la postulación', async () => {
    const res = await request(app)
      .post(`/api/postulaciones/${postulacionId}/contactos`)
      .send({ contacto_rrhh_id: contactoId });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(contactoId);
  });

  it('rechaza asignar dos veces el mismo contacto', async () => {
    const res = await request(app)
      .post(`/api/postulaciones/${postulacionId}/contactos`)
      .send({ contacto_rrhh_id: contactoId });
    expect(res.status).toBe(409);
  });

  it('responde 404 si la postulación no existe', async () => {
    const res = await request(app)
      .post('/api/postulaciones/999999/contactos')
      .send({ contacto_rrhh_id: contactoId });
    expect(res.status).toBe(404);
  });

  it('responde 404 si el contacto no existe', async () => {
    const res = await request(app)
      .post(`/api/postulaciones/${postulacionId}/contactos`)
      .send({ contacto_rrhh_id: 999999 });
    expect(res.status).toBe(404);
  });
});

describe('postulacion_contactos — GET', () => {
  it('lista los contactos de la postulación', async () => {
    const res = await request(app).get(
      `/api/postulaciones/${postulacionId}/contactos`,
    );
    expect(res.status).toBe(200);
    expect((res.body.data as unknown[]).length).toBe(1);
  });

  it('responde 404 si la postulación no existe', async () => {
    const res = await request(app).get('/api/postulaciones/999999/contactos');
    expect(res.status).toBe(404);
  });
});

describe('postulacion_contactos — DELETE', () => {
  it('quita un contacto asignado', async () => {
    const res = await request(app).delete(
      `/api/postulaciones/${postulacionId}/contactos/${contactoId}`,
    );
    expect(res.status).toBe(204);
  });

  it('responde 404 si el contacto no estaba asignado', async () => {
    const res = await request(app).delete(
      `/api/postulaciones/${postulacionId}/contactos/${contactoId}`,
    );
    expect(res.status).toBe(404);
  });
});