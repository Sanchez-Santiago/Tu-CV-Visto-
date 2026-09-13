import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { UsuarioModel } from '../src/models/usuario.model';
import { PlantillaService } from '../src/services/plantilla.service';
import type { EmpresaRow, UsuarioRow } from '../src/types/models';
import { resetTestDb } from './helpers/test-db';

let usuario: UsuarioRow;
let postulacionId = 0;

beforeAll(async () => {
  await resetTestDb(db);

  usuario = await UsuarioModel.crear({
    nombre: 'Santiago Sánchez',
    email: 'santiago@test.com',
  });
  await db.execute({
    sql: 'UPDATE usuarios SET perfil = ? WHERE id = ?',
    args: ['Desarrollador Backend con foco en APIs y bases de datos', usuario.id],
  });

  const resEmpresa = await request(app)
    .post('/api/empresas')
    .send({ nombre: 'Globant' });
  const empresa = resEmpresa.body.data as EmpresaRow;

  const resContacto = await request(app)
    .post('/api/contactos-rrhh')
    .send({
      empresa_id: empresa.id,
      nombre: 'Ana López',
      email: 'ana@globant.com',
      cargo: 'Recruiter',
    });
  const contactoId = resContacto.body.data.id;

  const resPost = await request(app)
    .post('/api/postulaciones')
    .send({
      usuario_id: usuario.id,
      empresa_id: empresa.id,
      puesto: 'Backend Engineer',
    });
  postulacionId = resPost.body.data.id;

  await request(app)
    .post(`/api/postulaciones/${postulacionId}/contactos`)
    .send({ contacto_rrhh_id: contactoId });

  await db.execute({
    sql: `
      INSERT INTO proyectos (usuario_id, nombre, descripcion, tecnologias, url)
      VALUES (?, ?, ?, ?, ?)
    `,
    args: [
      usuario.id,
      'E-commerce API',
      'API de ventas con pagos',
      'Bun, Express, TypeScript',
      'https://github.com/ejemplo/ecommerce',
    ],
  });
  await db.execute({
    sql: `
      INSERT INTO experiencias_laborales (usuario_id, empresa, puesto, descripcion)
      VALUES (?, ?, ?, ?)
    `,
    args: [
      usuario.id,
      'ConUal',
      'Desarrollador Junior',
      'APIs y microservicios',
    ],
  });
});

afterAll(async () => {
  await db.close();
});

describe('PlantillaService.generar', () => {
  it('genera un borrador de novedades personalizado', async () => {
    const { asunto, cuerpo } = await PlantillaService.generar({
      tipo: 'novedad',
      usuarioId: usuario.id,
      postulacionId,
    });

    expect(asunto).toBe('Actualización de mi perfil – Santiago Sánchez');
    expect(cuerpo).toContain('Hola Ana');
    expect(cuerpo).toContain('Globant');
    expect(cuerpo).toContain('Backend Engineer');
    expect(cuerpo).toContain('E-commerce API');
    expect(cuerpo).toContain('Bun, Express, TypeScript');
    expect(cuerpo).toContain('https://github.com/ejemplo/ecommerce');
    expect(cuerpo).toContain('Desarrollador Backend');
    expect(cuerpo).toContain('Santiago Sánchez · santiago@test.com');
  });

  it('destaca el proyecto principal con tipo nuevo_proyecto', async () => {
    const { asunto, cuerpo } = await PlantillaService.generar({
      tipo: 'nuevo_proyecto',
      usuarioId: usuario.id,
      postulacionId,
    });

    expect(asunto).toBe('Nuevo proyecto: E-commerce API');
    expect(cuerpo).toContain('E-commerce API');
  });

  it('adapta el asunto según el tipo de contacto', async () => {
    const disponibilidad = await PlantillaService.generar({
      tipo: 'disponibilidad',
      usuarioId: usuario.id,
      postulacionId,
    });
    expect(disponibilidad.asunto).toContain('Disponibilidad');

    const consulta = await PlantillaService.generar({
      tipo: 'consulta',
      usuarioId: usuario.id,
      postulacionId,
    });
    expect(consulta.asunto).toContain('Consulta – Backend Engineer en Globant');

    const recordatorio = await PlantillaService.generar({
      tipo: 'recordatorio',
      usuarioId: usuario.id,
      postulacionId,
    });
    expect(recordatorio.asunto).toContain('Mantenerme en contacto');
  });

  it('responde 404 si la postulación no existe', async () => {
    await expect(
      PlantillaService.generar({
        tipo: 'novedad',
        usuarioId: usuario.id,
        postulacionId: 999999,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});