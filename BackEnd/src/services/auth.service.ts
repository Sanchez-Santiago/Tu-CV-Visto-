import { CuentaGoogleModel } from '../models/cuenta-google.model';
import { UsuarioModel } from '../models/usuario.model';
import type { UsuarioRow } from '../types/models';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { firmarToken } from '../utils/jwt';
import { generarUrlAutorizacion, getOAuthClient } from '../config/google';
import { env, esPantallaBetaActiva } from '../config/env';

export interface ResultadoCallback {
  usuario: UsuarioRow;
  token: string;
}

export function destinoPostLogin(redireccion?: string): string {
  if (esPantallaBetaActiva()) {
    return '/auth/callback';
  }
  if (redireccion?.startsWith(env.FRONTEND_URL)) {
    return redireccion;
  }
  return `${env.FRONTEND_URL}/auth/callback`;
}

export const AuthService = {
  generarUrlLogin(): string {
    return generarUrlAutorizacion(getOAuthClient());
  },

  async callback(code: string): Promise<ResultadoCallback> {
    const client = getOAuthClient();
    logger.debug('Callback OAuth: código de autorización recibido');

    let tokens;
    try {
      ({ tokens } = await client.getToken(code));
    } catch (error) {
      throw new AppError(
        401,
        `El código de autorización de Google es inválido o expiró: ${error instanceof Error ? error.message : 'error desconocido'}`,
      );
    }

    const idToken = tokens.id_token;
    if (!idToken) {
      throw new AppError(
        500,
        'Google no devolvió id_token (verificá que el scope openid esté incluido)',
      );
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;
    const googleId = payload?.sub;

    if (!email || !googleId) {
      throw new AppError(
        500,
        'La cuenta de Google no devolvió un email o identificador válido',
      );
    }

    let usuario = await UsuarioModel.obtenerPorEmail(email);
    if (!usuario) {
      const nombre = payload.name ?? email.split('@')[0] ?? email;
      usuario = await UsuarioModel.crear({ nombre, email });
    }
    logger.debug(
      `Callback OAuth: sesión para ${usuario.email}`,
    );

    if (tokens.access_token) {
      if (!tokens.refresh_token) {
        logger.warn(
          `Callback OAuth: Google no devolvió refresh_token para ${usuario.email}. ` +
            'Re-vinculá la cuenta para poder renovar accesos (consent screen con access_type=offline).',
        );
      }
      await CuentaGoogleModel.upsertTokens({
        usuarioId: usuario.id,
        googleId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        tokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : undefined,
      });
    }

    const token = await firmarToken({
      usuario_id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
    });
    logger.debug(`Callback OAuth: JWT emitido para ${usuario.email}`);

    return { usuario, token };
  },
};