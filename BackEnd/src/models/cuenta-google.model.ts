import { db } from '../config/database';

export interface CuentaGoogleRow {
  id: number;
  usuario_id: number;
  google_id: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuardarTokensInput {
  usuarioId: number;
  googleId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
}

export const CuentaGoogleModel = {
  async upsertTokens(input: GuardarTokensInput): Promise<void> {
    const existente = await db.execute({
      sql: 'SELECT id FROM cuentas_google WHERE usuario_id = ?',
      args: [input.usuarioId],
    });

    if (existente.rows.length > 0) {
      const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
      const args: Array<string | number> = [];
      if (input.googleId) {
        sets.push('google_id = ?');
        args.push(input.googleId);
      }
      if (input.accessToken) {
        sets.push('access_token = ?');
        args.push(input.accessToken);
      }
      if (input.refreshToken) {
        sets.push('refresh_token = ?');
        args.push(input.refreshToken);
      }
      if (input.tokenExpiresAt) {
        sets.push('token_expires_at = ?');
        args.push(input.tokenExpiresAt);
      }
      args.push(input.usuarioId);
      await db.execute({
        sql: `UPDATE cuentas_google SET ${sets.join(', ')} WHERE usuario_id = ?`,
        args,
      });
      return;
    }

    await db.execute({
      sql: `
        INSERT INTO cuentas_google
          (usuario_id, google_id, access_token, refresh_token, token_expires_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [
        input.usuarioId,
        input.googleId,
        input.accessToken ?? null,
        input.refreshToken ?? null,
        input.tokenExpiresAt ?? null,
      ],
    });
  },

  async obtenerPorUsuario(usuarioId: number): Promise<CuentaGoogleRow | null> {
    const resultado = await db.execute({
      sql: `
        SELECT id, usuario_id, google_id, access_token, refresh_token,
               token_expires_at, created_at, updated_at
        FROM cuentas_google
        WHERE usuario_id = ?
      `,
      args: [usuarioId],
    });
    return (resultado.rows[0] as unknown as CuentaGoogleRow) ?? null;
  },
};