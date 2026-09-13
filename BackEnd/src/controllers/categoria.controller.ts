import type { Request, Response } from 'express';
import { CategoriaService } from '../services/categoria.service';
import { asyncHandler } from '../utils/async-handler';

export const CategoriaController = {
  crear: asyncHandler(async (req: Request, res: Response) => {
    const categoria = await CategoriaService.crear(req.body);
    res.status(201).json({ ok: true, data: categoria });
  }),

  listar: asyncHandler(async (_req: Request, res: Response) => {
    const categorias = await CategoriaService.listar();
    res.json({ ok: true, data: categorias });
  }),

  obtenerPorId: asyncHandler(async (req: Request, res: Response) => {
    const categoria = await CategoriaService.obtenerPorId(Number(req.params.id));
    res.json({ ok: true, data: categoria });
  }),

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    const categoria = await CategoriaService.actualizar(
      Number(req.params.id),
      req.body,
    );
    res.json({ ok: true, data: categoria });
  }),

  eliminar: asyncHandler(async (req: Request, res: Response) => {
    await CategoriaService.eliminar(Number(req.params.id));
    res.status(204).send();
  }),
};