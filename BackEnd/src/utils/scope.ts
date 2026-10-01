import type { Request } from 'express';
import { PostulacionModel } from '../models/postulacion.model';
import type { PostulacionRow } from '../types/models';
import { AppError, NotFoundError } from './errors';

/**
 * El usuario siempre se deriva de la sesión validada por authMiddleware.
 * Antes los controladores usaban `req.usuarioId!` y varios servicios ni
 * siquiera lo recibían, así que las lecturas caían en listados globales.
 */
export function usuarioIdDe(req: Request): number {
  if (typeof req.usuarioId !== 'number') {
    throw new AppError(401, 'No autenticado');
  }
  return req.usuarioId;
}

/**
 * Para rutas con :usuarioId en el path (p. ej. /usuarios/:usuarioId/categorias).
 * Antes el controlador usaba el path param, así que un usuario autenticado
 * podía leer, agregar y borrar las categorías de otro.
 */
export function usuarioIdDePath(req: Request, param = 'usuarioId'): number {
  const usuarioId = usuarioIdDe(req);
  if (Number(req.params[param]) !== usuarioId) {
    throw new NotFoundError('Recurso no encontrado');
  }
  return usuarioId;
}

/**
 * Devuelve la postulación solo si pertenece al usuario. Si es de otro,
 * responde 404 (no 403) para no confirmar la existencia de ids ajenos.
 */
export async function postulacionDeUsuario(
  id: number,
  usuarioId: number,
): Promise<PostulacionRow> {
  const postulacion = await PostulacionModel.obtenerPorId(id);
  if (!postulacion || postulacion.usuario_id !== usuarioId) {
    throw new NotFoundError(`Postulación ${id} no encontrada`);
  }
  return postulacion;
}
