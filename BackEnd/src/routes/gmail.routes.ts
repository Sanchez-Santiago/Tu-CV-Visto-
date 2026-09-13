import { Router } from 'express';
import { GmailController } from '../controllers/gmail.controller';
import {
  validate,
  validateParams,
  validateQuery,
} from '../middlewares/validation.middleware';
import {
  enviarGmailSchema,
  listarMensajesGmailQuery,
  mensajeGmailParams,
} from '../schemas/gmail';

export const gmailRouter = Router();

gmailRouter.post('/enviar', validate(enviarGmailSchema), GmailController.enviar);
gmailRouter.get('/sincronizar', GmailController.sincronizar);
gmailRouter.get(
  '/mensajes',
  validateQuery(listarMensajesGmailQuery),
  GmailController.mensajes,
);
gmailRouter.get(
  '/mensajes/:id',
  validateParams(mensajeGmailParams),
  GmailController.mensaje,
);
