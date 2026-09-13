import { z } from "zod";

export const CategoriaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  createdAt: z.string().nullable().optional(),
});
export type Categoria = z.infer<typeof CategoriaSchema>;

export const CategoriaSinIdSchema = CategoriaSchema.omit({
  id: true,
  createdAt: true,
});
export type CategoriaSinId = z.infer<typeof CategoriaSinIdSchema>;