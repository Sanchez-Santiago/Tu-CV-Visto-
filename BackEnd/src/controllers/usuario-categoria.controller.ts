import type { Request, Response } from 'express';
import { UsuarioCategoriaService } from '../services/usuario-categoria.service';
import { asyncHandler } from '../utils/async-handler';
import { usuarioIdDePath } from '../utils/scope';

// El usuario sale de la sesión, no del path: antes `/:usuarioId/categorias`
// permitía leer/agregar/borrar las categorías de cualquier otro usuario.
export const UsuarioCategoriaController = {
  asignar: asyncHandler(async (req: Request, res: Response) => {
    const categoria = await UsuarioCategoriaService.asignar(
      usuarioIdDePath(req),
      req.body.categoria_id,
    );
    res.status(201).json({ ok: true, data: categoria });
  }),

  listar: asyncHandler(async (req: Request, res: Response) => {
    const categorias = await UsuarioCategoriaService.listarCategoriasDeUsuario(
      usuarioIdDePath(req),
    );
    res.json({ ok: true, data: categorias });
  }),

  quitar: asyncHandler(async (req: Request, res: Response) => {
    await UsuarioCategoriaService.quitar(
      usuarioIdDePath(req),
      Number(req.params.categoriaId),
    );
    res.status(204).send();
  }),
};
