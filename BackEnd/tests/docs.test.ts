import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app';

describe('GET / (home)', () => {
  it('devuelve la página home con enlaces a docs', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Backend de CVisto');
    expect(res.text).toContain('href="/docs"');
  });
});

describe('GET /docs', () => {
  it('devuelve la página de documentación con endpoints y ejemplos', async () => {
    const res = await request(app).get('/docs');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Documentación de la API');
    expect(res.text).toContain('Gmail (enviar y leer correos reales)');
    expect(res.text).toContain('<span class="ruta">/api/gmail/enviar</span>');
    expect(res.text).toContain('requiere sesión');
    expect(res.text).toContain('Formato de respuesta');
    expect(res.text).toContain('&quot;ok&quot;');
  });
});