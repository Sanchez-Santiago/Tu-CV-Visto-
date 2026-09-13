import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import { destinoPostLogin } from '../src/services/auth.service';
import { firmarToken } from '../src/utils/jwt';
import { resetTestDb } from './helpers/test-db';

vi.mock('../src/config/env', async (importOriginal) => {
  const modulo = await importOriginal<typeof import('../src/config/env')>();
  return { ...modulo, esPantallaBetaActiva: () => true };
});

let token = '';

beforeAll(async () => {
  await resetTestDb(db);

  const creado = await UsuarioModel.crear({
    nombre: 'Beta User',
    email: 'beta@test.com',
  });
  token = await firmarToken({
    usuario_id: creado.id,
    email: creado.email,
    nombre: creado.nombre,
  });
});

afterAll(async () => {
  await db.close();
});

describe('destinoPostLogin con PANTALLA_BETA=true', () => {
  it('apunta a la pantalla del backend en vez del frontend', () => {
    expect(destinoPostLogin()).toBe('/auth/callback');
    expect(destinoPostLogin('http://localhost:5173/auth/callback')).toBe(
      '/auth/callback',
    );
  });
});

describe('GET /auth/callback', () => {
  it('responde 401 sin autenticación', async () => {
    const res = await request(app).get('/auth/callback');
    expect(res.status).toBe(401);
  });

  it('muestra la pantalla de fase de prueba con el email del usuario', async () => {
    const res = await request(app)
      .get('/auth/callback')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Fase de prueba');
    expect(res.text).toContain('beta@test.com');
    expect(res.text).toContain('Ir al panel');
  });
});