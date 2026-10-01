import { z } from 'zod';
import { fechaDia, flag, INTERESES, MODALIDADES } from '../types/common';
import { ESTADOS_POSTULACION } from '../types/common';

export const crearPostulacionSchema = z.object({
  // usuario_id NO se acepta desde el cliente: el backend lo toma de la
  // sesión. Antes venía en el body y permitía crear o robar postulaciones
  // de otro usuario.
  empresa_id: z.number().int().positive('empresa_id debe ser positivo'),
  puesto: z
    .string({ required_error: 'puesto es obligatorio' })
    .trim()
    .min(1)
    .max(200),
  modalidad: z.enum(MODALIDADES).optional(),
  respondio: flag,
  estado: z.enum(ESTADOS_POSTULACION).default('pendiente'),
  interes: z.enum(INTERESES).default('medio'),
  fuente: z.string().trim().max(100).optional(),
  cantidad_mails_enviados: z
    .number()
    .int()
    .nonnegative()
    .default(0),
  fecha_postulacion: fechaDia.optional(),
  ultimo_contacto: fechaDia.nullable().optional(),
  proxima_contacto: fechaDia.nullable().optional(),
  observaciones: z.string().trim().max(2000).optional(),
});

export const actualizarPostulacionSchema = crearPostulacionSchema.partial();

export const listarPostulacionesQuery = z.object({
  estado: z.enum(ESTADOS_POSTULACION).optional(),
  interes: z.enum(INTERESES).optional(),
  modalidad: z.enum(MODALIDADES).optional(),
  empresa_id: z.coerce.number().int().positive().optional(),
});
export type ListarPostulacionesQuery = z.infer<
  typeof listarPostulacionesQuery
>;

export type CrearPostulacionInput = z.infer<typeof crearPostulacionSchema>;
export type ActualizarPostulacionInput = z.infer<
  typeof actualizarPostulacionSchema
>;