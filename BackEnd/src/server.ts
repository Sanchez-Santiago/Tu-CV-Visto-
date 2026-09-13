import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

app.listen(env.PORT, () => {
  logger.info(
    `CVisto backend escuchando en http://localhost:${env.PORT} ` +
      `(env=${env.NODE_ENV}, log_level=${env.LOG_LEVEL})`,
  );
});