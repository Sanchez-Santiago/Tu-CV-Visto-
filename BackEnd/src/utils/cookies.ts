import type { CookieOptions, Response } from 'express';

export const TOKEN_COOKIE = 'cvisto_token';
export const LOGGED_COOKIE = 'cvisto_logged';

const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días

export function unificarSesion(
  res: Response,
  token: string,
  esProduccion = process.env.NODE_ENV === 'production',
): void {
  const opcionesToken: CookieOptions = {
    httpOnly: true,
    secure: esProduccion,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };

  const opcionesLogged: CookieOptions = {
    httpOnly: false,
    secure: esProduccion,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };

  res.cookie(TOKEN_COOKIE, token, opcionesToken);
  res.cookie(LOGGED_COOKIE, '1', opcionesLogged);
}

export function cerrarSesion(res: Response): void {
  res.clearCookie(TOKEN_COOKIE, { path: '/' });
  res.clearCookie(LOGGED_COOKIE, { path: '/' });
}