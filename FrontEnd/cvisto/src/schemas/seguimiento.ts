import { z } from "zod";
import { FlagSchema, TipoSeguimientoSchema } from "./common";

export const SeguimientoSchema = z.object({
  id: z.string(),
  postulacionId: z.number().int().positive(),
  fechaProgramada: z.string(),
  tipoSeguimiento: TipoSeguimientoSchema.default("consulta"),
  enviado: FlagSchema.default(0),
  requiereAprobacion: FlagSchema.default(1),
  fechaEnvio: z.string().nullable().optional(),
  observaciones: z.string().max(2000).nullable().optional(),
  createdAt: z.string().nullable().optional(),
});
export type Seguimiento = z.infer<typeof SeguimientoSchema>;

export const SeguimientoSinIdSchema = SeguimientoSchema.omit({
  id: true,
  createdAt: true,
});
export type SeguimientoSinId = z.infer<typeof SeguimientoSinIdSchema>;