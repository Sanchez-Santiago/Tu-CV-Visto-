import type { Request, Response } from 'express';
import { AuthService, destinoPostLogin } from '../services/auth.service';
import { UsuarioModel } from '../models/usuario.model';
import { asyncHandler } from '../utils/async-handler';
import { renderizarPantallaBeta } from '../utils/beta-screen';
import { cerrarSesion, unificarSesion } from '../utils/cookies';
import { AppError } from '../utils/errors';
import { esPantallaBetaActiva } from '../config/env';

export const AuthController = {
  login: asyncHandler(async (_req: Request, res: Response) => {
    const url = AuthService.generarUrlLogin();
    res.redirect(url);
  }),

  callback: asyncHandler(async (req: Request, res: Response) => {
    const code = req.query.code;
    if (typeof code !== 'string' || !code) {
      throw new AppError(400, 'Falta el parámetro "code" de Google');
    }

    const { usuario, token } = await AuthService.callback(code);
    unificarSesion(res, token);

    if (esPantallaBetaActiva()) {
      res
        .type('html')
        .send(
          renderizarPantallaBeta({
            nombre: usuario.nombre,
            email: usuario.email,
          }),
        );
      return;
    }

    const redirect =
      typeof req.query.redirect === 'string' ? req.query.redirect : undefined;
    res.redirect(destinoPostLogin(redirect));
  }),

  screenBeta: asyncHandler(async (req: Request, res: Response) => {
    const usuario = await UsuarioModel.obtenerPorId(req.usuarioId!);
    if (!usuario) {
      throw new AppError(404, 'Usuario no encontrado');
    }
    res
      .status(200)
      .type('html')
      .send(
        renderizarPantallaBeta({
          nombre: usuario.nombre,
          email: usuario.email,
        }),
      );
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const usuario = await UsuarioModel.obtenerPorId(req.usuarioId!);
    if (!usuario) {
      throw new AppError(404, 'Usuario no encontrado');
    }
    res.json({ ok: true, data: usuario });
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    cerrarSesion(res);
    res.status(204).send();
  }),
};