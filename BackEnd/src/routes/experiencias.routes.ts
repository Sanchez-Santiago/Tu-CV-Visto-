import { Router } from 'express';
import { ExperienciaController } from '../controllers/experiencia.controller';
import {
  validate,
  validateParams,
} from '../middlewares/validation.middleware';
import { idParams } from '../schemas/common';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  actualizarExperienciaSchema,
  crearExperienciaMeSchema,
} from '../schemas/experiencia';

export const experienciasRouter = Router();

// Defensa en profundidad: no depende solo del montaje en app.ts
experienciasRouter.use(authMiddleware);

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