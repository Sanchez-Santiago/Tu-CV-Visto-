import type { Request, Response } from 'express';
import { PostulacionContactoService } from '../services/postulacion-contacto.service';
import { asyncHandler } from '../utils/async-handler';
import { usuarioIdDe } from '../utils/scope';

export const PostulacionContactoController = {
  asignar: asyncHandler(async (req: Request, res: Response) => {
    const contacto = await PostulacionContactoService.asignar(
      usuarioIdDe(req),
      Number(req.params.postulacionId),
      req.body.contacto_rrhh_id,
    );
    res.status(201).json({ ok: true, data: contacto });
  }),

  listar: asyncHandler(async (req: Request, res: Response) => {
    const contactos = await PostulacionContactoService.listarContactos(
      usuarioIdDe(req),
      Number(req.params.postulacionId),
    );
    res.json({ ok: true, data: contactos });
  }),

  quitar: asyncHandler(async (req: Request, res: Response) => {
    await PostulacionContactoService.quitar(
      usuarioIdDe(req),
      Number(req.params.postulacionId),
      Number(req.params.contactoId),
    );
    res.status(204).send();
  }),
};