import { Router } from 'express';
import { FirmaController } from '../controllers/firma.controller';
import {
  validate,
  validateParams,
} from '../middlewares/validation.middleware';
import { idParams } from '../schemas/common';
import {
  actualizarFirmaSchema,
  crearFirmaMeSchema,
} from '../schemas/firma';

export const firmasRouter = Router();

firmasRouter.get('/', FirmaController.listar);
firmasRouter.post(
  '/',
  validate(crearFirmaMeSchema),
  FirmaController.crear,
);
firmasRouter.put(
  '/:id',
  validateParams(idParams),
  validate(actualizarFirmaSchema),
  FirmaController.actualizar,
);
firmasRouter.delete(
  '/:id',
  validateParams(idParams),
  FirmaController.eliminar,
);