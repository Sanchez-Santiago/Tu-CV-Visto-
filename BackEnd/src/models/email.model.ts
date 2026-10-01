import type { InValue } from '@libsql/client';
import { db } from '../config/database';
import type { EmailRow } from '../types/models';
import type { ActualizarEmailInput } from '../schemas/email';
import type { CrearEmailInput } from '../schemas/email';

const CAMPOS_ACTUALIZABLES = {
  postulacion_id: 'postulacion_id',
  gmail_message_id: 'gmail_message_id',
  tipo: 'tipo',
  tipo_seguimiento: 'tipo_seguimiento',
  asunto: 'asunto',
  remitente: 'remitente',
  destinatario: 'destinatario',
  fecha: 'fecha',
  enviado: 'enviado',
  contenido_resumen: 'contenido_resumen',
  cuerpo_html: 'cuerpo_html',
  tipo_respuesta: 'tipo_respuesta',
  tipo_respuesta_fuente: 'tipo_respuesta_fuente',
} as const;

export interface FiltroEmails {
  usuarioId: number;
  postulacionId?: number;
}

const COLUMNAS_SELECT = `
  SELECT id, postulacion_id, gmail_message_id, tipo, tipo_seguimiento, asunto,
         remitente, destinatario, fecha, enviado, contenido_resumen, cuerpo_html,
         tipo_respuesta, tipo_respuesta_fuente, created_at
  FROM emails
`;

export const EmailModel = {
  async crear(usuarioId: number, input: CrearEmailInput): Promise<EmailRow> {
    const resultado = await db.execute({
      sql: `
        INSERT INTO emails
          (usuario_id, postulacion_id, gmail_message_id, tipo, tipo_seguimiento, asunto,
           remitente, destinatario, fecha, enviado, contenido_resumen, cuerpo_html,
           tipo_respuesta, tipo_respuesta_fuente)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        usuarioId,
        input.postulacion_id,
        input.gmail_message_id ?? null,
        input.tipo,
        input.tipo_seguimiento ?? null,
        input.asunto ?? null,
        input.remitente,
        input.destinatario,
        input.fecha,
        input.enviado,
        input.contenido_resumen ?? null,
        input.cuerpo_html ?? null,
        input.tipo_respuesta ?? null,
        input.tipo_respuesta_fuente ?? null,
      ],
    });
    const creado = await this.obtenerPorId(Number(resultado.lastInsertRowid));
    if (!creado) {
      throw new Error('No se pudo recuperar el email recién creado');
    }
    return creado;
  },

  async listar(filtros: FiltroEmails): Promise<EmailRow[]> {
    const args: InValue[] = [filtros.usuarioId];
    let where = 'WHERE usuario_id = ?';
    if (filtros.postulacionId) {
      where += ' AND postulacion_id = ?';
      args.push(filtros.postulacionId);
    }

    const resultado = await db.execute({
      sql: `
        ${COLUMNAS_SELECT}
        ${where}
        ORDER BY fecha DESC, id DESC
      `,
      args,
    });
    return resultado.rows as unknown as EmailRow[];
  },

  async obtenerPorId(id: number): Promise<EmailRow | null> {
    const resultado = await db.execute({
      sql: `${COLUMNAS_SELECT} WHERE id = ?`,
      args: [id],
    });
    return (resultado.rows[0] as unknown as EmailRow) ?? null;
  },

  async obtenerPorIdDeUsuario(
    id: number,
    usuarioId: number,
  ): Promise<EmailRow | null> {
    const resultado = await db.execute({
      sql: `${COLUMNAS_SELECT} WHERE id = ? AND usuario_id = ?`,
      args: [id, usuarioId],
    });
    return (resultado.rows[0] as unknown as EmailRow) ?? null;
  },

  /**
   * El dedupe tiene que incluir al usuario: con gmail_message_id solo, el
   * email sincronizado por un usuario hacia de existir el del otro con el
   * mismo id de Gmail.
   */
  async obtenerPorGmailMessageId(
    gmailMessageId: string,
    usuarioId: number,
    tipo?: string,
  ): Promise<EmailRow | null> {
    let sql = `${COLUMNAS_SELECT} WHERE gmail_message_id = ? AND usuario_id = ?`;
    const args: InValue[] = [gmailMessageId, usuarioId];
    if (tipo) {
      sql += ' AND tipo = ?';
      args.push(tipo);
    }
    const resultado = await db.execute({ sql: `${sql} LIMIT 1`, args });
    return (resultado.rows[0] as unknown as EmailRow) ?? null;
  },

  async actualizar(
    id: number,
    usuarioId: number,
    input: ActualizarEmailInput,
  ): Promise<EmailRow | null> {
    const sets: string[] = [];
    const args: InValue[] = [];

    for (const [key, columna] of Object.entries(CAMPOS_ACTUALIZABLES)) {
      const valor = (input as Record<string, unknown>)[key];
      if (valor !== undefined) {
        sets.push(`${columna} = ?`);
        args.push(valor as InValue);
      }
    }

    if (sets.length === 0) {
      return this.obtenerPorIdDeUsuario(id, usuarioId);
    }

    const resultado = await db.execute({
      sql: `UPDATE emails SET ${sets.join(', ')} WHERE id = ? AND usuario_id = ?`,
      args: [...args, id, usuarioId],
    });

    if (resultado.rowsAffected === 0) {
      return null;
    }
    return this.obtenerPorIdDeUsuario(id, usuarioId);
  },

  async eliminar(id: number, usuarioId: number): Promise<boolean> {
    const resultado = await db.execute({
      sql: 'DELETE FROM emails WHERE id = ? AND usuario_id = ?',
      args: [id, usuarioId],
    });
    return resultado.rowsAffected > 0;
  },

  async listarResumenParaUsuario(usuarioId: number): Promise<EmailRow[]> {
    const resultado = await db.execute({
      sql: `
        SELECT e.id, e.postulacion_id, e.gmail_message_id, e.tipo, e.tipo_seguimiento,
               e.asunto, e.remitente, e.destinatario, e.fecha, e.enviado,
               e.contenido_resumen, e.tipo_respuesta, e.tipo_respuesta_fuente, e.created_at
        FROM emails e
        WHERE e.usuario_id = ?
        ORDER BY e.fecha DESC, e.id DESC
      `,
      args: [usuarioId],
    });
    return resultado.rows as unknown as EmailRow[];
  },

  async listarGmailMessageIds(usuarioId: number): Promise<string[]> {
    const resultado = await db.execute({
      sql: `
        SELECT gmail_message_id
        FROM emails
        WHERE usuario_id = ?
          AND gmail_message_id IS NOT NULL
          AND gmail_message_id != ''
      `,
      args: [usuarioId],
    });
    return resultado.rows.map((r) => r.gmail_message_id as string);
  },

  async listarParaAnalisisIA(
    usuarioId: number,
    limite = 100,
  ): Promise<EmailRow[]> {
    const resultado = await db.execute({
      sql: `
        SELECT e.id, e.postulacion_id, e.gmail_message_id, e.tipo, e.tipo_seguimiento,
               e.asunto, e.remitente, e.destinatario, e.fecha, e.enviado,
               e.contenido_resumen, e.cuerpo_html, e.tipo_respuesta, e.tipo_respuesta_fuente,
               e.created_at
        FROM emails e
        JOIN postulaciones p ON p.id = e.postulacion_id
        WHERE e.enviado = 0
          AND e.tipo = 'respuesta'
          AND e.tipo_respuesta IS NULL
          AND p.usuario_id = ?
        ORDER BY e.fecha ASC, e.id ASC
        LIMIT ?
      `,
      args: [usuarioId, limite],
    });
    return resultado.rows as unknown as EmailRow[];
  },

  async listarSinPostulacionParaIA(
    usuarioId: number,
    limite = 100,
  ): Promise<EmailRow[]> {
    const resultado = await db.execute({
      sql: `
        SELECT e.id, e.postulacion_id, e.gmail_message_id, e.tipo, e.tipo_seguimiento,
               e.asunto, e.remitente, e.destinatario, e.fecha, e.enviado,
               e.contenido_resumen, e.tipo_respuesta, e.tipo_respuesta_fuente, e.created_at
        FROM emails e
        WHERE e.usuario_id = ?
          AND e.postulacion_id IS NULL
          AND e.tipo_respuesta IS NULL
        ORDER BY e.fecha ASC, e.id ASC
        LIMIT ?
      `,
      args: [usuarioId, limite],
    });
    return resultado.rows as unknown as EmailRow[];
  },
};