import { z } from 'zod';
import { email, flag, TIPOS_EMAIL, TIPOS_SEGUIMIENTO } from '../types/common';

export const crearEmailSchema = z.object({
  postulacion_id: z
    .number()
    .int()
    .positive('postulacion_id debe ser positivo')
    .nullable(),
  gmail_message_id: z.string().trim().max(200).optional(),
  tipo: z.enum(TIPOS_EMAIL, {
    required_error: 'tipo es obligatorio',
    invalid_type_error: 'tipo inválido',
  }),
  tipo_seguimiento: z.enum(TIPOS_SEGUIMIENTO).optional(),
  asunto: z.string().trim().max(500).optional(),
  remitente: email,
  destinatario: email,
  fecha: z.string({ required_error: 'fecha es obligatorio' }).trim().min(1),
  enviado: flag.default(1),
  contenido_resumen: z.string().trim().max(4000).optional(),
  cuerpo_html: z.string().optional(),
});

export const actualizarEmailSchema = crearEmailSchema.partial();

export const listarEmailsQuery = z.object({
  postulacion_id: z.coerce.number().int().positive().optional(),
});
export type ListarEmailsQuery = z.infer<typeof listarEmailsQuery>;

export type CrearEmailInput = z.infer<typeof crearEmailSchema>;
export type ActualizarEmailInput = z.infer<typeof actualizarEmailSchema>;