import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { db } from '../src/config/database';
import { aplicarMigracionesColumnas } from '../src/utils/migraciones';

async function runStatement(source: string, label: string): Promise<void> {
  console.log(`  → aplicando ${label}...`);
  await db.executeMultiple(source);
}

async function main(): Promise<void> {
  console.log('Migración de base de datos (Turso)\n');

  await runStatement(
    readFileSync(resolve(process.cwd(), 'database/schema.sql'), 'utf8'),
    'schema.sql',
  );

  console.log('  → aplicando migraciones de columnas (idempotente)...');
  await aplicarMigracionesColumnas(db);

  await runStatement(
    readFileSync(resolve(process.cwd(), 'database/seeds.sql'), 'utf8'),
    'seeds.sql',
  );

  console.log('\nMigración completada.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nLa migración falló:', error);
    process.exit(1);
  });