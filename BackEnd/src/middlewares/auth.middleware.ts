import type { NextFunction, Request, Response } from 'express';
import { TOKEN_COOKIE } from '../utils/cookies';
import { AppError } from '../utils/errors';
import { verificarToken } from '../utils/jwt';

function extraerHeader(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return undefined;
}

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.[TOKEN_COOKIE] ?? extraerHeader(req);

  if (!token) {
    next(new AppError(401, 'No autenticado'));
    return;
  }

  verificarToken(token)
    .then((payload) => {
      req.usuarioId = payload.usuario_id;
      next();
    })
    .catch(() => {
      next(new AppError(401, 'Token inválido o expirado'));
    });
}