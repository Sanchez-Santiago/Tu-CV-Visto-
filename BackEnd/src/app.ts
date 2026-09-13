import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { checkConnection } from './config/database';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { loggerMiddleware } from './middlewares/logger.middleware';
import { authMiddleware } from './middlewares/auth.middleware';
import { authRouter } from './routes/auth.routes';
import { categoriasRouter } from './routes/categorias.routes';
import { contactosRrhhRouter } from './routes/contactos-rrhh.routes';
import { docsRouter } from './routes/docs.routes';
import { emailsRouter } from './routes/emails.routes';
import { empresasRouter } from './routes/empresas.routes';
import { estrategiaRouter } from './routes/estrategia.routes';
import { experienciasRouter } from './routes/experiencias.routes';
import { firmasRouter } from './routes/firmas.routes';
import { gmailRouter } from './routes/gmail.routes';
import { postulacionesRouter } from './routes/postulaciones.routes';
import { proyectosRouter } from './routes/proyectos.routes';
import { seguimientosRouter } from './routes/seguimientos.routes';
import { usuariosRouter } from './routes/usuarios.routes';
import { asyncHandler } from './utils/async-handler';
import { env } from './config/env';

export const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL || true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '25mb' }));
app.use(cookieParser());
app.use(loggerMiddleware);

app.get('/health', asyncHandler(async (_req, res) => {
  const dbOk = await checkConnection();
  res.status(dbOk ? 200 : 503).json({ ok: dbOk, servicio: 'cvisto-backend' });
}));

app.use('/', docsRouter);

app.use('/api/categorias', categoriasRouter);
app.use('/api/empresas', empresasRouter);
app.use('/api/contactos-rrhh', contactosRrhhRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/postulaciones', postulacionesRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/seguimientos', seguimientosRouter);
app.use('/api/experiencias', authMiddleware, experienciasRouter);
app.use('/api/proyectos', authMiddleware, proyectosRouter);
app.use('/api/firmas', authMiddleware, firmasRouter);
app.use('/api/estrategia', authMiddleware, estrategiaRouter);
app.use('/api/gmail', authMiddleware, gmailRouter);
app.use('/auth', authRouter);

app.use(notFoundHandler);
app.use(errorHandler);