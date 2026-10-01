import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import type { UsuarioRow } from '../src/types/models';
import { api, headersDe } from './helpers/auth';
import { resetTestDb } from './helpers/test-db';

let ana: UsuarioRow;
let bruno: UsuarioRow;
let authAna: { Authorization: string };
let authBruno: { Authorization: string };

beforeAll(async () => {
  await resetTestDb(db);

  ana = await UsuarioModel.crear({
    nombre: 'Ana',
    email: 'ana@test.com',
  });
  bruno = await UsuarioModel.crear({
    nombre: 'Bruno',
    email: 'bruno@test.com',
  });

  authAna = await headersDe(ana.id, ana.email);
  authBruno = await headersDe(bruno.id, bruno.email);
});

afterAll(async () => {
  await db.close();
});

async function crearEmpresa(
  auth: { Authorization: string },
  nombre: string,
): Promise<number> {
  const res = await api(app, auth).post('/api/empresas').send({ nombre });
  expect(res.status).toBe(201);
  return res.body.data.id as number;
}

async function crearPostulacion(
  auth: { Authorization: string },
  empresaId: number,
  puesto: string,
): Promise<number> {
  const res = await api(app, auth)
    .post('/api/postulaciones')
    .send({ empresa_id: empresaId, puesto });
  expect(res.status).toBe(201);
  return res.body.data.id as number;
}

describe('Aislamiento — autenticación', () => {
  it('rechaza sin token las cinco rutas que antes eran públicas', async () => {
    const casos: Array<[string, string]> = [
      ['get', '/api/empresas'],
      ['get', '/api/contactos-rrhh'],
      ['get', '/api/postulaciones'],
      ['get', '/api/emails'],
      ['get', '/api/seguimientos'],
    ];

    for (const [metodo, url] of casos) {
      const res = await request(app)[metodo as 'get'](url);
      expect(res.status, `${metodo.toUpperCase()} ${url}`).toBe(401);
    }
  });

  it('rechaza un token inválido', async () => {
    const res = await request(app)
      .get('/api/postulaciones')
      .set({ Authorization: 'Bearer token-falso' });
    expect(res.status).toBe(401);
  });
});

describe('Aislamiento — empresas', () => {
  it('cada usuario ve solo sus empresas', async () => {
    await crearEmpresa(authAna, 'Empresa de Ana');
    await crearEmpresa(authBruno, 'Empresa de Bruno');

    const deAna = await api(app, authAna).get('/api/empresas');
    const deBruno = await api(app, authBruno).get('/api/empresas');

    const nombresAna = (deAna.body.data as Array<{ nombre: string }>).map(
      (e) => e.nombre,
    );
    const nombresBruno = (deBruno.body.data as Array<{ nombre: string }>).map(
      (e) => e.nombre,
    );

    expect(nombresAna).toContain('Empresa de Ana');
    expect(nombresAna).not.toContain('Empresa de Bruno');
    expect(nombresBruno).toContain('Empresa de Bruno');
    expect(nombresBruno).not.toContain('Empresa de Ana');
  });

  it('no puede leer, editar ni borrar la empresa del otro', async () => {
    const id = await crearEmpresa(authAna, 'Privada de Ana');

    expect((await api(app, authBruno).get(`/api/empresas/${id}`)).status).toBe(404);
    expect(
      (
        await api(app, authBruno)
          .put(`/api/empresas/${id}`)
          .send({ nombre: 'Robada' })
      ).status,
    ).toBe(404);
    expect(
      (await api(app, authBruno).delete(`/api/empresas/${id}`)).status,
    ).toBe(404);
  });

  it('el mismo nombre puede existir para dos usuarios sin conflicto', async () => {
    await crearEmpresa(authAna, 'Nombre Repetido');
    const res = await api(app, authBruno)
      .post('/api/empresas')
      .send({ nombre: 'nombre repetido' });
    expect(res.status).toBe(201);
  });

  it('no puede colgar un contacto de la empresa del otro', async () => {
    const idEmpresaAna = await crearEmpresa(authAna, 'Con contactos de Ana');
    const res = await api(app, authBruno)
      .post('/api/contactos-rrhh')
      .send({
        empresa_id: idEmpresaAna,
        nombre: 'Intruso',
        email: 'intruso@test.com',
      });
    expect(res.status).toBe(404);
  });
});

describe('Aislamiento — contactos RRHH', () => {
  it('el contacto de Ana no aparece en el listado de Bruno', async () => {
    const empresaId = await crearEmpresa(authAna, 'Contactos Ana');
    const creado = await api(app, authAna)
      .post('/api/contactos-rrhh')
      .send({
        empresa_id: empresaId,
        nombre: 'Paula',
        email: 'paula@ana.com',
      });
    expect(creado.status).toBe(201);
    const contactoId = creado.body.data.id as number;

    const deBruno = await api(app, authBruno).get('/api/contactos-rrhh');
    const ids = (deBruno.body.data as Array<{ id: number }>).map((c) => c.id);
    expect(ids).not.toContain(contactoId);

    expect(
      (await api(app, authBruno).get(`/api/contactos-rrhh/${contactoId}`)).status,
    ).toBe(404);
    expect(
      (
        await api(app, authBruno)
          .put(`/api/contactos-rrhh/${contactoId}`)
          .send({ nombre: 'Secuestrado' })
      ).status,
    ).toBe(404);
    expect(
      (await api(app, authBruno).delete(`/api/contactos-rrhh/${contactoId}`))
        .status,
    ).toBe(404);
  });
});

describe('Aislamiento — postulaciones', () => {
  it('no puede leer ni modificar la postulación del otro', async () => {
    const empresaId = await crearEmpresa(authAna, 'Postulaciones Ana');
    const postulacionId = await crearPostulacion(
      authAna,
      empresaId,
      'Backend',
    );

    expect(
      (await api(app, authBruno).get(`/api/postulaciones/${postulacionId}`))
        .status,
    ).toBe(404);
    expect(
      (
        await api(app, authBruno)
          .put(`/api/postulaciones/${postulacionId}`)
          .send({ estado: 'rechazado' })
      ).status,
    ).toBe(404);
    expect(
      (await api(app, authBruno).delete(`/api/postulaciones/${postulacionId}`))
        .status,
    ).toBe(404);
  });

  it('no puede crear una postulación sobre la empresa del otro', async () => {
    const empresaId = await crearEmpresa(authAna, 'Empresa protegida');
    const res = await api(app, authBruno)
      .post('/api/postulaciones')
      .send({ empresa_id: empresaId, puesto: 'Intruso' });
    expect(res.status).toBe(404);
  });

  it('el listado de cada uno solo trae lo suyo', async () => {
    const empresaId = await crearEmpresa(authAna, 'Listado Ana');
    await crearPostulacion(authAna, empresaId, 'Puesto de Ana');

    const deBruno = await api(app, authBruno).get('/api/postulaciones');
    const deAna = await api(app, authAna).get('/api/postulaciones');

    const puestosBruno = (deBruno.body.data as Array<{ puesto: string }>).map(
      (p) => p.puesto,
    );
    expect(puestosBruno).not.toContain('Puesto de Ana');
    expect(
      (deAna.body.data as Array<{ puesto: string }>).map((p) => p.puesto),
    ).toContain('Puesto de Ana');
  });

  it('no puede ver la línea de tiempo del otro', async () => {
    const empresaId = await crearEmpresa(authAna, 'Timeline Ana');
    const postulacionId = await crearPostulacion(
      authAna,
      empresaId,
      'Con timeline',
    );
    const res = await api(app, authBruno).get(
      `/api/postulaciones/${postulacionId}/relacion`,
    );
    expect(res.status).toBe(404);
  });
});

describe('Aislamiento — emails', () => {
  it('el email de Ana no es visible ni editable por Bruno', async () => {
    const empresaId = await crearEmpresa(authAna, 'Emails Ana');
    const postulacionId = await crearPostulacion(
      authAna,
      empresaId,
      'Con email',
    );

    const creado = await api(app, authAna).post('/api/emails').send({
      postulacion_id: postulacionId,
      tipo: 'seguimiento',
      remitente: 'recluta@ana.com',
      destinatario: ana.email,
      fecha: '2026-09-10T10:00:00Z',
      enviado: 1,
    });
    expect(creado.status).toBe(201);
    const emailId = creado.body.data.id as number;

    const deBruno = await api(app, authBruno).get('/api/emails');
    const ids = (deBruno.body.data as Array<{ id: number }>).map((e) => e.id);
    expect(ids).not.toContain(emailId);

    expect((await api(app, authBruno).get(`/api/emails/${emailId}`)).status).toBe(404);
    expect(
      (
        await api(app, authBruno)
          .put(`/api/emails/${emailId}`)
          .send({ tipo: 'otro' })
      ).status,
    ).toBe(404);
    expect((await api(app, authBruno).delete(`/api/emails/${emailId}`)).status).toBe(404);
  });

  it('no puede colgar un email en la postulación del otro', async () => {
    const empresaId = await crearEmpresa(authAna, 'Emails colgados');
    const postulacionId = await crearPostulacion(
      authAna,
      empresaId,
      'Postulación protegida',
    );
    const res = await api(app, authBruno).post('/api/emails').send({
      postulacion_id: postulacionId,
      tipo: 'seguimiento',
      remitente: 'bruno@test.com',
      destinatario: 'recluta@ana.com',
      fecha: '2026-09-11T10:00:00Z',
      enviado: 1,
    });
    expect(res.status).toBe(404);
  });
});

describe('Aislamiento — seguimientos', () => {
  it('el seguimiento de Ana no es visible ni editable por Bruno', async () => {
    const empresaId = await crearEmpresa(authAna, 'Seguimientos Ana');
    const postulacionId = await crearPostulacion(
      authAna,
      empresaId,
      'Con seguimiento',
    );

    const creado = await api(app, authAna).post('/api/seguimientos').send({
      postulacion_id: postulacionId,
      fecha_programada: '2026-09-25',
      tipo_seguimiento: 'nuevo_proyecto',
    });
    expect(creado.status).toBe(201);
    const seguimientoId = creado.body.data.id as number;

    const pendientes = await api(app, authBruno).get('/api/seguimientos');
    const ids = (pendientes.body.data as Array<{ id: number }>).map(
      (s) => s.id,
    );
    expect(ids).not.toContain(seguimientoId);

    expect(
      (await api(app, authBruno).get(`/api/seguimientos/${seguimientoId}`)).status,
    ).toBe(404);
    expect(
      (
        await api(app, authBruno)
          .put(`/api/seguimientos/${seguimientoId}`)
          .send({ enviado: 1 })
      ).status,
    ).toBe(404);
    expect(
      (await api(app, authBruno).delete(`/api/seguimientos/${seguimientoId}`))
        .status,
    ).toBe(404);
  });

  it('no puede colgar un seguimiento en la postulación del otro', async () => {
    const empresaId = await crearEmpresa(authAna, 'Seguimientos colgados');
    const postulacionId = await crearPostulacion(
      authAna,
      empresaId,
      'Postulación protegida',
    );
    const res = await api(app, authBruno).post('/api/seguimientos').send({
      postulacion_id: postulacionId,
      fecha_programada: '2026-09-26',
      tipo_seguimiento: 'consulta',
    });
    expect(res.status).toBe(404);
  });
});

describe('Aislamiento — postulación/contacto', () => {
  it('no puede ver ni tocar los contactos asigncidos a la postulación del otro', async () => {
    const empresaId = await crearEmpresa(authAna, 'Junction Ana');
    const postulacionId = await crearPostulacion(
      authAna,
      empresaId,
      'Postulación con contacto',
    );
    const contacto = await api(app, authAna)
      .post('/api/contactos-rrhh')
      .send({
        empresa_id: empresaId,
        nombre: 'Contacto de Ana',
        email: 'contacto@ana.com',
      });
    const contactoId = contacto.body.data.id as number;

    const asignado = await api(app, authAna)
      .post(`/api/postulaciones/${postulacionId}/contactos`)
      .send({ contacto_rrhh_id: contactoId });
    expect(asignado.status).toBe(201);

    const deBruno = await api(app, authBruno).get(
      `/api/postulaciones/${postulacionId}/contactos`,
    );
    expect(deBruno.status).toBe(404);

    expect(
      (
        await api(app, authBruno)
          .post(`/api/postulaciones/${postulacionId}/contactos`)
          .send({ contacto_rrhh_id: contactoId })
      ).status,
    ).toBe(404);

    expect(
      (
        await api(app, authBruno)
          .delete(`/api/postulaciones/${postulacionId}/contactos/${contactoId}`)
      ).status,
    ).toBe(404);
  });
});

describe('Aislamiento — categorías de usuario', () => {
  it('no puede leer ni modificar las categorías de otro por el path', async () => {
    await db.execute({
      sql: 'INSERT INTO categorias_trabajo (nombre) VALUES (?)',
      args: ['Data'],
    });
    const encontrada = await db.execute({
      sql: 'SELECT id FROM categorias_trabajo WHERE nombre = ?',
      args: ['Data'],
    });
    const categoriaId = Number(encontrada.rows[0]!.id);

    const propia = await api(app, authAna)
      .post(`/api/usuarios/${ana.id}/categorias`)
      .send({ categoria_id: categoriaId });
    expect(propia.status).toBe(201);

    const deOtro = await api(app, authBruno).get(
      `/api/usuarios/${ana.id}/categorias`,
    );
    expect(deOtro.status).toBe(404);

    const asignaOtro = await api(app, authBruno)
      .post(`/api/usuarios/${ana.id}/categorias`)
      .send({ categoria_id: categoriaId });
    expect(asignaOtro.status).toBe(404);

    const borraOtro = await api(app, authBruno).delete(
      `/api/usuarios/${ana.id}/categorias/${categoriaId}`,
    );
    expect(borraOtro.status).toBe(404);
  });
});
