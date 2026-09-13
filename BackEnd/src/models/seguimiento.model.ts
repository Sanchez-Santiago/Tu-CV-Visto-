import type { InValue } from '@libsql/client';
import { db } from '../config/database';
import type { SeguimientoRow } from '../types/models';
import type {
  ActualizarSeguimientoInput,
  CrearSeguimientoInput,
} from '../schemas/seguimiento';

const CAMPOS_ACTUALIZABLES = {
  postulacion_id: 'postulacion_id',
  fecha_programada: 'fecha_programada',
  tipo_seguimiento: 'tipo_seguimiento',
  enviado: 'enviado',
  requiere_aprobacion: 'requiere_aprobacion',
  fecha_envio: 'fecha_envio',
  observaciones: 'observaciones',
} as const;

export interface FiltroSeguimientos {
  postulacionId?: number;
  enviado?: 0 | 1;
  soloPendientes?: boolean;
}

const COLUMNAS_SELECT = `
  SELECT id, postulacion_id, fecha_programada, tipo_seguimiento, enviado,
         requiere_aprobacion, fecha_envio, observaciones, created_at
  FROM seguimientos
`;

export const SeguimientoModel = {
  async crear(input: CrearSeguimientoInput): Promise<SeguimientoRow> {
    const resultado = await db.execute({
      sql: `
        INSERT INTO seguimientos
          (postulacion_id, fecha_programada, tipo_seguimiento, enviado,
           requiere_aprobacion, fecha_envio, observaciones)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        input.postulacion_id,
        input.fecha_programada,
        input.tipo_seguimiento,
        input.enviado,
        input.requiere_aprobacion,
        input.fecha_envio ?? null,
        input.observaciones ?? null,
      ],
    });
    const creado = await this.obtenerPorId(Number(resultado.lastInsertRowid));
    if (!creado) {
      throw new Error('No se pudo recuperar el seguimiento recién creado');
    }
    return creado;
  },

  async listar(filtros: FiltroSeguimientos = {}): Promise<SeguimientoRow[]> {
    const condiciones: string[] = [];
    const args: InValue[] = [];

    if (filtros.postulacionId) {
      condiciones.push('postulacion_id = ?');
      args.push(filtros.postulacionId);
    }
    if (filtros.enviado !== undefined) {
      condiciones.push('enviado = ?');
      args.push(filtros.enviado);
    }
    if (filtros.soloPendientes) {
      condiciones.push('enviado = 0');
    }

    const where =
      condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    const resultado = await db.execute({
      sql: `
        ${COLUMNAS_SELECT}
        ${where}
        ORDER BY fecha_programada ASC, id ASC
      `,
      args,
    });
    return resultado.rows as unknown as SeguimientoRow[];
  },

  async obtenerPorId(id: number): Promise<SeguimientoRow | null> {
    const resultado = await db.execute({
      sql: `${COLUMNAS_SELECT} WHERE id = ?`,
      args: [id],
    });
    return (resultado.rows[0] as unknown as SeguimientoRow) ?? null;
  },

  async actualizar(
    id: number,
    input: ActualizarSeguimientoInput,
  ): Promise<SeguimientoRow | null> {
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

    const resultado = await db.execute({
      sql: `UPDATE seguimientos SET ${sets.join(', ')} WHERE id = ?`,
      args: [...args, id],
    });

    if (resultado.rowsAffected === 0) {
      return null;
    }
    return this.obtenerPorId(id);
  },

  async eliminar(id: number): Promise<boolean> {
    const resultado = await db.execute({
      sql: 'DELETE FROM seguimientos WHERE id = ?',
      args: [id],
    });
    return resultado.rowsAffected > 0;
  },
};