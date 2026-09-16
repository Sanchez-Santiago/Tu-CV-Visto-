import { app } from './app';
import { db } from './config/database';
import { env } from './config/env';
import { logger } from './utils/logger';
import { aplicarMigracionesColumnas } from './utils/migraciones';

async function iniciar(): Promise<void> {
  try {
    await aplicarMigracionesColumnas(db);
  } catch (error) {
    logger.error('No se pudieron aplicar las migraciones en el arranque:', error);
  }

  app.listen(env.PORT, () => {
    logger.info(
      `CVisto backend escuchando en http://localhost:${env.PORT} ` +
        `(env=${env.NODE_ENV}, log_level=${env.LOG_LEVEL})`,
    );
  });
}

iniciar();