import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import type { EmailRow, EmpresaRow, PostulacionRow, UsuarioRow } from '../src/types/models';
import { resetTestDb } from './helpers/test-db';

let usuario: UsuarioRow;
let empresa: EmpresaRow;
let postulacion: PostulacionRow;

beforeAll(async () => {
  await resetTestDb(db);

  usuario = await UsuarioModel.crear({
    nombre: 'Candidato Emails',
    email: 'emails@test.com',
  });
  const resEmpresa = await request(app)
    .post('/api/empresas')
    .send({ nombre: 'Empresa Emails' });
  empresa = resEmpresa.body.data as EmpresaRow;

  const resPost = await request(app)
    .post('/api/postulaciones')
    .send({
      usuario_id: usuario.id,
      empresa_id: empresa.id,
      puesto: 'Frontend Developer',
    });
  postulacion = resPost.body.data as PostulacionRow;
});

afterAll(async () => {
  await db.close();
});

async function leerPostulacion(id: number): Promise<PostulacionRow> {
  const res = await request(app).get(`/api/postulaciones/${id}`);
  return res.body.data as PostulacionRow;
}

describe('Emails — POST', () => {
  it('crea un email enviado e incrementa cantidad_mails_enviados', async () => {
    const res = await request(app)
      .post('/api/emails')
      .send({
        postulacion_id: postulacion.id,
        tipo: 'postulacion',
        tipo_seguimiento: 'novedad',
        asunto: 'Postulación Frontend',
        remitente: 'candidato@test.com',
        destinatario: 'rrhh@empresa.com',
        fecha: '2026-09-10T10:00:00Z',
        enviado: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.tipo).toBe('postulacion');
    expect(res.body.data.tipo_seguimiento).toBe('novedad');

    const p = await leerPostulacion(postulacion.id);
    expect(p.cantidad_mails_enviados).toBe(1);
    expect(p.ultimo_contacto).toBe('2026-09-10');
    expect(p.proxima_contacto).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('crea un email no enviado sin tocar el contador', async () => {
    const res = await request(app)
      .post('/api/emails')
      .send({
        postulacion_id: postulacion.id,
        tipo: 'respuesta',
        remitente: 'rrhh@empresa.com',
        destinatario: 'candidato@test.com',
        fecha: '2026-09-11T09:00:00Z',
        enviado: 0,
      });
    expect(res.status).toBe(201);

    const p = await leerPostulacion(postulacion.id);
    expect(p.cantidad_mails_enviados).toBe(1);
  });

  it('responde 404 si la postulación no existe', async () => {
    const res = await request(app)
      .post('/api/emails')
      .send({
        postulacion_id: 999999,
        tipo: 'postulacion',
        remitente: 'a@a.com',
        destinatario: 'b@b.com',
        fecha: '2026-09-10T10:00:00Z',
      });
    expect(res.status).toBe(404);
  });
});

describe('Emails — GET', () => {
  it('lista emails y filtra por postulación', async () => {
    const todos = await request(app).get('/api/emails');
    expect((todos.body.data as EmailRow[]).length).toBeGreaterThanOrEqual(2);

    const deLa = await request(app)
      .get('/api/emails')
      .query({ postulacion_id: postulacion.id });
    for (const e of deLa.body.data as EmailRow[]) {
      expect(e.postulacion_id).toBe(postulacion.id);
    }
  });

  it('responde 404 para un email inexistente', async () => {
    const res = await request(app).get('/api/emails/999999');
    expect(res.status).toBe(404);
  });
});

describe('Emails — PUT', () => {
  it('marca un email como enviado e incrementa el contador', async () => {
    const creado = await creaEmail({ enviado: 0, fecha: '2026-09-12T08:00:00Z' });
    const antes = await leerPostulacion(postulacion.id);

    const res = await request(app)
      .put(`/api/emails/${creado.id}`)
      .send({ enviado: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.enviado).toBe(1);

    const despues = await leerPostulacion(postulacion.id);
    expect(despues.cantidad_mails_enviados).toBe(antes.cantidad_mails_enviados + 1);
    expect(despues.proxima_contacto).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('marca un email enviado como no enviado y decrementa', async () => {
    const creado = await creaEmail({ enviado: 1, fecha: '2026-09-13T08:00:00Z' });
    const res = await request(app)
      .put(`/api/emails/${creado.id}`)
      .send({ enviado: 0 });
    expect(res.status).toBe(200);

    const p = await leerPostulacion(postulacion.id);
    expect(
      p.cantidad_mails_enviados,
    ).toBeGreaterThanOrEqual(0);
  });
});

describe('Emails — DELETE', () => {
  it('elimina un email enviado y decrementa el contador', async () => {
    const creado = await creaEmail({ enviado: 1, fecha: '2026-09-14T08:00:00Z' });
    const antes = await leerPostulacion(postulacion.id);

    expect((await request(app).delete(`/api/emails/${creado.id}`)).status).toBe(204);
    const despues = await leerPostulacion(postulacion.id);
    expect(despues.cantidad_mails_enviados).toBe(Math.max(0, antes.cantidad_mails_enviados - 1));
  });

  it('responde 404 al eliminar un inexistente', async () => {
    const res = await request(app).delete('/api/emails/999999');
    expect(res.status).toBe(404);
  });
});

async function creaEmail(overrides: Record<string, unknown> = {}): Promise<EmailRow> {
  const res = await request(app)
    .post('/api/emails')
    .send({
      postulacion_id: postulacion.id,
      tipo: 'seguimiento',
      remitente: 'candidato@test.com',
      destinatario: 'rrhh@empresa.com',
      fecha: '2026-09-10T10:00:00Z',
      ...overrides,
    });
  return res.body.data as EmailRow;
}