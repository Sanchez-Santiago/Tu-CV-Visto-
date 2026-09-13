import type { Request, Response } from 'express';
import { FirmaService } from '../services/firma.service';
import { asyncHandler } from '../utils/async-handler';

export const FirmaController = {
  listar: asyncHandler(async (req: Request, res: Response) => {
    const firmas = await FirmaService.listar(req.usuarioId!);
    res.json({ ok: true, data: firmas });
  }),

  crear: asyncHandler(async (req: Request, res: Response) => {
    const firma = await FirmaService.crear(req.usuarioId!, req.body);
    res.status(201).json({ ok: true, data: firma });
  }),

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    const firma = await FirmaService.actualizar(
      req.usuarioId!,
      Number(req.params.id),
      req.body,
    );
    res.json({ ok: true, data: firma });
  }),

  eliminar: asyncHandler(async (req: Request, res: Response) => {
    await FirmaService.eliminar(req.usuarioId!, Number(req.params.id));
    res.status(204).send();
  }),
};