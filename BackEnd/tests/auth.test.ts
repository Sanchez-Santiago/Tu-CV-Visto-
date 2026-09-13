import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import { firmarToken } from '../src/utils/jwt';
import { resetTestDb } from './helpers/test-db';

beforeAll(async () => {
  await resetTestDb(db);
});

afterAll(async () => {
  await db.close();
});

describe('GET /auth/google/login', () => {
  it('redirige a la URL de autorización de Google', async () => {
    const res = await request(app).get('/auth/google/login');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('accounts.google.com');
  });
});

describe('GET /auth/google/callback', () => {
  it('responde 400 si falta el parámetro code', async () => {
    const res = await request(app).get('/auth/google/callback');
    expect(res.status).toBe(400);
  });
});

describe('GET /auth/me', () => {
  it('responde 401 sin token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('responde 401 con un token inválido', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer token-invalido');
    expect(res.status).toBe(401);
  });

  it('responde 401 con un token firmado para un usuario inexistente', async () => {
    const token = await firmarToken({
      usuario_id: 999999,
      email: 'ghost@test.com',
      nombre: 'Ghost',
    });
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('responde 200 con un token válido (header Bearer)', async () => {
    const usuario = await UsuarioModel.crear({
      nombre: 'Usuario Autenticado',
      email: 'autenticado@test.com',
    });
    const token = await firmarToken({
      usuario_id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
    });

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('autenticado@test.com');
  });

  it('responde 200 con un token enviado en cookie', async () => {
    const usuario = await UsuarioModel.crear({
      nombre: 'Usuario Cookie',
      email: 'cookie@test.com',
    });
    const token = await firmarToken({
      usuario_id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
    });

    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', `cvisto_token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('cookie@test.com');
  });
});

describe('PUT /api/usuarios/me', () => {
  it('actualiza el perfil del usuario autenticado', async () => {
    const usuario = await UsuarioModel.crear({
      nombre: 'Perfil Edit',
      email: 'perfil@test.com',
    });
    const token = await firmarToken({
      usuario_id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
    });
    const res = await request(app)
      .put('/api/usuarios/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ perfil: 'Desarrollador Full Stack' });
    expect(res.status).toBe(200);
    expect(res.body.data.perfil).toBe('Desarrollador Full Stack');
    expect(res.body.data.email).toBe('perfil@test.com');
  });

  it('responde 401 sin token', async () => {
    const res = await request(app)
      .put('/api/usuarios/me')
      .send({ nombre: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('limpia las cookies de sesión', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(204);
    const setCookie = res.headers['set-cookie'] as unknown[] | undefined;
    expect(Array.isArray(setCookie)).toBe(true);
    const encadenado = (setCookie ?? []).join('; ');
    expect(encadenado).toContain('cvisto_token=');
    expect(encadenado).toContain('cvisto_logged=');
  });
});