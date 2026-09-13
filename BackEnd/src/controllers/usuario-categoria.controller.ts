import type { Request, Response } from 'express';
import { UsuarioCategoriaService } from '../services/usuario-categoria.service';
import { asyncHandler } from '../utils/async-handler';

export const UsuarioCategoriaController = {
  asignar: asyncHandler(async (req: Request, res: Response) => {
    const categoria = await UsuarioCategoriaService.asignar(
      Number(req.params.usuarioId),
      req.body.categoria_id,
    );
    res.status(201).json({ ok: true, data: categoria });
  }),

  listar: asyncHandler(async (req: Request, res: Response) => {
    const categorias = await UsuarioCategoriaService.listarCategoriasDeUsuario(
      Number(req.params.usuarioId),
    );
    res.json({ ok: true, data: categorias });
  }),

  quitar: asyncHandler(async (req: Request, res: Response) => {
    await UsuarioCategoriaService.quitar(
      Number(req.params.usuarioId),
      Number(req.params.categoriaId),
    );
    res.status(204).send();
  }),
};