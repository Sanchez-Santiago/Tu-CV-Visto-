import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const inicio = performance.now();
  const ruta = `${req.method} ${req.originalUrl}`;

  res.on('finish', () => {
    const duracion = Math.round(performance.now() - inicio);
    const { statusCode } = res;
    if (statusCode >= 500) {
      logger.error(`${ruta} -> ${statusCode} (${duracion}ms)`);
    } else if (statusCode >= 400) {
      logger.warn(`${ruta} -> ${statusCode} (${duracion}ms)`);
    } else {
      logger.info(`${ruta} -> ${statusCode} (${duracion}ms)`);
    }
  });

  next();
}