import { createClient, type Client } from '@libsql/client';
import { env } from './env';

export const db: Client = createClient({
  url: env.URL_TURSO,
  ...(env.URL_TURSO.startsWith('file:')
    ? {}
    : { authToken: env.TOKEN_TURSO }),
});

export async function checkConnection(): Promise<boolean> {
  const result = await db.execute('SELECT 1 AS ping');
  return result.rows[0]?.ping === 1;
}