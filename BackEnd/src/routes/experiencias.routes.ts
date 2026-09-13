import { Router } from 'express';
import { ExperienciaController } from '../controllers/experiencia.controller';
import {
  validate,
  validateParams,
} from '../middlewares/validation.middleware';
import { idParams } from '../schemas/common';
import {
  actualizarExperienciaSchema,
  crearExperienciaMeSchema,
} from '../schemas/experiencia';

export const experienciasRouter = Router();

experienciasRouter.get('/', ExperienciaController.listar);
experienciasRouter.post(
  '/',
  validate(crearExperienciaMeSchema),
  ExperienciaController.crear,
);
experienciasRouter.put(
  '/:id',
  validateParams(idParams),
  validate(actualizarExperienciaSchema),
  ExperienciaController.actualizar,
);
experienciasRouter.delete(
  '/:id',
  validateParams(idParams),
  ExperienciaController.eliminar,
);