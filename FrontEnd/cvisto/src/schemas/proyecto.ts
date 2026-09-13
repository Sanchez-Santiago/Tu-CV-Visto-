import { z } from "zod";

export const ProyectoSchema = z.object({
  id: z.string(),
  usuarioId: z.number().int().positive(),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().max(2000).nullable().optional(),
  tecnologias: z.array(z.string()).nullable().optional(),
  url: z.string().url("URL inválida").nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export type Proyecto = z.infer<typeof ProyectoSchema>;

export const ProyectoSinIdSchema = ProyectoSchema.omit({
  id: true,
  usuarioId: true,
  createdAt: true,
  updatedAt: true,
});
export type ProyectoSinId = z.infer<typeof ProyectoSinIdSchema>;