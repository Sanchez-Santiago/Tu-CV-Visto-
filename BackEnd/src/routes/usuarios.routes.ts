import { Router } from 'express';
import { UsuarioCategoriaController } from '../controllers/usuario-categoria.controller';
import { UsuarioController } from '../controllers/usuario.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  validate,
  validateParams,
} from '../middlewares/validation.middleware';
import { actualizarUsuarioSchema } from '../schemas/usuario';
import {
  asignarCategoriaSchema,
  usuarioCategoriaParams,
  usuarioIdParams,
} from '../schemas/usuario-categoria';

export const usuariosRouter = Router();

usuariosRouter.put(
  '/me',
  authMiddleware,
  validate(actualizarUsuarioSchema),
  UsuarioController.actualizarMe,
);

usuariosRouter.get(
  '/:usuarioId/categorias',
  validateParams(usuarioIdParams),
  UsuarioCategoriaController.listar,
);
usuariosRouter.post(
  '/:usuarioId/categorias',
  validateParams(usuarioIdParams),
  validate(asignarCategoriaSchema),
  UsuarioCategoriaController.asignar,
);
usuariosRouter.delete(
  '/:usuarioId/categorias/:categoriaId',
  validateParams(usuarioCategoriaParams),
  UsuarioCategoriaController.quitar,
);