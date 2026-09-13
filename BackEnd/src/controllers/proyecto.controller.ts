import type { Request, Response } from 'express';
import { ProyectoService } from '../services/proyecto.service';
import { asyncHandler } from '../utils/async-handler';

export const ProyectoController = {
  listar: asyncHandler(async (req: Request, res: Response) => {
    const proyectos = await ProyectoService.listar(req.usuarioId!);
    res.json({ ok: true, data: proyectos });
  }),

  crear: asyncHandler(async (req: Request, res: Response) => {
    const proyecto = await ProyectoService.crear(req.usuarioId!, req.body);
    res.status(201).json({ ok: true, data: proyecto });
  }),

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    const proyecto = await ProyectoService.actualizar(
      req.usuarioId!,
      Number(req.params.id),
      req.body,
    );
    res.json({ ok: true, data: proyecto });
  }),

  eliminar: asyncHandler(async (req: Request, res: Response) => {
    await ProyectoService.eliminar(req.usuarioId!, Number(req.params.id));
    res.status(204).send();
  }),
};