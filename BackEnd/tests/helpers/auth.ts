import type { Express } from 'express';
import request from 'supertest';
import { firmarToken } from '../../src/utils/jwt';

export async function headersDe(
  usuarioId: number,
  email = 'test@test.com',
  nombre = 'Usuario de Test',
): Promise<{ Authorization: string }> {
  const token = await firmarToken({
    usuario_id: usuarioId,
    email,
    nombre,
  });
  return { Authorization: `Bearer ${token}` };
}

type Headers = Record<string, string>;

/**
 * Equivalente a `request(app)` pero con el Authorization ya puesto, para que
 * las rutas protegidas (empresas, contactos, postulaciones, emails y
 * seguimientos)Respondan 200 en vez de 401.
 */
export function api(app: Express, headers: Headers) {
  return {
    get: (url: string) => request(app).get(url).set(headers),
    post: (url: string) => request(app).post(url).set(headers),
    put: (url: string) => request(app).put(url).set(headers),
    patch: (url: string) => request(app).patch(url).set(headers),
    delete: (url: string) => request(app).delete(url).set(headers),
  };
}
