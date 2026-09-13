import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import type { EmpresaRow, PostulacionRow, UsuarioRow } from '../src/types/models';
import { resetTestDb } from './helpers/test-db';

let usuario: UsuarioRow;
let empresa: EmpresaRow;

beforeAll(async () => {
  await resetTestDb(db);
  usuario = await UsuarioModel.crear({
    nombre: 'Postulante',
    email: 'postulante@test.com',
  });
  const res = await request(app)
    .post('/api/empresas')
    .send({ nombre: 'Postulaciones SA' });
  empresa = res.body.data as EmpresaRow;
});

afterAll(async () => {
  await db.close();
});

function payloadPostulacion(overrides: Record<string, unknown> = {}) {
  return {
    usuario_id: usuario.id,
    empresa_id: empresa.id,
    puesto: 'Backend Developer',
    ...overrides,
  };
}

describe('Postulaciones — POST', () => {
  it('crea una postulación con valores por defecto', async () => {
    const res = await request(app)
      .post('/api/postulaciones')
      .send(payloadPostulacion());
    expect(res.status).toBe(201);
    expect(res.body.data.puesto).toBe('Backend Developer');
    expect(res.body.data.estado).toBe('pendiente');
    expect(res.body.data.interes).toBe('medio');
    expect(res.body.data.respondio).toBe(0);
  });

  it('respeta estado e interés explícitos', async () => {
    const res = await request(app)
      .post('/api/postulaciones')
      .send(
        payloadPostulacion({ estado: 'entrevista', interes: 'alto' }),
      );
    expect(res.status).toBe(201);
    expect(res.body.data.estado).toBe('entrevista');
    expect(res.body.data.interes).toBe('alto');
  });

  it('responde 404 si el usuario no existe', async () => {
    const res = await request(app)
      .post('/api/postulaciones')
      .send(payloadPostulacion({ usuario_id: 999999 }));
    expect(res.status).toBe(404);
  });

  it('responde 404 si la empresa no existe', async () => {
    const res = await request(app)
      .post('/api/postulaciones')
      .send(payloadPostulacion({ empresa_id: 999999 }));
    expect(res.status).toBe(404);
  });

  it('rechaza un estado inválido', async () => {
    const res = await request(app)
      .post('/api/postulaciones')
      .send(payloadPostulacion({ estado: 'no-existe' }));
    expect(res.status).toBe(400);
  });
});

describe('Postulaciones — GET (listado y filtros)', () => {
  it('lista postulaciones', async () => {
    const res = await request(app).get('/api/postulaciones');
    expect(res.status).toBe(200);
    expect((res.body.data as PostulacionRow[]).length).toBeGreaterThanOrEqual(2);
  });

  it('filtra por estado', async () => {
    const res = await request(app)
      .get('/api/postulaciones')
      .query({ estado: 'entrevista' });
    expect(res.status).toBe(200);
    const lista = res.body.data as PostulacionRow[];
    expect(lista.length).toBeGreaterThanOrEqual(1);
    for (const p of lista) {
      expect(p.estado).toBe('entrevista');
    }
  });

  it('filtra por empresa', async () => {
    const res = await request(app)
      .get('/api/postulaciones')
      .query({ empresa_id: empresa.id });
    expect(res.status).toBe(200);
    for (const p of res.body.data as PostulacionRow[]) {
      expect(p.empresa_id).toBe(empresa.id);
    }
  });

  it('rechaza un filtro de estado inválido', async () => {
    const res = await request(app)
      .get('/api/postulaciones')
      .query({ estado: 'nada' });
    expect(res.status).toBe(400);
  });

  it('responde 404 para una postulación inexistente', async () => {
    const res = await request(app).get('/api/postulaciones/999999');
    expect(res.status).toBe(404);
  });
});

describe('Postulaciones — PUT', () => {
  it('actualiza puesto y estado', async () => {
    const creada = await creaPostulacion();
    const res = await request(app)
      .put(`/api/postulaciones/${creada.id}`)
      .send({ puesto: 'Senior Backend', estado: 'en_proceso' });
    expect(res.status).toBe(200);
    expect(res.body.data.puesto).toBe('Senior Backend');
    expect(res.body.data.estado).toBe('en_proceso');
  });

  it('responde 404 si el nuevo usuario no existe', async () => {
    const creada = await creaPostulacion();
    const res = await request(app)
      .put(`/api/postulaciones/${creada.id}`)
      .send({ usuario_id: 999999 });
    expect(res.status).toBe(404);
  });

  it('responde 404 si la nueva empresa no existe', async () => {
    const creada = await creaPostulacion();
    const res = await request(app)
      .put(`/api/postulaciones/${creada.id}`)
      .send({ empresa_id: 999999 });
    expect(res.status).toBe(404);
  });
});

describe('Postulaciones — DELETE', () => {
  it('elimina una postulación existente', async () => {
    const creada = await creaPostulacion();
    const res = await request(app).delete(`/api/postulaciones/${creada.id}`);
    expect(res.status).toBe(204);
    expect((await request(app).get(`/api/postulaciones/${creada.id}`)).status).toBe(404);
  });

  it('responde 404 al eliminar una inexistente', async () => {
    const res = await request(app).delete('/api/postulaciones/999999');
    expect(res.status).toBe(404);
  });
});

describe('Postulaciones — GET /:id/relacion', () => {
  it('devuelve la línea de tiempo con emails y seguimientos', async () => {
    const postulacion = await creaPostulacion();

    await request(app).post('/api/emails').send({
      postulacion_id: postulacion.id,
      tipo: 'seguimiento',
      tipo_seguimiento: 'novedad',
      remitente: 'a@a.com',
      destinatario: 'b@b.com',
      fecha: '2026-09-10T10:00:00Z',
      enviado: 1,
    });
    await request(app).post('/api/seguimientos').send({
      postulacion_id: postulacion.id,
      fecha_programada: '2026-09-25',
      tipo_seguimiento: 'nuevo_proyecto',
    });

    const res = await request(app).get(`/api/postulaciones/${postulacion.id}/relacion`);
    expect(res.status).toBe(200);
    expect(res.body.data.postulacion.id).toBe(postulacion.id);

    const emails = res.body.data.emails as Array<{ tipo_seguimiento: string | null }>;
    expect(emails.length).toBeGreaterThanOrEqual(1);
    expect(emails[0]!.tipo_seguimiento).toBe('novedad');

    const seguimientos = res.body.data.seguimientos as Array<{ tipo_seguimiento: string }>;
    expect(seguimientos.length).toBeGreaterThanOrEqual(1);
    expect(seguimientos.some((s) => s.tipo_seguimiento === 'nuevo_proyecto')).toBe(true);
  });

  it('responde 404 para una postulación inexistente', async () => {
    const res = await request(app).get('/api/postulaciones/999999/relacion');
    expect(res.status).toBe(404);
  });
});

async function creaPostulacion(): Promise<PostulacionRow> {
  const res = await request(app)
    .post('/api/postulaciones')
    .send(payloadPostulacion({ puesto: `Puesto ${Date.now()}` }));
  return res.body.data as PostulacionRow;
}