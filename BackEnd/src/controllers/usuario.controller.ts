import type { Request, Response } from 'express';
import { UsuarioService } from '../services/usuario.service';
import { asyncHandler } from '../utils/async-handler';

export const UsuarioController = {
  actualizarMe: asyncHandler(async (req: Request, res: Response) => {
    const usuario = await UsuarioService.actualizar(req.usuarioId!, req.body);
    res.json({ ok: true, data: usuario });
  }),
};