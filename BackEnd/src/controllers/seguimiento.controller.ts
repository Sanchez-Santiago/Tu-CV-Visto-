import type { Request, Response } from 'express';
import { SeguimientoService } from '../services/seguimiento.service';
import { asyncHandler } from '../utils/async-handler';
import { listarSeguimientosQuery } from '../schemas/seguimiento';
import { usuarioIdDe } from '../utils/scope';

export const SeguimientoController = {
  crear: asyncHandler(async (req: Request, res: Response) => {
    const seguimiento = await SeguimientoService.crear(usuarioIdDe(req), req.body);
    res.status(201).json({ ok: true, data: seguimiento });
  }),

  listar: asyncHandler(async (req: Request, res: Response) => {
    const { data: q } = listarSeguimientosQuery.safeParse(req.query);
    const seguimientos = await SeguimientoService.listar(usuarioIdDe(req), {
      postulacionId: q?.postulacion_id,
      enviado: q?.enviado as 0 | 1 | undefined,
    });
    res.json({ ok: true, data: seguimientos });
  }),

  pendientes: asyncHandler(async (req: Request, res: Response) => {
    const seguimientos = await SeguimientoService.listarPendientes(
      usuarioIdDe(req),
    );
    res.json({ ok: true, data: seguimientos });
  }),

  obtenerPorId: asyncHandler(async (req: Request, res: Response) => {
    const seguimiento = await SeguimientoService.obtenerPorId(
      usuarioIdDe(req),
      Number(req.params.id),
    );
    res.json({ ok: true, data: seguimiento });
  }),

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    const seguimiento = await SeguimientoService.actualizar(
      usuarioIdDe(req),
      Number(req.params.id),
      req.body,
    );
    res.json({ ok: true, data: seguimiento });
  }),

  eliminar: asyncHandler(async (req: Request, res: Response) => {
    await SeguimientoService.eliminar(usuarioIdDe(req), Number(req.params.id));
    res.status(204).send();
  }),
};