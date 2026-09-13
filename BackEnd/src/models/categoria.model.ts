import { db } from '../config/database';
import type { CategoriaRow } from '../types/models';
import type {
  ActualizarCategoriaInput,
  CrearCategoriaInput,
} from '../schemas/categoria';

export const CategoriaModel = {
  async crear(input: CrearCategoriaInput): Promise<CategoriaRow> {
    const resultado = await db.execute({
      sql: 'INSERT INTO categorias_trabajo (nombre) VALUES (?)',
      args: [input.nombre],
    });
    const id = Number(resultado.lastInsertRowid);
    const creada = await this.obtenerPorId(id);
    if (!creada) {
      throw new Error('No se pudo recuperar la categoría recién creada');
    }
    return creada;
  },

  async listar(): Promise<CategoriaRow[]> {
    const resultado = await db.execute(
      'SELECT id, nombre, created_at FROM categorias_trabajo ORDER BY nombre ASC',
    );
    return resultado.rows as unknown as CategoriaRow[];
  },

  async obtenerPorId(id: number): Promise<CategoriaRow | null> {
    const resultado = await db.execute({
      sql: 'SELECT id, nombre, created_at FROM categorias_trabajo WHERE id = ?',
      args: [id],
    });
    const fila = resultado.rows[0];
    return (fila as unknown as CategoriaRow) ?? null;
  },

  async actualizar(
    id: number,
    input: ActualizarCategoriaInput,
  ): Promise<CategoriaRow | null> {
    if (input.nombre === undefined) {
      return this.obtenerPorId(id);
    }
    const resultado = await db.execute({
      sql: 'UPDATE categorias_trabajo SET nombre = ? WHERE id = ?',
      args: [input.nombre, id],
    });
    if (resultado.rowsAffected === 0) {
      return null;
    }
    return this.obtenerPorId(id);
  },

  async eliminar(id: number): Promise<boolean> {
    const resultado = await db.execute({
      sql: 'DELETE FROM categorias_trabajo WHERE id = ?',
      args: [id],
    });
    return resultado.rowsAffected > 0;
  },

  async existeNombre(
    nombre: string,
    exceptoId?: number,
  ): Promise<boolean> {
    const resultado = await db.execute({
      sql: 'SELECT id FROM categorias_trabajo WHERE LOWER(nombre) = LOWER(?) AND (? IS NULL OR id != ?)',
      args: [nombre, exceptoId ?? null, exceptoId ?? null],
    });
    return resultado.rows.length > 0;
  },
};