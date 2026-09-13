import { z } from 'zod';
import { fechaMes } from '../types/common';

export const crearExperienciaSchema = z.object({
  usuario_id: z
    .number()
    .int()
    .positive('usuario_id debe ser positivo'),
  empresa: z
    .string({ required_error: 'empresa es obligatorio' })
    .trim()
    .min(1)
    .max(200),
  puesto: z
    .string({ required_error: 'puesto es obligatorio' })
    .trim()
    .min(1)
    .max(200),
  fecha_inicio: fechaMes.optional(),
  fecha_fin: fechaMes.nullable().optional(),
  descripcion: z.string().trim().max(2000).optional(),
});

export const crearExperienciaMeSchema = crearExperienciaSchema.omit({
  usuario_id: true,
});
export type CrearExperienciaMeInput = z.infer<typeof crearExperienciaMeSchema>;

export const actualizarExperienciaSchema = crearExperienciaMeSchema.partial();
export type ActualizarExperienciaInput = z.infer<
  typeof actualizarExperienciaSchema
>;

export type CrearExperienciaInput = z.infer<typeof crearExperienciaSchema>;