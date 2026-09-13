import type { InValue } from '@libsql/client';
import { db } from '../config/database';
import type { FirmaRow } from '../types/models';
import type {
  ActualizarFirmaInput,
  CrearFirmaMeInput,
} from '../schemas/firma';

const CAMPOS_ACTUALIZABLES = {
  nombre: 'nombre',
  tipo: 'tipo',
  contenido: 'contenido',
  imagen_mime: 'imagen_mime',
  imagen_base64: 'imagen_base64',
  enlace: 'enlace',
} as const;

const SELECCION = `
  SELECT id, usuario_id, nombre, tipo, contenido, imagen_mime,
         imagen_base64, enlace, created_at, updated_at
  FROM firmas
`;

export const FirmaModel = {
  async listarPorUsuario(usuarioId: number): Promise<FirmaRow[]> {
    const resultado = await db.execute({
      sql: `${SELECCION}
        WHERE usuario_id = ?
        ORDER BY id ASC
      `,
      args: [usuarioId],
    });
    return resultado.rows as unknown as FirmaRow[];
  },

  async obtenerPorId(id: number): Promise<FirmaRow | null> {
    const resultado = await db.execute({
      sql: `${SELECCION} WHERE id = ?`,
      args: [id],
    });
    return (resultado.rows[0] as unknown as FirmaRow) ?? null;
  },

  async crear(input: CrearFirmaMeInput & { usuario_id: number }): Promise<FirmaRow> {
    const resultado = await db.execute({
      sql: `
        INSERT INTO firmas
          (usuario_id, nombre, tipo, contenido, imagen_mime, imagen_base64, enlace)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        input.usuario_id,
        input.nombre,
        input.tipo,
        input.contenido ?? null,
        input.imagen_mime ?? null,
        input.imagen_base64 ?? null,
        input.enlace ?? null,
      ],
    });
    const creada = await this.obtenerPorId(Number(resultado.lastInsertRowid));
    if (!creada) {
      throw new Error('No se pudo recuperar la firma recién creada');
    }
    return creada;
  },

  async actualizar(
    id: number,
    input: ActualizarFirmaInput,
  ): Promise<FirmaRow | null> {
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
      sql: `UPDATE firmas SET ${sets.join(', ')} WHERE id = ?`,
      args: [...args, id],
    });

    if (resultado.rowsAffected === 0) {
      return null;
    }
    return this.obtenerPorId(id);
  },

  async eliminar(id: number): Promise<boolean> {
    const resultado = await db.execute({
      sql: 'DELETE FROM firmas WHERE id = ?',
      args: [id],
    });
    return resultado.rowsAffected > 0;
  },
};