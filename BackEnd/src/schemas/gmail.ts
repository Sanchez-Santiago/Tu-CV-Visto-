import { z } from 'zod';
import {
  email,
  fechaDia,
  TIPOS_EMAIL,
  TIPOS_SEGUIMIENTO,
} from '../types/common';

export const enviarGmailSchema = z.object({
  postulacion_id: z
    .number()
    .int()
    .positive('postulacion_id debe ser positivo')
    .nullable()
    .optional(),
  destinatario: email,
  asunto: z
    .string()
    .trim()
    .min(1, 'asunto demasiado corto')
    .max(500, 'asunto demasiado largo')
    .optional(),
  cuerpo: z
    .string()
    .trim()
    .min(1, 'cuerpo demasiado corto')
    .max(50000, 'cuerpo demasiado largo')
    .optional(),
  tipo: z
    .enum(TIPOS_EMAIL, { invalid_type_error: 'tipo inválido' })
    .default('seguimiento'),
  tipo_seguimiento: z
    .enum(TIPOS_SEGUIMIENTO, { invalid_type_error: 'tipo_seguimiento inválido' })
    .optional(),
  crear_seguimiento: z.boolean().optional(),
  fecha_programada: fechaDia.optional(),
  cc: email.optional(),
  adjuntos: z
    .array(
      z.object({
        nombre: z.string().trim().min(1).max(255),
        mime_type: z.string().trim().min(1).max(100),
        contenido_base64: z.string().trim().min(1),
      }),
    )
    .max(20, 'máximo 20 adjuntos por correo')
    .optional(),
});
export type EnviarGmailInput = z.infer<typeof enviarGmailSchema>;

export const listarMensajesGmailQuery = z.object({
  max_results: z.coerce.number().int().min(1).max(50).default(10),
  q: z.string().trim().max(500).optional(),
});
export type ListarMensajesGmailQuery = z.infer<
  typeof listarMensajesGmailQuery
>;

export const mensajeGmailParams = z.object({
  id: z.string().trim().min(1).max(200),
});
export type MensajeGmailParams = z.infer<typeof mensajeGmailParams>;

export const sincronizarGmailQuery = z.object({
  dias: z.coerce.number().int().min(1).max(90).default(14),
});
export type SincronizarGmailQuery = z.infer<typeof sincronizarGmailQuery>;