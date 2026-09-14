import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Client } from '@libsql/client';
import { aplicarMigracionesColumnas } from '../../src/utils/migraciones';

export const TEST_DB_PATH = resolve(
  process.cwd(),
  'tests/.test-cvisto.db',
);

const schema = readFileSync(
  resolve(process.cwd(), 'database/schema.sql'),
  'utf8',
);
const seeds = readFileSync(
  resolve(process.cwd(), 'database/seeds.sql'),
  'utf8',
);

const TABLAS_VACIABLES = [
  'postulacion_contactos',
  'seguimientos',
  'emails',
  'postulaciones',
  'cuentas_google',
  'contactos_rrhh',
  'empresas',
  'usuario_categorias',
  'proyectos',
  'experiencias_laborales',
  'firmas',
  'contactos',
  'usuarios',
  'categorias_trabajo',
];

export async function resetTestDb(client: Client): Promise<void> {
  await client.execute('PRAGMA foreign_keys = ON');
  await client.executeMultiple(schema);
  await aplicarMigracionesColumnas(client);

  for (const tabla of TABLAS_VACIABLES) {
    await client.execute(`DELETE FROM ${tabla}`);
  }

  await client.executeMultiple(seeds);
}