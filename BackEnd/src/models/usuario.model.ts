import type { InValue } from '@libsql/client';
import { db } from '../config/database';
import type { ActualizarUsuarioInput } from '../schemas/usuario';
import type { UsuarioRow } from '../types/models';

const CAMPOS_ACTUALIZABLES = {
  nombre: 'nombre',
  email: 'email',
  perfil: 'perfil',
  pais: 'pais',
  provincia: 'provincia',
  cv: 'cv',
} as const;

export const UsuarioModel = {
  async obtenerPorId(id: number): Promise<UsuarioRow | null> {
    const resultado = await db.execute({
      sql: `
        SELECT id, nombre, email, perfil, pais, provincia, cv,
               created_at, updated_at
        FROM usuarios
        WHERE id = ?
      `,
      args: [id],
    });
    return (resultado.rows[0] as unknown as UsuarioRow) ?? null;
  },

  async obtenerPorEmail(email: string): Promise<UsuarioRow | null> {
    const resultado = await db.execute({
      sql: `
        SELECT id, nombre, email, perfil, pais, provincia, cv,
               created_at, updated_at
        FROM usuarios
        WHERE LOWER(email) = LOWER(?)
      `,
      args: [email],
    });
    return (resultado.rows[0] as unknown as UsuarioRow) ?? null;
  },

  async crear(input: {
    nombre: string;
    email: string;
  }): Promise<UsuarioRow> {
    const resultado = await db.execute({
      sql: 'INSERT INTO usuarios (nombre, email) VALUES (?, ?)',
      args: [input.nombre, input.email],
    });
    const creado = await this.obtenerPorId(Number(resultado.lastInsertRowid));
    if (!creado) {
      throw new Error('No se pudo recuperar el usuario recién creado');
    }
    return creado;
  },

  async actualizar(
    id: number,
    input: ActualizarUsuarioInput,
  ): Promise<UsuarioRow | null> {
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
      return this.obtenerPorId(id);
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');
    const resultado = await db.execute({
      sql: `UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`,
      args: [...args, id],
    });

    if (resultado.rowsAffected === 0) {
      return null;
    }
    return this.obtenerPorId(id);
  },
};