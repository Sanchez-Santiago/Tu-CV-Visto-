import type { InValue } from '@libsql/client';
import { db } from '../config/database';
import type { PostulacionRow } from '../types/models';
import type { Interes, EstadoPostulacion, Modalidad } from '../types/common';
import type {
  ActualizarPostulacionInput,
  CrearPostulacionInput,
} from '../schemas/postulacion';

export interface FiltroPostulaciones {
  usuarioId: number;
  estado?: EstadoPostulacion;
  interes?: Interes;
  modalidad?: Modalidad;
  empresaId?: number;
}

const CAMPOS_ACTUALIZABLES = {
  empresa_id: 'empresa_id',
  puesto: 'puesto',
  modalidad: 'modalidad',
  respondio: 'respondio',
  estado: 'estado',
  interes: 'interes',
  fuente: 'fuente',
  cantidad_mails_enviados: 'cantidad_mails_enviados',
  fecha_postulacion: 'fecha_postulacion',
  ultimo_contacto: 'ultimo_contacto',
  proxima_contacto: 'proxima_contacto',
  observaciones: 'observaciones',
} as const;

const COLUMNAS_SELECT = `
  SELECT id, usuario_id, empresa_id, puesto, modalidad, respondio,
         estado, interes, fuente, cantidad_mails_enviados,
         fecha_postulacion, ultimo_contacto, proxima_contacto, observaciones,
         created_at, updated_at
  FROM postulaciones
`;

export const PostulacionModel = {
  async crear(
    usuarioId: number,
    input: Omit<CrearPostulacionInput, 'usuario_id'>,
  ): Promise<PostulacionRow> {
    const resultado = await db.execute({
      sql: `
        INSERT INTO postulaciones
          (usuario_id, empresa_id, puesto, modalidad, respondio, estado,
           interes, fuente, cantidad_mails_enviados, fecha_postulacion,
           ultimo_contacto, proxima_contacto, observaciones)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        usuarioId,
        input.empresa_id,
        input.puesto,
        input.modalidad ?? null,
        input.respondio,
        input.estado,
        input.interes,
        input.fuente ?? null,
        input.cantidad_mails_enviados,
        input.fecha_postulacion ?? null,
        input.ultimo_contacto ?? null,
        input.proxima_contacto ?? null,
        input.observaciones ?? null,
      ],
    });
    const creada = await this.obtenerPorId(Number(resultado.lastInsertRowid));
    if (!creada) {
      throw new Error('No se pudo recuperar la postulación recién creada');
    }
    return creada;
  },

  async listar(filtros: FiltroPostulaciones): Promise<PostulacionRow[]> {
    const condiciones: string[] = ['usuario_id = ?'];
    const args: InValue[] = [filtros.usuarioId];

    if (filtros.estado) {
      condiciones.push('estado = ?');
      args.push(filtros.estado);
    }
    if (filtros.interes) {
      condiciones.push('interes = ?');
      args.push(filtros.interes);
    }
    if (filtros.modalidad) {
      condiciones.push('modalidad = ?');
      args.push(filtros.modalidad);
    }
    if (filtros.empresaId) {
      condiciones.push('empresa_id = ?');
      args.push(filtros.empresaId);
    }

    const resultado = await db.execute({
      sql: `
        ${COLUMNAS_SELECT}
        WHERE ${condiciones.join(' AND ')}
        ORDER BY COALESCE(fecha_postulacion, created_at) DESC, id DESC
      `,
      args,
    });
    return resultado.rows as unknown as PostulacionRow[];
  },

  async obtenerPorId(id: number): Promise<PostulacionRow | null> {
    const resultado = await db.execute({
      sql: `${COLUMNAS_SELECT} WHERE id = ?`,
      args: [id],
    });
    return (resultado.rows[0] as unknown as PostulacionRow) ?? null;
  },

  async actualizar(
    id: number,
    usuarioId: number,
    input: ActualizarPostulacionInput,
  ): Promise<PostulacionRow | null> {
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
      sql: `UPDATE postulaciones SET ${sets.join(', ')} WHERE id = ? AND usuario_id = ?`,
      args: [...args, id, usuarioId],
    });

    if (resultado.rowsAffected === 0) {
      return null;
    }
    return this.obtenerPorId(id);
  },

  async eliminar(id: number, usuarioId: number): Promise<boolean> {
    const resultado = await db.execute({
      sql: 'DELETE FROM postulaciones WHERE id = ? AND usuario_id = ?',
      args: [id, usuarioId],
    });
    return resultado.rowsAffected > 0;
  },

  async incrementarMails(
    postulacionId: number,
    fechaContacto?: string,
    proximaContacto?: string | null,
  ): Promise<void> {
    await db.execute({
      sql: `
        UPDATE postulaciones
        SET cantidad_mails_enviados = cantidad_mails_enviados + 1,
            ultimo_contacto = COALESCE(?, ultimo_contacto),
            proxima_contacto = COALESCE(?, proxima_contacto),
            respondio = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [
        aFechaDia(fechaContacto),
        proximaContacto ?? null,
        postulacionId,
      ],
    });
  },

  async decrementarMails(postulacionId: number): Promise<void> {
    await db.execute({
      sql: `
        UPDATE postulaciones
        SET cantidad_mails_enviados = MAX(0, cantidad_mails_enviados - 1),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [postulacionId],
    });
  },
};

function aFechaDia(valor?: string): string | null {
  if (!valor) return null;
  const dia = valor.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : null;
}