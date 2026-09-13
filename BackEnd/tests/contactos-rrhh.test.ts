import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import type { EmpresaRow } from '../src/types/models';
import { resetTestDb } from './helpers/test-db';

let empresa: EmpresaRow;

beforeAll(async () => {
  await resetTestDb(db);
  const res = await request(app)
    .post('/api/empresas')
    .send({ nombre: 'RRHH Corp' });
  empresa = res.body.data as EmpresaRow;
});

afterAll(async () => {
  await db.close();
});

describe('Contactos RRHH — POST', () => {
  it('crea un contacto para una empresa existente', async () => {
    const res = await request(app)
      .post('/api/contactos-rrhh')
      .send({
        empresa_id: empresa.id,
        nombre: 'Paula Positieri',
        email: 'paula@rrhhcorp.com',
        cargo: 'Recruiter',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.nombre).toBe('Paula Positieri');
  });

  it('responde 404 si la empresa no existe', async () => {
    const res = await request(app)
      .post('/api/contactos-rrhh')
      .send({ empresa_id: 999999, nombre: 'A', email: 'a@a.com' });
    expect(res.status).toBe(404);
  });

  it('rechaza un email duplicado en la misma empresa', async () => {
    const res = await request(app)
      .post('/api/contactos-rrhh')
      .send({
        empresa_id: empresa.id,
        nombre: 'Paula Dup',
        email: 'paula@rrhhcorp.com',
      });
    expect(res.status).toBe(409);
  });

  it('rechaza un email inválido', async () => {
    const res = await request(app)
      .post('/api/contactos-rrhh')
      .send({ empresa_id: empresa.id, nombre: 'A', email: 'no-es-email' });
    expect(res.status).toBe(400);
  });
});

describe('Contactos RRHH — GET (listado)', () => {
  it('lista todos los contactos', async () => {
    const res = await request(app).get('/api/contactos-rrhh');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('filtra por empresa_id', async () => {
    const res = await request(app)
      .get('/api/contactos-rrhh')
      .query({ empresa_id: empresa.id });
    expect(res.status).toBe(200);
    for (const c of res.body.data as Array<{ empresa_id: number }>) {
      expect(c.empresa_id).toBe(empresa.id);
    }
  });

  it('responde 404 si empresa_id no existe', async () => {
    const res = await request(app)
      .get('/api/contactos-rrhh')
      .query({ empresa_id: 999999 });
    expect(res.status).toBe(404);
  });
});

describe('Contactos RRHH — listado por empresa', () => {
  it('lista los contactos vía GET /api/empresas/:id/contactos', async () => {
    const res = await request(app).get(`/api/empresas/${empresa.id}/contactos`);
    expect(res.status).toBe(200);
    expect((res.body.data as unknown[]).length).toBeGreaterThanOrEqual(1);
  });

  it('responde 404 si la empresa no existe', async () => {
    const res = await request(app).get('/api/empresas/999999/contactos');
    expect(res.status).toBe(404);
  });
});

describe('Contactos RRHH — PUT', () => {
  it('actualiza el cargo de un contacto', async () => {
    const creado = await creaContacto('Ariana Encarnacion', 'ariana@rrhhcorp.com');
    const res = await request(app)
      .put(`/api/contactos-rrhh/${creado.id}`)
      .send({ cargo: 'Talent Acquisition Lead' });
    expect(res.status).toBe(200);
    expect(res.body.data.cargo).toBe('Talent Acquisition Lead');
  });

  it('responde 409 al cambiar el email por uno duplicado', async () => {
    const original = await creaContacto('María López', 'maria@rrhhcorp.com');
    const res = await request(app)
      .put(`/api/contactos-rrhh/${original.id}`)
      .send({ email: 'paula@rrhhcorp.com' });
    expect(res.status).toBe(409);
  });
});

describe('Contactos RRHH — DELETE', () => {
  it('elimina un contacto existente', async () => {
    const creado = await creaContacto('Para Borrar', 'borrar@rrhhcorp.com');
    const res = await request(app).delete(`/api/contactos-rrhh/${creado.id}`);
    expect(res.status).toBe(204);
    expect((await request(app).get(`/api/contactos-rrhh/${creado.id}`)).status).toBe(404);
  });

  it('responde 404 al eliminar un inexistente', async () => {
    const res = await request(app).delete('/api/contactos-rrhh/999999');
    expect(res.status).toBe(404);
  });
});

async function creaContacto(
  nombre: string,
  email: string,
): Promise<{ id: number }> {
  const res = await request(app)
    .post('/api/contactos-rrhh')
    .send({ empresa_id: empresa.id, nombre, email });
  return res.body.data as { id: number };
}