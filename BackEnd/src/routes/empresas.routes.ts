import { Router } from 'express';
import { EmpresaController } from '../controllers/empresa.controller';
import { validate, validateParams } from '../middlewares/validation.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { idParams } from '../schemas/common';
import {
  actualizarEmpresaSchema,
  crearEmpresaSchema,
} from '../schemas/empresa';

export const empresasRouter = Router();

// Defensa en profundidad: no depende solo del montaje en app.ts
empresasRouter.use(authMiddleware);

empresasRouter.get('/', EmpresaController.listar);
empresasRouter.post('/', validate(crearEmpresaSchema), EmpresaController.crear);
empresasRouter.get(
  '/:id',
  validateParams(idParams),
  EmpresaController.obtenerPorId,
);
empresasRouter.get(
  '/:id/contactos',
  validateParams(idParams),
  EmpresaController.obtenerContactos,
);
empresasRouter.put(
  '/:id',
  validateParams(idParams),
  validate(actualizarEmpresaSchema),
  EmpresaController.actualizar,
);
empresasRouter.delete(
  '/:id',
  validateParams(idParams),
  EmpresaController.eliminar,
);