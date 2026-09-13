import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';
import {
  validate,
  validateParams,
  validateQuery,
} from '../middlewares/validation.middleware';
import { idParams } from '../schemas/common';
import {
  actualizarEmailSchema,
  crearEmailSchema,
  listarEmailsQuery,
} from '../schemas/email';

export const emailsRouter = Router();

emailsRouter.get(
  '/',
  validateQuery(listarEmailsQuery),
  EmailController.listar,
);
emailsRouter.post('/', validate(crearEmailSchema), EmailController.crear);
emailsRouter.get('/:id', validateParams(idParams), EmailController.obtenerPorId);
emailsRouter.put(
  '/:id',
  validateParams(idParams),
  validate(actualizarEmailSchema),
  EmailController.actualizar,
);
emailsRouter.delete('/:id', validateParams(idParams), EmailController.eliminar);