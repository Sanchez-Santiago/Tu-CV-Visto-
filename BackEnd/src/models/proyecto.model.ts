import { db } from '../config/database';
import type { ProyectoRow } from '../types/models';

export const ProyectoModel = {
  async listarPorUsuario(usuarioId: number): Promise<ProyectoRow[]> {
    const resultado = await db.execute({
      sql: `
        SELECT id, usuario_id, nombre, descripcion, tecnologias, url,
               created_at, updated_at
        FROM proyectos
        WHERE usuario_id = ?
        ORDER BY COALESCE(created_at, '') DESC, id DESC
      `,
      args: [usuarioId],
    });
    return resultado.rows as unknown as ProyectoRow[];
  },
};