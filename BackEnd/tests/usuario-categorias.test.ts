import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import type { UsuarioRow } from '../src/types/models';
import { resetTestDb } from './helpers/test-db';

let usuario: UsuarioRow;
let categoriaId: number;

beforeAll(async () => {
  await resetTestDb(db);

  usuario = await UsuarioModel.crear({
    nombre: 'Santiago Sánchez',
    email: 'santiago@test.com',
  });

  const fila = await db.execute(
    'SELECT id FROM categorias_trabajo ORDER BY id ASC LIMIT 1',
  );
  categoriaId = Number(fila.rows[0]?.id);
});

afterAll(async () => {
  await db.close();
});

describe('usuario_categorias — POST /api/usuarios/:usuarioId/categorias', () => {
  it('asigna una categoría a un usuario', async () => {
    const res = await request(app)
      .post(`/api/usuarios/${usuario.id}/categorias`)
      .send({ categoria_id: categoriaId });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(categoriaId);
  });

  it('rechaza asignar dos veces la misma categoría', async () => {
    const res = await request(app)
      .post(`/api/usuarios/${usuario.id}/categorias`)
      .send({ categoria_id: categoriaId });
    expect(res.status).toBe(409);
  });

  it('responde 404 si el usuario no existe', async () => {
    const res = await request(app)
      .post('/api/usuarios/999999/categorias')
      .send({ categoria_id: categoriaId });
    expect(res.status).toBe(404);
  });

  it('responde 404 si la categoría no existe', async () => {
    const res = await request(app)
      .post(`/api/usuarios/${usuario.id}/categorias`)
      .send({ categoria_id: 999999 });
    expect(res.status).toBe(404);
  });
});

describe('usuario_categorias — GET', () => {
  it('lista las categorías del usuario', async () => {
    const res = await request(app).get(`/api/usuarios/${usuario.id}/categorias`);
    expect(res.status).toBe(200);
    expect((res.body.data as unknown[]).length).toBe(1);
  });

  it('responde 404 si el usuario no existe', async () => {
    const res = await request(app).get('/api/usuarios/999999/categorias');
    expect(res.status).toBe(404);
  });
});

describe('usuario_categorias — DELETE', () => {
  it('quita una categoría asignada', async () => {
    const res = await request(app).delete(
      `/api/usuarios/${usuario.id}/categorias/${categoriaId}`,
    );
    expect(res.status).toBe(204);
  });

  it('responde 404 si la categoría no estaba asignada', async () => {
    const res = await request(app).delete(
      `/api/usuarios/${usuario.id}/categorias/${categoriaId}`,
    );
    expect(res.status).toBe(404);
  });
});