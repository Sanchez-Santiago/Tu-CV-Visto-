import type { Request, Response } from 'express';
import { ExperienciaService } from '../services/experiencia.service';
import { asyncHandler } from '../utils/async-handler';

export const ExperienciaController = {
  listar: asyncHandler(async (req: Request, res: Response) => {
    const experiencias = await ExperienciaService.listar(req.usuarioId!);
    res.json({ ok: true, data: experiencias });
  }),

  crear: asyncHandler(async (req: Request, res: Response) => {
    const experiencia = await ExperienciaService.crear(req.usuarioId!, req.body);
    res.status(201).json({ ok: true, data: experiencia });
  }),

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    const experiencia = await ExperienciaService.actualizar(
      req.usuarioId!,
      Number(req.params.id),
      req.body,
    );
    res.json({ ok: true, data: experiencia });
  }),

  eliminar: asyncHandler(async (req: Request, res: Response) => {
    await ExperienciaService.eliminar(req.usuarioId!, Number(req.params.id));
    res.status(204).send();
  }),
};