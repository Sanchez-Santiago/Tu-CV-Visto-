import type { Request, Response } from 'express';
import { EmailService } from '../services/email.service';
import { asyncHandler } from '../utils/async-handler';
import { listarEmailsQuery } from '../schemas/email';
import { usuarioIdDe } from '../utils/scope';

export const EmailController = {
  crear: asyncHandler(async (req: Request, res: Response) => {
    const email = await EmailService.crear(usuarioIdDe(req), req.body);
    res.status(201).json({ ok: true, data: email });
  }),

  listar: asyncHandler(async (req: Request, res: Response) => {
    const { data: q } = listarEmailsQuery.safeParse(req.query);
    const emails = await EmailService.listar(usuarioIdDe(req), {
      postulacionId: q?.postulacion_id,
    });
    res.json({ ok: true, data: emails });
  }),

  obtenerPorId: asyncHandler(async (req: Request, res: Response) => {
    const email = await EmailService.obtenerPorId(
      usuarioIdDe(req),
      Number(req.params.id),
    );
    res.json({ ok: true, data: email });
  }),

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    const email = await EmailService.actualizar(
      usuarioIdDe(req),
      Number(req.params.id),
      req.body,
    );
    res.json({ ok: true, data: email });
  }),

  eliminar: asyncHandler(async (req: Request, res: Response) => {
    await EmailService.eliminar(usuarioIdDe(req), Number(req.params.id));
    res.status(204).send();
  }),
};
