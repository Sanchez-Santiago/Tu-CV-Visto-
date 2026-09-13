import { z } from 'zod';
import { MODALIDADES } from '../types/common';

export const crearEmpresaSchema = z.object({
  nombre: z
    .string({ required_error: 'nombre es obligatorio' })
    .trim()
    .min(1)
    .max(200),
  pais: z.string().trim().max(100).optional(),
  provincia: z.string().trim().max(100).optional(),
  ciudad: z.string().trim().max(100).optional(),
  modalidad: z.enum(MODALIDADES).optional(),
  cadencia_contacto: z.coerce
    .number()
    .int()
    .positive('cadencia_contacto debe ser mayor a 0')
    .nullable()
    .optional(),
  observaciones: z.string().trim().max(2000).optional(),
});

export const actualizarEmpresaSchema = crearEmpresaSchema.partial();

export type CrearEmpresaInput = z.infer<typeof crearEmpresaSchema>;
export type ActualizarEmpresaInput = z.infer<typeof actualizarEmpresaSchema>;