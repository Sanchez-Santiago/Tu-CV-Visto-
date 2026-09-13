import { Router } from 'express';
import { DocsController } from '../controllers/docs.controller';

export const docsRouter = Router();

docsRouter.get('/', DocsController.home);
docsRouter.get('/docs', DocsController.docs);