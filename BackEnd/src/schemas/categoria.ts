import { z } from 'zod';

export const crearCategoriaSchema = z.object({
  nombre: z
    .string({ required_error: 'nombre es obligatorio' })
    .trim()
    .min(1, 'nombre no puede estar vacío')
    .max(100, 'nombre no puede superar los 100 caracteres'),
});

export const actualizarCategoriaSchema = crearCategoriaSchema.partial();

export type CrearCategoriaInput = z.infer<typeof crearCategoriaSchema>;
export type ActualizarCategoriaInput = z.infer<
  typeof actualizarCategoriaSchema
>;