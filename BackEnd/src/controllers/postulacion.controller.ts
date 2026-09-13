import type { Request, Response } from 'express';
import { PostulacionService } from '../services/postulacion.service';
import { asyncHandler } from '../utils/async-handler';
import { listarPostulacionesQuery } from '../schemas/postulacion';

export const PostulacionController = {
  crear: asyncHandler(async (req: Request, res: Response) => {
    const postulacion = await PostulacionService.crear(req.body);
    res.status(201).json({ ok: true, data: postulacion });
  }),

  listar: asyncHandler(async (req: Request, res: Response) => {
    const { data: q } = listarPostulacionesQuery.safeParse(req.query);
    const postulaciones = await PostulacionService.listar({
      estado: q?.estado,
      interes: q?.interes,
      modalidad: q?.modalidad,
      empresaId: q?.empresa_id,
      usuarioId: q?.usuario_id,
    });
    res.json({ ok: true, data: postulaciones });
  }),

  obtenerPorId: asyncHandler(async (req: Request, res: Response) => {
    const postulacion = await PostulacionService.obtenerPorId(
      Number(req.params.id),
    );
    res.json({ ok: true, data: postulacion });
  }),

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    const postulacion = await PostulacionService.actualizar(
      Number(req.params.id),
      req.body,
    );
    res.json({ ok: true, data: postulacion });
  }),

  eliminar: asyncHandler(async (req: Request, res: Response) => {
    await PostulacionService.eliminar(Number(req.params.id));
    res.status(204).send();
  }),

  relacion: asyncHandler(async (req: Request, res: Response) => {
    const relacion = await PostulacionService.obtenerRelacion(
      Number(req.params.id),
    );
    res.json({ ok: true, data: relacion });
  }),
};