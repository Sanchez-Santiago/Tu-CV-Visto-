import type { Request, Response } from 'express';
import { EstrategiaService } from '../services/estrategia.service';
import { asyncHandler } from '../utils/async-handler';
import type {
  ConfirmarRechazoInput,
  RenovarInput,
} from '../schemas/estrategia';

export const EstrategiaController = {
  debidas: asyncHandler(async (req: Request, res: Response) => {
    const debidas = await EstrategiaService.listarDebidas(req.usuarioId!);
    res.json({ ok: true, data: debidas });
  }),

  renovaciones: asyncHandler(async (req: Request, res: Response) => {
    const renovaciones = await EstrategiaService.listarRenovaciones(
      req.usuarioId!,
    );
    res.json({ ok: true, data: renovaciones });
  }),

  renovar: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as RenovarInput;
    const resultado = await EstrategiaService.renovar(req.usuarioId!, input.items);
    res.json({ ok: true, data: resultado });
  }),

  revisionRechazos: asyncHandler(async (req: Request, res: Response) => {
    const candidatos = await EstrategiaService.revisionRechazos(
      req.usuarioId!,
    );
    res.json({ ok: true, data: candidatos });
  }),

  confirmarRechazo: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as ConfirmarRechazoInput;
    const actualizada = await EstrategiaService.confirmarRechazo(
      req.usuarioId!,
      input.postulacion_id,
    );
    res.json({ ok: true, data: actualizada });
  }),

  estadisticas: asyncHandler(async (req: Request, res: Response) => {
    const estadisticas = await EstrategiaService.estadisticas(req.usuarioId!);
    res.json({ ok: true, data: estadisticas });
  }),
};