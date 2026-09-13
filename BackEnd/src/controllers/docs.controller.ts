import type { Request, Response } from 'express';
import { renderDocsPage, renderHomePage } from '../utils/docs';

export const DocsController = {
  home: (_req: Request, res: Response): void => {
    res.type('html').send(renderHomePage());
  },

  docs: (_req: Request, res: Response): void => {
    res.type('html').send(renderDocsPage());
  },
};