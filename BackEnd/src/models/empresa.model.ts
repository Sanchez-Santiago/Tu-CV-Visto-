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
  async crear(input: CrearEmpresaInput): Promise<EmpresaRow> {
    const resultado = await db.execute({
      sql: `
        INSERT INTO empresas (nombre, pais, provincia, ciudad, modalidad, cadencia_contacto, observaciones)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
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

  async listar(modalidad?: string): Promise<EmpresaRow[]> {
    const args: InValue[] = [];
    let where = '';
    if (modalidad) {
      where = 'WHERE modalidad = ?';
      args.push(modalidad);
    }
    const resultado = await db.execute({
      sql: `
        SELECT id, nombre, pais, provincia, ciudad, modalidad, cadencia_contacto,
               observaciones, created_at, updated_at
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
        SELECT id, nombre, pais, provincia, ciudad, modalidad, cadencia_contacto,
               observaciones, created_at, updated_at
        FROM empresas
        WHERE id = ?
      `,
      args: [id],
    });
    return (resultado.rows[0] as unknown as EmpresaRow) ?? null;
  },

  async actualizar(
    id: number,
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
      return this.obtenerPorId(id);
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');
    const resultado = await db.execute({
      sql: `UPDATE empresas SET ${sets.join(', ')} WHERE id = ?`,
      args: [...args, id],
    });

    if (resultado.rowsAffected === 0) {
      return null;
    }
    return this.obtenerPorId(id);
  },

  async eliminar(id: number): Promise<boolean> {
    const resultado = await db.execute({
      sql: 'DELETE FROM empresas WHERE id = ?',
      args: [id],
    });
    return resultado.rowsAffected > 0;
  },

  async existeNombre(nombre: string, exceptoId?: number): Promise<boolean> {
    const resultado = await db.execute({
      sql: 'SELECT id FROM empresas WHERE LOWER(nombre) = LOWER(?) AND (? IS NULL OR id != ?)',
      args: [nombre, exceptoId ?? null, exceptoId ?? null],
    });
    return resultado.rows.length > 0;
  },
};