import type { Request, Response } from 'express';
import { ContactoRrhhService } from '../services/contacto-rrhh.service';
import { EmpresaService } from '../services/empresa.service';
import { MODALIDADES } from '../types/common';
import { asyncHandler } from '../utils/async-handler';
import { ValidationError } from '../utils/errors';
import { usuarioIdDe } from '../utils/scope';

export const EmpresaController = {
  crear: asyncHandler(async (req: Request, res: Response) => {
    const empresa = await EmpresaService.crear(usuarioIdDe(req), req.body);
    res.status(201).json({ ok: true, data: empresa });
  }),

  listar: asyncHandler(async (req: Request, res: Response) => {
    const { modalidad } = req.query;
    if (
      modalidad !== undefined &&
      !MODALIDADES.includes(modalidad as (typeof MODALIDADES)[number])
    ) {
      throw new ValidationError('modalidad inválida');
    }
    const empresas = await EmpresaService.listar(
      usuarioIdDe(req),
      typeof modalidad === 'string' ? modalidad : undefined,
    );
    res.json({ ok: true, data: empresas });
  }),

  obtenerPorId: asyncHandler(async (req: Request, res: Response) => {
    const empresa = await EmpresaService.obtenerPorId(
      usuarioIdDe(req),
      Number(req.params.id),
    );
    res.json({ ok: true, data: empresa });
  }),

  obtenerContactos: asyncHandler(async (req: Request, res: Response) => {
    const contactos = await ContactoRrhhService.listarPorEmpresa(
      usuarioIdDe(req),
      Number(req.params.id),
    );
    res.json({ ok: true, data: contactos });
  }),

  actualizar: asyncHandler(async (req: Request, res: Response) => {
    const empresa = await EmpresaService.actualizar(
      usuarioIdDe(req),
      Number(req.params.id),
      req.body,
    );
    res.json({ ok: true, data: empresa });
  }),

  eliminar: asyncHandler(async (req: Request, res: Response) => {
    await EmpresaService.eliminar(usuarioIdDe(req), Number(req.params.id));
    res.status(204).send();
  }),
};