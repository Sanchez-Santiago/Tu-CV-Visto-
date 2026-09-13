import { z } from "zod";
import {
  EstadoPostulacionSchema,
  FlagSchema,
  InteresSchema,
  ModalidadSchema,
} from "./common";

export const PostulacionSchema = z.object({
  id: z.string(),
  usuarioId: z.number(),
  empresaId: z.number().int().positive("La empresa es requerida"),
  puesto: z.string().min(2, "El puesto es requerido"),
  modalidad: ModalidadSchema.nullable().optional(),
  respondio: FlagSchema.default(0),
  estado: EstadoPostulacionSchema.default("pendiente"),
  interes: InteresSchema.default("medio"),
  fuente: z.string().max(100).nullable().optional(),
  cantidadMailsEnviados: z.number().int().nonnegative().default(0),
  fechaPostulacion: z.string().nullable().optional(),
  ultimoContacto: z.string().nullable().optional(),
  proximoContacto: z.string().nullable().optional(),
  observaciones: z.string().max(2000).nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export type Postulacion = z.infer<typeof PostulacionSchema>;

export const PostulacionSinIdSchema = PostulacionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type PostulacionSinId = z.infer<typeof PostulacionSinIdSchema>;