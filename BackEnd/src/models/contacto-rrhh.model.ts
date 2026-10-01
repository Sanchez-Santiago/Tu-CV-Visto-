import type { InValue } from '@libsql/client';
import { db } from '../config/database';
import type { ContactoRrhhRow } from '../types/models';
import type {
  ActualizarContactoRrhhInput,
  CrearContactoRrhhInput,
} from '../schemas/contacto-rrhh';

const CAMPOS_ACTUALIZABLES = {
  empresa_id: 'empresa_id',
  nombre: 'nombre',
  email: 'email',
  cargo: 'cargo',
  observaciones: 'observaciones',
} as const;

export const ContactoRrhhModel = {
  async crear(
    usuarioId: number,
    input: CrearContactoRrhhInput,
  ): Promise<ContactoRrhhRow> {
    const resultado = await db.execute({
      sql: `
        INSERT INTO contactos_rrhh (usuario_id, empresa_id, nombre, email, cargo, observaciones)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [
        usuarioId,
        input.empresa_id,
        input.nombre,
        input.email,
        input.cargo ?? null,
        input.observaciones ?? null,
      ],
    });
    const creado = await this.obtenerPorId(Number(resultado.lastInsertRowid));
    if (!creado) {
      throw new Error('No se pudo recuperar el contacto recién creado');
    }
    return creado;
  },

  async obtenerPorId(id: number): Promise<ContactoRrhhRow | null> {
    const resultado = await db.execute({
      sql: `
        SELECT id, usuario_id, empresa_id, nombre, email, cargo, observaciones,
               created_at, updated_at
        FROM contactos_rrhh
        WHERE id = ?
      `,
      args: [id],
    });
    return (resultado.rows[0] as unknown as ContactoRrhhRow) ?? null;
  },

  async listar(usuarioId: number, empresaId?: number): Promise<ContactoRrhhRow[]> {
    const args: InValue[] = [usuarioId];
    let where = 'WHERE usuario_id = ?';
    if (empresaId !== undefined) {
      where += ' AND empresa_id = ?';
      args.push(empresaId);
    }
    const resultado = await db.execute({
      sql: `
        SELECT id, usuario_id, empresa_id, nombre, email, cargo, observaciones,
               created_at, updated_at
        FROM contactos_rrhh
        ${where}
        ORDER BY nombre ASC
      `,
      args,
    });
    return resultado.rows as unknown as ContactoRrhhRow[];
  },

  async listarPorEmpresa(
    usuarioId: number,
    empresaId: number,
  ): Promise<ContactoRrhhRow[]> {
    return this.listar(usuarioId, empresaId);
  },

  async actualizar(
    id: number,
    usuarioId: number,
    input: ActualizarContactoRrhhInput,
  ): Promise<ContactoRrhhRow | null> {
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

    sets.push('updated_at = CURRENT_TIMESTAMP');
    const resultado = await db.execute({
      sql: `UPDATE contactos_rrhh SET ${sets.join(', ')} WHERE id = ? AND usuario_id = ?`,
      args: [...args, id, usuarioId],
    });

    if (resultado.rowsAffected === 0) {
      return null;
    }
    return this.obtenerPorIdDeUsuario(id, usuarioId);
  },

  async obtenerPorIdDeUsuario(
    id: number,
    usuarioId: number,
  ): Promise<ContactoRrhhRow | null> {
    const resultado = await db.execute({
      sql: 'SELECT id FROM contactos_rrhh WHERE id = ? AND usuario_id = ?',
      args: [id, usuarioId],
    });
    if (!resultado.rows[0]) return null;
    return this.obtenerPorId(id);
  },

  async eliminar(id: number, usuarioId: number): Promise<boolean> {
    const resultado = await db.execute({
      sql: 'DELETE FROM contactos_rrhh WHERE id = ? AND usuario_id = ?',
      args: [id, usuarioId],
    });
    return resultado.rowsAffected > 0;
  },

  async existeEmailEnEmpresa(
    usuarioId: number,
    email: string,
    empresaId: number,
    exceptoId?: number,
  ): Promise<boolean> {
    const resultado = await db.execute({
      sql: `
        SELECT id FROM contactos_rrhh
        WHERE usuario_id = ?
          AND LOWER(email) = LOWER(?) AND empresa_id = ?
          AND (? IS NULL OR id != ?)
      `,
      args: [usuarioId, email, empresaId, exceptoId ?? null, exceptoId ?? null],
    });
    return resultado.rows.length > 0;
  },
};