import type { Request, Response } from 'express';
import { EmailService } from '../services/email.service';
import { GmailService } from '../services/gmail.service';
import { SincronizacionService } from '../services/sincronizacion.service';
import { AnalisisIAService } from '../services/analisis-ia.service';
import { asyncHandler } from '../utils/async-handler';
import {
  listarMensajesGmailQuery,
  sincronizarGmailQuery,
} from '../schemas/gmail';

export const GmailController = {
  enviar: asyncHandler(async (req: Request, res: Response) => {
    const email = await EmailService.enviarYRegistrar(
      req.usuarioId!,
      req.body,
    );
    res.status(201).json({ ok: true, data: email });
  }),

  mensajes: asyncHandler(async (req: Request, res: Response) => {
    const { data: q } = listarMensajesGmailQuery.safeParse(req.query);
    const mensajes = await GmailService.listarMensajes(
      req.usuarioId!,
      q?.max_results,
      q?.q,
    );
    res.json({ ok: true, data: mensajes });
  }),

  mensaje: asyncHandler(async (req: Request, res: Response) => {
    const mensaje = await GmailService.obtenerMensaje(
      req.usuarioId!,
      req.params.id!,
    );
    res.json({ ok: true, data: mensaje });
  }),

  sincronizar: asyncHandler(async (req: Request, res: Response) => {
    const { data: q } = sincronizarGmailQuery.safeParse(req.query);
    const data = await SincronizacionService.sincronizar(
      req.usuarioId!,
      q?.dias,
    );
    res.json({ ok: true, data });
  }),

  analizar: asyncHandler(async (req: Request, res: Response) => {
    const data = await AnalisisIAService.analizarEmailsPendientes(
      req.usuarioId!,
    );
    res.json({ ok: true, data });
  }),
};