import { Router } from 'express';
import { CategoriaController } from '../controllers/categoria.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate, validateParams } from '../middlewares/validation.middleware';
import { idParams } from '../schemas/common';
import {
  actualizarCategoriaSchema,
  crearCategoriaSchema,
} from '../schemas/categoria';

export const categoriasRouter = Router();

categoriasRouter.use(authMiddleware);

categoriasRouter.get('/', CategoriaController.listar);
categoriasRouter.post(
  '/',
  validate(crearCategoriaSchema),
  CategoriaController.crear,
);
categoriasRouter.get(
  '/:id',
  validateParams(idParams),
  CategoriaController.obtenerPorId,
);
categoriasRouter.put(
  '/:id',
  validateParams(idParams),
  validate(actualizarCategoriaSchema),
  CategoriaController.actualizar,
);
categoriasRouter.delete(
  '/:id',
  validateParams(idParams),
  CategoriaController.eliminar,
);