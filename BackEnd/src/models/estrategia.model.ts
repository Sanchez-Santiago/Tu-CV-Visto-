import { db } from '../config/database';

export interface PostulacionParaEstrategia {
  id: number;
  puesto: string;
  estado: string;
  respondio: number;
  cantidad_mails_enviados: number;
  fecha_postulacion: string | null;
  ultimo_contacto: string | null;
  proxima_contacto: string | null;
  created_at: string;
  empresa_id: number | null;
  empresa_nombre: string;
  empresa_cadencia_contacto: number | null;
}

export const EstrategiaModel = {
  async listarDebidas(usuarioId: number): Promise<PostulacionParaEstrategia[]> {
    const resultado = await db.execute({
      sql: `
        SELECT p.id, p.puesto, p.estado, p.respondio, p.cantidad_mails_enviados,
               p.fecha_postulacion, p.ultimo_contacto, p.proxima_contacto,
               p.created_at, p.empresa_id, e.nombre AS empresa_nombre,
               e.cadencia_contacto AS empresa_cadencia_contacto
        FROM postulaciones p
        LEFT JOIN empresas e ON e.id = p.empresa_id
        WHERE p.usuario_id = ?
          AND p.estado NOT IN ('rechazado', 'aceptado', 'cancelado')
        ORDER BY COALESCE(p.proxima_contacto, p.created_at) ASC, p.id ASC
      `,
      args: [usuarioId],
    });
    return resultado.rows as unknown as PostulacionParaEstrategia[];
  },
};