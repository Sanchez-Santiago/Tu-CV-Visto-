import { z } from "zod";

export const UsuarioSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  email: z.string().email(),
  perfil: z.string().max(500).nullable().optional(),
  pais: z.string().max(100).nullable().optional(),
  provincia: z.string().max(100).nullable().optional(),
  cv: z.string().max(2000).nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export type Usuario = z.infer<typeof UsuarioSchema>;

export const UsuarioSinIdSchema = UsuarioSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type UsuarioSinId = z.infer<typeof UsuarioSinIdSchema>;