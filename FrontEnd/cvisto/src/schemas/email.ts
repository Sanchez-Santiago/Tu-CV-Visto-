import { z } from "zod";
import { FlagSchema, TipoEmailSchema, TipoSeguimientoSchema } from "./common";

export const EmailSchema = z.object({
  id: z.string(),
  postulacionId: z.number().int().positive().nullable(),
  gmailMessageId: z.string().max(200).nullable().optional(),
  tipo: TipoEmailSchema,
  tipoSeguimiento: TipoSeguimientoSchema.nullable().optional(),
  asunto: z.string().max(500).nullable().optional(),
  remitente: z.string().email("Email inválido"),
  destinatario: z.string().email("Email inválido"),
  fecha: z.string().min(1),
  enviado: FlagSchema.default(1),
  contenidoResumen: z.string().max(4000).nullable().optional(),
  cuerpoHtml: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
});
export type Email = z.infer<typeof EmailSchema>;
export type EmailTemplate = Email;

export const EmailSinIdSchema = EmailSchema.omit({ id: true, createdAt: true });
export type EmailSinId = z.infer<typeof EmailSinIdSchema>;