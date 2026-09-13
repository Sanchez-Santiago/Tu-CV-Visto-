import { z } from 'zod';
import { fechaDia, flag, TIPOS_SEGUIMIENTO } from '../types/common';

export const crearSeguimientoSchema = z.object({
  postulacion_id: z
    .number()
    .int()
    .positive('postulacion_id debe ser positivo'),
  fecha_programada: fechaDia,
  tipo_seguimiento: z.enum(TIPOS_SEGUIMIENTO).default('consulta'),
  enviado: flag,
  requiere_aprobacion: flag.default(1),
  fecha_envio: fechaDia.nullable().optional(),
  observaciones: z.string().trim().max(2000).optional(),
});

export const actualizarSeguimientoSchema = crearSeguimientoSchema.partial();

export const listarSeguimientosQuery = z.object({
  postulacion_id: z.coerce.number().int().positive().optional(),
  enviado: z.coerce.number().int().refine((v) => v === 0 || v === 1).optional(),
});
export type ListarSeguimientosQuery = z.infer<
  typeof listarSeguimientosQuery
>;

export type CrearSeguimientoInput = z.infer<typeof crearSeguimientoSchema>;
export type ActualizarSeguimientoInput = z.infer<
  typeof actualizarSeguimientoSchema
>;