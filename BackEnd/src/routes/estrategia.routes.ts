import { Router } from 'express';
import { EstrategiaController } from '../controllers/estrategia.controller';
import { validate } from '../middlewares/validation.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  confirmarRechazoSchema,
  renovarSchema,
} from '../schemas/estrategia';

export const estrategiaRouter = Router();

// Defensa en profundidad: no depende solo del montaje en app.ts
estrategiaRouter.use(authMiddleware);

estrategiaRouter.get('/debidas', EstrategiaController.debidas);
estrategiaRouter.get('/renovaciones', EstrategiaController.renovaciones);
estrategiaRouter.post(
  '/renovar',
  validate(renovarSchema),
  EstrategiaController.renovar,
);
estrategiaRouter.get(
  '/revision-rechazos',
  EstrategiaController.revisionRechazos,
);
estrategiaRouter.post(
  '/confirmar-rechazo',
  validate(confirmarRechazoSchema),
  EstrategiaController.confirmarRechazo,
);
estrategiaRouter.get('/estadisticas', EstrategiaController.estadisticas);