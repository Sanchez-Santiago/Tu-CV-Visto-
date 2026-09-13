import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

export function validate<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, _res, next) => {
    const resultado = schema.safeParse(req.body);
    if (!resultado.success) {
      next(resultado.error);
      return;
    }
    req.body = resultado.data;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, _res, next) => {
    const resultado = schema.safeParse(req.params);
    if (!resultado.success) {
      next(resultado.error);
      return;
    }
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, _res, next) => {
    const resultado = schema.safeParse(req.query);
    if (!resultado.success) {
      next(resultado.error);
      return;
    }
    next();
  };
}