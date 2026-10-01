import { Router } from 'express';
import { ContactoRrhhController } from '../controllers/contacto-rrhh.controller';
import {
  validate,
  validateParams,
  validateQuery,
} from '../middlewares/validation.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { idParams } from '../schemas/common';
import {
  actualizarContactoRrhhSchema,
  crearContactoRrhhSchema,
  listarContactosRrhhQuery,
} from '../schemas/contacto-rrhh';

export const contactosRrhhRouter = Router();

// Defensa en profundidad: no depende solo del montaje en app.ts
contactosRrhhRouter.use(authMiddleware);

contactosRrhhRouter.get(
  '/',
  validateQuery(listarContactosRrhhQuery),
  ContactoRrhhController.listar,
);
contactosRrhhRouter.post(
  '/',
  validate(crearContactoRrhhSchema),
  ContactoRrhhController.crear,
);
contactosRrhhRouter.get(
  '/:id',
  validateParams(idParams),
  ContactoRrhhController.obtenerPorId,
);
contactosRrhhRouter.put(
  '/:id',
  validateParams(idParams),
  validate(actualizarContactoRrhhSchema),
  ContactoRrhhController.actualizar,
);
contactosRrhhRouter.delete(
  '/:id',
  validateParams(idParams),
  ContactoRrhhController.eliminar,
);