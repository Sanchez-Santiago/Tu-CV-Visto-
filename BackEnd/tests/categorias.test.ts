import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import type { CategoriaRow } from '../src/types/models';
import { resetTestDb } from './helpers/test-db';
import { headersDe } from './helpers/auth';

let authHeaders: { Authorization: string };

beforeAll(async () => {
  await resetTestDb(db);
  const usuario = await UsuarioModel.crear({
    nombre: 'Usuario Categorías',
    email: 'categorias@test.com',
  });
  authHeaders = await headersDe(usuario.id);
});

afterAll(async () => {
  await db.close();
});

describe('GET /health', () => {
  it('responde ok con la base disponible', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('Categorías — GET', () => {
  it('lista las categorías sembradas', async () => {
    const res = await request(app).get('/api/categorias').set(authHeaders);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(14);
  });

  it('responde 401 sin autenticación', async () => {
    const res = await request(app).get('/api/categorias');
    expect(res.status).toBe(401);
  });

  it('responde 404 para una categoría inexistente', async () => {
    const res = await request(app)
      .get('/api/categorias/999999')
      .set(authHeaders);
    expect(res.status).toBe(404);
  });

  it('rechaza un id no numérico', async () => {
    const res = await request(app).get('/api/categorias/abc').set(authHeaders);
    expect(res.status).toBe(400);
  });
});

describe('Categorías — POST', () => {
  it('crea una categoría nueva', async () => {
    const res = await request(app)
      .post('/api/categorias')
      .set(authHeaders)
      .send({ nombre: 'Machine Learning' });
    expect(res.status).toBe(201);
    expect(res.body.data.nombre).toBe('Machine Learning');
    expect(res.body.data.id).toBeTypeOf('number');
  });

  it('rechaza duplicados (ignorando mayúsculas)', async () => {
    const res = await request(app)
      .post('/api/categorias')
      .set(authHeaders)
      .send({ nombre: 'machine learning' });
    expect(res.status).toBe(409);
  });

  it('rechaza un cuerpo sin nombre', async () => {
    const res = await request(app).post('/api/categorias').set(authHeaders).send({});
    expect(res.status).toBe(400);
    expect(res.body.error.details).toBeDefined();
  });

  it('rechaza un nombre vacío', async () => {
    const res = await request(app)
      .post('/api/categorias')
      .set(authHeaders)
      .send({ nombre: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('Categorías — PUT', () => {
  it('actualiza una categoría existente', async () => {
    const creada = await creaCategoria('Data Engineering');
    const res = await request(app)
      .put(`/api/categorias/${creada.id}`)
      .set(authHeaders)
      .send({ nombre: 'Ingeniería de Datos' });
    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Ingeniería de Datos');
    await CategoriaModelHelper.eliminar(creada.id);
  });

  it('responde 404 al actualizar una inexistente', async () => {
    const res = await request(app)
      .put('/api/categorias/999999')
      .set(authHeaders)
      .send({ nombre: 'Cualquiera' });
    expect(res.status).toBe(404);
  });
});

describe('Categorías — DELETE', () => {
  it('elimina una categoría existente', async () => {
    const creada = await creaCategoria('Cybersecurity');
    const res = await request(app)
      .delete(`/api/categorias/${creada.id}`)
      .set(authHeaders);
    expect(res.status).toBe(204);

    const despues = await request(app)
      .get(`/api/categorias/${creada.id}`)
      .set(authHeaders);
    expect(despues.status).toBe(404);
  });

  it('responde 404 al eliminar una inexistente', async () => {
    const res = await request(app)
      .delete('/api/categorias/999999')
      .set(authHeaders);
    expect(res.status).toBe(404);
  });
});

async function creaCategoria(nombre: string): Promise<CategoriaRow> {
  const res = await request(app)
    .post('/api/categorias')
    .set(authHeaders)
    .send({ nombre });
  return res.body.data as CategoriaRow;
}

const CategoriaModelHelper = {
  async eliminar(id: number): Promise<void> {
    await db.execute({
      sql: 'DELETE FROM categorias_trabajo WHERE id = ?',
      args: [id],
    });
  },
};