import type { InValue } from '@libsql/client';
import { db } from '../config/database';
import type { EmpresaRow } from '../types/models';
import type {
  ActualizarEmpresaInput,
  CrearEmpresaInput,
} from '../schemas/empresa';

const CAMPOS_ACTUALIZABLES = {
  nombre: 'nombre',
  pais: 'pais',
  provincia: 'provincia',
  ciudad: 'ciudad',
  modalidad: 'modalidad',
  cadencia_contacto: 'cadencia_contacto',
  observaciones: 'observaciones',
} as const;

export const EmpresaModel = {
  async crear(usuarioId: number, input: CrearEmpresaInput): Promise<EmpresaRow> {
    const resultado = await db.execute({
      sql: `
        INSERT INTO empresas (usuario_id, nombre, pais, provincia, ciudad, modalidad, cadencia_contacto, observaciones)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        usuarioId,
        input.nombre,
        input.pais ?? null,
        input.provincia ?? null,
        input.ciudad ?? null,
        input.modalidad ?? null,
        input.cadencia_contacto ?? null,
        input.observaciones ?? null,
      ],
    });
    const creada = await this.obtenerPorId(Number(resultado.lastInsertRowid));
    if (!creada) {
      throw new Error('No se pudo recuperar la empresa recién creada');
    }
    return creada;
  },

  async listar(usuarioId: number, modalidad?: string): Promise<EmpresaRow[]> {
    const args: InValue[] = [usuarioId];
    let where = 'WHERE usuario_id = ?';
    if (modalidad) {
      where += ' AND modalidad = ?';
      args.push(modalidad);
    }
    const resultado = await db.execute({
      sql: `
        SELECT id, usuario_id, nombre, pais, provincia, ciudad, modalidad,
               cadencia_contacto, observaciones, created_at, updated_at
        FROM empresas
        ${where}
        ORDER BY nombre ASC
      `,
      args,
    });
    return resultado.rows as unknown as EmpresaRow[];
  },

  async obtenerPorId(id: number): Promise<EmpresaRow | null> {
    const resultado = await db.execute({
      sql: `
        SELECT id, usuario_id, nombre, pais, provincia, ciudad, modalidad,
               cadencia_contacto, observaciones, created_at, updated_at
        FROM empresas
        WHERE id = ?
      `,
      args: [id],
    });
    return (resultado.rows[0] as unknown as EmpresaRow) ?? null;
  },

  async obtenerPorIdDeUsuario(
    id: number,
    usuarioId: number,
  ): Promise<EmpresaRow | null> {
    const resultado = await db.execute({
      sql: 'SELECT id FROM empresas WHERE id = ? AND usuario_id = ?',
      args: [id, usuarioId],
    });
    if (!resultado.rows[0]) return null;
    return this.obtenerPorId(id);
  },

  async actualizar(
    id: number,
    usuarioId: number,
    input: ActualizarEmpresaInput,
  ): Promise<EmpresaRow | null> {
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
      sql: `UPDATE empresas SET ${sets.join(', ')} WHERE id = ? AND usuario_id = ?`,
      args: [...args, id, usuarioId],
    });

    if (resultado.rowsAffected === 0) {
      return null;
    }
    return this.obtenerPorIdDeUsuario(id, usuarioId);
  },

  async eliminar(id: number, usuarioId: number): Promise<boolean> {
    const resultado = await db.execute({
      sql: 'DELETE FROM empresas WHERE id = ? AND usuario_id = ?',
      args: [id, usuarioId],
    });
    return resultado.rowsAffected > 0;
  },

  async existeNombre(
    usuarioId: number,
    nombre: string,
    exceptoId?: number,
  ): Promise<boolean> {
    const resultado = await db.execute({
      sql: 'SELECT id FROM empresas WHERE usuario_id = ? AND LOWER(nombre) = LOWER(?) AND (? IS NULL OR id != ?)',
      args: [usuarioId, nombre, exceptoId ?? null, exceptoId ?? null],
    });
    return resultado.rows.length > 0;
  },
};