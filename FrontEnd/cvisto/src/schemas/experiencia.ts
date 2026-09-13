import { z } from "zod";

export const ExperienciaSchema = z.object({
  id: z.string(),
  usuarioId: z.number().int().positive(),
  empresa: z.string().min(1, "La empresa es requerida"),
  puesto: z.string().min(1, "El puesto es requerido"),
  fechaInicio: z.string().nullable().optional(),
  fechaFin: z.string().nullable().optional(),
  descripcion: z.string().max(2000).nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export type Experiencia = z.infer<typeof ExperienciaSchema>;

export const ExperienciaSinIdSchema = ExperienciaSchema.omit({
  id: true,
  usuarioId: true,
  createdAt: true,
  updatedAt: true,
});
export type ExperienciaSinId = z.infer<typeof ExperienciaSinIdSchema>;