import { db } from '../config/database';
import type { ExperienciaRow } from '../types/models';

export const ExperienciaModel = {
  async listarPorUsuario(usuarioId: number): Promise<ExperienciaRow[]> {
    const resultado = await db.execute({
      sql: `
        SELECT id, usuario_id, empresa, puesto, fecha_inicio, fecha_fin,
               descripcion, created_at, updated_at
        FROM experiencias_laborales
        WHERE usuario_id = ?
        ORDER BY COALESCE(fecha_inicio, '') DESC, id DESC
      `,
      args: [usuarioId],
    });
    return resultado.rows as unknown as ExperienciaRow[];
  },
};