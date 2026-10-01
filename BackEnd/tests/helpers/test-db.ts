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


export async function resetTestDb(client: Client): Promise<void> {
  // El archivo de test es persistente entre corridas. Con solo CREATE TABLE IF
  // NOT EXISTS una tabla vieja sobrevivía al cambio de schema y los tests
  // fallaban con "no such column". Se dropea todo para partir de cero.
  await client.execute('PRAGMA foreign_keys = OFF');
  const { rows } = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
  );
  for (const row of rows) {
    await client.execute(`DROP TABLE IF EXISTS "${String(row.name)}"`);
  }
  await client.execute('PRAGMA foreign_keys = ON');

  await client.executeMultiple(schema);
  await aplicarMigracionesColumnas(client);

  await client.executeMultiple(seeds);
}