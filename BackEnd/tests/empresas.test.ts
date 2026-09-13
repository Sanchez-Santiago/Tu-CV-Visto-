import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import type { EmpresaRow } from '../src/types/models';
import { resetTestDb } from './helpers/test-db';

beforeAll(async () => {
  await resetTestDb(db);
});

afterAll(async () => {
  await db.close();
});

describe('Empresas — POST', () => {
  it('crea una empresa con modalidad válida', async () => {
    const res = await request(app)
      .post('/api/empresas')
      .send({
        nombre: 'APEX America',
        pais: 'Argentina',
        provincia: 'Córdoba',
        ciudad: 'Córdoba Capital',
        modalidad: 'presencial',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.nombre).toBe('APEX America');
    expect(res.body.data.modalidad).toBe('presencial');
  });

  it('rechaza duplicados (ignorando mayúsculas)', async () => {
    await creaEmpresa({ nombre: 'Globant' });
    const res = await request(app)
      .post('/api/empresas')
      .send({ nombre: 'globant' });
    expect(res.status).toBe(409);
  });

  it('rechaza una modalidad inválida', async () => {
    const res = await request(app)
      .post('/api/empresas')
      .send({ nombre: 'X', modalidad: 'híbrido' });
    expect(res.status).toBe(400);
  });

  it('rechaza crear sin nombre', async () => {
    const res = await request(app).post('/api/empresas').send({});
    expect(res.status).toBe(400);
  });
});

describe('Empresas — GET', () => {
  it('lista empresas y filtra por modalidad', async () => {
    await creaEmpresa({ nombre: 'Remoto SA', modalidad: 'remoto' });
    await creaEmpresa({ nombre: 'Híbrido SA', modalidad: 'hibrido' });

    const todas = await request(app).get('/api/empresas');
    expect(todas.status).toBe(200);
    expect(
      (todas.body.data as EmpresaRow[]).some(
        (e) => e.nombre === 'Remoto SA',
      ),
    ).toBe(true);

    const soloRemotas = await request(app)
      .get('/api/empresas?modalidad=remoto');
    expect(soloRemotas.status).toBe(200);
    for (const e of soloRemotas.body.data as EmpresaRow[]) {
      expect(e.modalidad).toBe('remoto');
    }
  });

  it('rechaza un filtro de modalidad inválido', async () => {
    const res = await request(app).get('/api/empresas?modalidad=xyz');
    expect(res.status).toBe(400);
  });

  it('responde 404 para una empresa inexistente', async () => {
    const res = await request(app).get('/api/empresas/999999');
    expect(res.status).toBe(404);
  });
});

describe('Empresas — GET /:id/contactos', () => {
  it('responde 404 si la empresa no existe', async () => {
    const res = await request(app).get('/api/empresas/999999/contactos');
    expect(res.status).toBe(404);
  });
});

describe('Empresas — PUT', () => {
  it('actualiza una empresa existente', async () => {
    const empresa = await creaEmpresa({ nombre: 'BGlobal' });
    const res = await request(app)
      .put(`/api/empresas/${empresa.id}`)
      .send({ pais: 'Uruguay' });
    expect(res.status).toBe(200);
    expect(res.body.data.pais).toBe('Uruguay');
    expect(res.body.data.nombre).toBe('BGlobal');
  });

  it('rechaza renombrar a un nombre duplicado', async () => {
    const a = await creaEmpresa({ nombre: 'Empresa A' });
    await creaEmpresa({ nombre: 'Empresa B' });
    const res = await request(app)
      .put(`/api/empresas/${a.id}`)
      .send({ nombre: 'empresa b' });
    expect(res.status).toBe(409);
  });

  it('responde 404 al actualizar una inexistente', async () => {
    const res = await request(app)
      .put('/api/empresas/999999')
      .send({ nombre: 'N' });
    expect(res.status).toBe(404);
  });
});

describe('Empresas — DELETE', () => {
  it('elimina una empresa existente', async () => {
    const empresa = await creaEmpresa({ nombre: 'AEliminar' });
    const res = await request(app).delete(`/api/empresas/${empresa.id}`);
    expect(res.status).toBe(204);

    const despues = await request(app).get(`/api/empresas/${empresa.id}`);
    expect(despues.status).toBe(404);
  });

  it('responde 404 al eliminar una inexistente', async () => {
    const res = await request(app).delete('/api/empresas/999999');
    expect(res.status).toBe(404);
  });
});

async function creaEmpresa(datos: Record<string, unknown>): Promise<EmpresaRow> {
  const res = await request(app).post('/api/empresas').send(datos);
  return res.body.data as EmpresaRow;
}