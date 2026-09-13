import { Router } from 'express';
import { ProyectoController } from '../controllers/proyecto.controller';
import {
  validate,
  validateParams,
} from '../middlewares/validation.middleware';
import { idParams } from '../schemas/common';
import {
  actualizarProyectoSchema,
  crearProyectoMeSchema,
} from '../schemas/proyecto';

export const proyectosRouter = Router();

proyectosRouter.get('/', ProyectoController.listar);
proyectosRouter.post(
  '/',
  validate(crearProyectoMeSchema),
  ProyectoController.crear,
);
proyectosRouter.put(
  '/:id',
  validateParams(idParams),
  validate(actualizarProyectoSchema),
  ProyectoController.actualizar,
);
proyectosRouter.delete(
  '/:id',
  validateParams(idParams),
  ProyectoController.eliminar,
);