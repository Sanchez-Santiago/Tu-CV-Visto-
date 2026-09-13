import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const authRouter = Router();

authRouter.get('/google/login', AuthController.login);
authRouter.get('/google/callback', AuthController.callback);

authRouter.get('/callback', authMiddleware, AuthController.screenBeta);
authRouter.get('/me', authMiddleware, AuthController.me);
authRouter.post('/logout', AuthController.logout);