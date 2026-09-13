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
  async crear(input: CrearContactoRrhhInput): Promise<ContactoRrhhRow> {
    const resultado = await db.execute({
      sql: `
        INSERT INTO contactos_rrhh (empresa_id, nombre, email, cargo, observaciones)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [
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
        SELECT id, empresa_id, nombre, email, cargo, observaciones,
               created_at, updated_at
        FROM contactos_rrhh
        WHERE id = ?
      `,
      args: [id],
    });
    return (resultado.rows[0] as unknown as ContactoRrhhRow) ?? null;
  },

  async listar(empresaId?: number): Promise<ContactoRrhhRow[]> {
    const args: InValue[] = [];
    const where =
      empresaId !== undefined ? 'WHERE empresa_id = ?' : '';
    if (empresaId !== undefined) {
      args.push(empresaId);
    }
    const resultado = await db.execute({
      sql: `
        SELECT id, empresa_id, nombre, email, cargo, observaciones,
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
    empresaId: number,
  ): Promise<ContactoRrhhRow[]> {
    return this.listar(empresaId);
  },

  async actualizar(
    id: number,
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
      return this.obtenerPorId(id);
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');
    const resultado = await db.execute({
      sql: `UPDATE contactos_rrhh SET ${sets.join(', ')} WHERE id = ?`,
      args: [...args, id],
    });

    if (resultado.rowsAffected === 0) {
      return null;
    }
    return this.obtenerPorId(id);
  },

  async eliminar(id: number): Promise<boolean> {
    const resultado = await db.execute({
      sql: 'DELETE FROM contactos_rrhh WHERE id = ?',
      args: [id],
    });
    return resultado.rowsAffected > 0;
  },

  async existeEmailEnEmpresa(
    email: string,
    empresaId: number,
    exceptoId?: number,
  ): Promise<boolean> {
    const resultado = await db.execute({
      sql: `
        SELECT id FROM contactos_rrhh
        WHERE LOWER(email) = LOWER(?) AND empresa_id = ?
          AND (? IS NULL OR id != ?)
      `,
      args: [email, empresaId, exceptoId ?? null, exceptoId ?? null],
    });
    return resultado.rows.length > 0;
  },
};