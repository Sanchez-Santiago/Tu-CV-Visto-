import { Router } from 'express';
import { PostulacionContactoController } from '../controllers/postulacion-contacto.controller';
import { PostulacionController } from '../controllers/postulacion.controller';
import {
  validate,
  validateParams,
  validateQuery,
} from '../middlewares/validation.middleware';
import { idParams } from '../schemas/common';
import {
  asignarContactoSchema,
  postulacionContactoParams,
  postulacionIdParams,
} from '../schemas/postulacion-contacto';
import {
  actualizarPostulacionSchema,
  crearPostulacionSchema,
  listarPostulacionesQuery,
} from '../schemas/postulacion';

export const postulacionesRouter = Router();

postulacionesRouter.get(
  '/',
  validateQuery(listarPostulacionesQuery),
  PostulacionController.listar,
);
postulacionesRouter.post(
  '/',
  validate(crearPostulacionSchema),
  PostulacionController.crear,
);
postulacionesRouter.get(
  '/:id',
  validateParams(idParams),
  PostulacionController.obtenerPorId,
);
postulacionesRouter.put(
  '/:id',
  validateParams(idParams),
  validate(actualizarPostulacionSchema),
  PostulacionController.actualizar,
);
postulacionesRouter.delete(
  '/:id',
  validateParams(idParams),
  PostulacionController.eliminar,
);

postulacionesRouter.get(
  '/:id/relacion',
  validateParams(idParams),
  PostulacionController.relacion,
);

postulacionesRouter.get(
  '/:postulacionId/contactos',
  validateParams(postulacionIdParams),
  PostulacionContactoController.listar,
);
postulacionesRouter.post(
  '/:postulacionId/contactos',
  validateParams(postulacionIdParams),
  validate(asignarContactoSchema),
  PostulacionContactoController.asignar,
);
postulacionesRouter.delete(
  '/:postulacionId/contactos/:contactoId',
  validateParams(postulacionContactoParams),
  PostulacionContactoController.quitar,
);