import { Router } from 'express';
import { SeguimientoController } from '../controllers/seguimiento.controller';
import {
  validate,
  validateParams,
  validateQuery,
} from '../middlewares/validation.middleware';
import { idParams } from '../schemas/common';
import {
  actualizarSeguimientoSchema,
  crearSeguimientoSchema,
  listarSeguimientosQuery,
} from '../schemas/seguimiento';

export const seguimientosRouter = Router();

seguimientosRouter.get(
  '/',
  validateQuery(listarSeguimientosQuery),
  SeguimientoController.listar,
);
seguimientosRouter.get('/pendientes', SeguimientoController.pendientes);
seguimientosRouter.post(
  '/',
  validate(crearSeguimientoSchema),
  SeguimientoController.crear,
);
seguimientosRouter.get(
  '/:id',
  validateParams(idParams),
  SeguimientoController.obtenerPorId,
);
seguimientosRouter.put(
  '/:id',
  validateParams(idParams),
  validate(actualizarSeguimientoSchema),
  SeguimientoController.actualizar,
);
seguimientosRouter.delete(
  '/:id',
  validateParams(idParams),
  SeguimientoController.eliminar,
);