import { db } from '../config/database';
import type { CategoriaRow, UsuarioCategoriaRow } from '../types/models';

export const UsuarioCategoriaModel = {
  async asignar(
    usuarioId: number,
    categoriaId: number,
  ): Promise<UsuarioCategoriaRow> {
    await db.execute({
      sql: `
        INSERT INTO usuario_categorias (usuario_id, categoria_id)
        VALUES (?, ?)
      `,
      args: [usuarioId, categoriaId],
    });
    return { usuario_id: usuarioId, categoria_id: categoriaId };
  },

  async quitar(usuarioId: number, categoriaId: number): Promise<boolean> {
    const resultado = await db.execute({
      sql: `
        DELETE FROM usuario_categorias
        WHERE usuario_id = ? AND categoria_id = ?
      `,
      args: [usuarioId, categoriaId],
    });
    return resultado.rowsAffected > 0;
  },

  async listarCategoriasDeUsuario(
    usuarioId: number,
  ): Promise<CategoriaRow[]> {
    const resultado = await db.execute({
      sql: `
        SELECT c.id, c.nombre, c.created_at
        FROM usuario_categorias uc
        JOIN categorias_trabajo c ON c.id = uc.categoria_id
        WHERE uc.usuario_id = ?
        ORDER BY c.nombre ASC
      `,
      args: [usuarioId],
    });
    return resultado.rows as unknown as CategoriaRow[];
  },

  async existe(usuarioId: number, categoriaId: number): Promise<boolean> {
    const resultado = await db.execute({
      sql: `
        SELECT 1 FROM usuario_categorias
        WHERE usuario_id = ? AND categoria_id = ?
      `,
      args: [usuarioId, categoriaId],
    });
    return resultado.rows.length > 0;
  },
};