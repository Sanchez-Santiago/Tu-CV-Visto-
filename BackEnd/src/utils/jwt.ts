import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env';

export interface TokenPayload {
  usuario_id: number;
  email: string;
  nombre: string;
}

const TOKEN_TTL = '7d';

export async function firmarToken(payload: TokenPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(payload.usuario_id))
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secret);
}

export async function verificarToken(
  token: string,
): Promise<TokenPayload> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  return {
    usuario_id: Number(payload.usuario_id),
    email: (payload.email as string) ?? '',
    nombre: (payload.nombre as string) ?? '',
  };
}