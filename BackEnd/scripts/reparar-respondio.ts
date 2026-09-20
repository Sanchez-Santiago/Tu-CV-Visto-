import { db } from '../src/config/database';

/**
 * Repara postulaciones que quedaron con `respondio = 1` por ruido
 * (alertas de portales u otros emails 'otro' vinculados).
 *
 * Pone `respondio = 0` en postulaciones no cerradas para que vuelvan a
 * la cola de seguimiento. Después conviene correr "Analizar IA" una vez:
 * las respuestas genuinas se vuelven a marcar solas.
 *
 * Uso:
 *   bun run reparar:respondio            → aplica los cambios
 *   bun run reparar:respondio --dry-run  → solo muestra qué cambiaría
 */
async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const pendientes = await db.execute({
    sql: `
      SELECT id, puesto, estado, respondio
      FROM postulaciones
      WHERE respondio = 1
        AND estado NOT IN ('rechazado', 'aceptado', 'cancelado')
      ORDER BY id ASC
    `,
    args: [],
  });

  console.log(
    `Postulaciones no cerradas con respondio = 1: ${pendientes.rows.length}`,
  );
  for (const fila of pendientes.rows) {
    console.log(
      `  - #${String(fila.id)} [${String(fila.estado)}] ${String(fila.puesto ?? '').slice(0, 80)}`,
    );
  }

  if (dryRun) {
    console.log('\nModo --dry-run: no se aplicaron cambios.');
    return;
  }

  if (pendientes.rows.length === 0) {
    console.log('Nada que reparar.');
    return;
  }

  await db.execute({
    sql: `
      UPDATE postulaciones
      SET respondio = 0
      WHERE respondio = 1
        AND estado NOT IN ('rechazado', 'aceptado', 'cancelado')
    `,
    args: [],
  });

  console.log(
    `\nReparadas ${pendientes.rows.length} postulaciones (respondio = 0).`,
  );
  console.log(
    'Siguiente paso: correr "Analizar IA" una vez para remarcar respuestas genuinas.',
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nLa reparación falló:', error);
    process.exit(1);
  });
