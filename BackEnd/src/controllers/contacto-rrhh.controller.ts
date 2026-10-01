import type { Request, Response } from 'express';
import { ContactoRrhhService } from '../services/contacto-rrhh.service';
import { asyncHandler } from '../utils/async-handler';
import { usuarioIdDe } from '../utils/scope';

export const ContactoRrhhController = {
  crear: asyncHandler(async (req: Request, res: Response) => {
    const contacto = await ContactoRrhhService.crear(usuarioIdDe(req), req.body);
    res.status(201).json({ ok: true, data: contacto });
  }),

  obtenerPorId: asyncHandler(async (req: Request, res: Response) => {
    const contacto = await ContactoRrhhService.obtenerPorId(
      usuarioIdDe(req),
      Number(req.params.id),
    );
    res.json({ ok: true, data: contacto });
  }),

  listar: asyncHandler(async (req: Request, res: Response) => {
    const contactos = await ContactoRrhhService.listar(
      usuarioIdDe(req),
      req.query.empresa_id !== undefined
        ? Number(req.query.empresa_id)
        : undefined,
    );
    res.json({ ok: true, data: contactos });
  }),

  listarPorEmpresa: asyncHandler(async (req: Request, res: Response) => {
    const contactos = await ContactoRrhhService.listarPorEmpresa(
      usuarioIdDe(req),
      Number(req.params.id),
    );
    res.json({ ok: true, data: contactos });
  }),

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    const contacto = await ContactoRrhhService.actualizar(
      usuarioIdDe(req),
      Number(req.params.id),
      req.body,
    );
    res.json({ ok: true, data: contacto });
  }),

  eliminar: asyncHandler(async (req: Request, res: Response) => {
    await ContactoRrhhService.eliminar(usuarioIdDe(req), Number(req.params.id));
    res.status(204).send();
  }),
};