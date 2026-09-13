import { z } from 'zod';

export const asignarCategoriaSchema = z.object({
  categoria_id: z.number().int().positive('categoria_id debe ser positivo'),
});
export type AsignarCategoriaInput = z.infer<
  typeof asignarCategoriaSchema
>;

export const usuarioIdParams = z.object({
  usuarioId: z.coerce
    .number()
    .int()
    .positive('usuarioId debe ser positivo'),
});
export type UsuarioIdParams = z.infer<typeof usuarioIdParams>;

export const usuarioCategoriaParams = z.object({
  usuarioId: z.coerce
    .number()
    .int()
    .positive('usuarioId debe ser positivo'),
  categoriaId: z.coerce
    .number()
    .int()
    .positive('categoriaId debe ser positivo'),
});
export type UsuarioCategoriaParams = z.infer<
  typeof usuarioCategoriaParams
>;