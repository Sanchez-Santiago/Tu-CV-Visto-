import { z } from 'zod';
import { url } from '../types/common';

export const crearProyectoSchema = z.object({
  usuario_id: z.number().int().positive('usuario_id debe ser positivo'),
  nombre: z
    .string({ required_error: 'nombre es obligatorio' })
    .trim()
    .min(1)
    .max(200),
  descripcion: z.string().trim().max(2000).optional(),
  tecnologias: z.array(z.string().trim().min(1).max(100)).optional(),
  url: url.optional(),
});

export const crearProyectoMeSchema = crearProyectoSchema.omit({
  usuario_id: true,
});
export type CrearProyectoMeInput = z.infer<typeof crearProyectoMeSchema>;

export const actualizarProyectoSchema = crearProyectoMeSchema.partial();
export type ActualizarProyectoInput = z.infer<typeof actualizarProyectoSchema>;

export type CrearProyectoInput = z.infer<typeof crearProyectoSchema>;