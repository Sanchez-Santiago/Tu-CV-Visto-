import { OAuth2Client } from 'google-auth-library';
import { env } from './env';

export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
] as const;

export function esGoogleConfigurado(): boolean {
  return Boolean(
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL,
  );
}

export function getOAuthClient(): OAuth2Client {
  if (!esGoogleConfigurado()) {
    throw new Error(
      'Google OAuth no configurado: faltan GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_CALLBACK_URL',
    );
  }
  return new OAuth2Client({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_CALLBACK_URL,
  });
}

export function generarUrlAutorizacion(client: OAuth2Client): string {
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [...GOOGLE_SCOPES],
  });
}