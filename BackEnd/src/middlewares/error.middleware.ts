import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ ok: false, error: { message: 'Ruta no encontrada' } });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      ok: false,
      error: {
        message: 'Datos inválidos',
        details: error.issues.map((issue) => ({
          campo: issue.path.join('.'),
          mensaje: issue.message,
        })),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      ok: false,
      error: { message: error.message, details: error.details },
    });
    return;
  }

  logger.error('Error no controlado:', error);
  res.status(500).json({
    ok: false,
    error: { message: 'Error interno del servidor' },
  });
}