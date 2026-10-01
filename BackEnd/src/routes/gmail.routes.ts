import { Router } from 'express';
import { GmailController } from '../controllers/gmail.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
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

// Defensa en profundidad: no depende solo del montaje en app.ts
gmailRouter.use(authMiddleware);

gmailRouter.post('/enviar', validate(enviarGmailSchema), GmailController.enviar);
gmailRouter.get('/sincronizar', GmailController.sincronizar);
gmailRouter.post('/analizar', GmailController.analizar);
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
