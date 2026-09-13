import { z } from 'zod';
import { email } from '../types/common';

export const crearContactoRrhhSchema = z.object({
  empresa_id: z.number().int().positive('empresa_id debe ser positivo'),
  nombre: z
    .string({ required_error: 'nombre es obligatorio' })
    .trim()
    .min(1)
    .max(200),
  email: email,
  cargo: z.string().trim().max(200).optional(),
  observaciones: z.string().trim().max(2000).optional(),
});

export const actualizarContactoRrhhSchema = crearContactoRrhhSchema.partial();

export const listarContactosRrhhQuery = z.object({
  empresa_id: z.coerce.number().int().positive().optional(),
  email: email.optional(),
});
export type ListarContactosRrhhQuery = z.infer<
  typeof listarContactosRrhhQuery
>;

export type CrearContactoRrhhInput = z.infer<typeof crearContactoRrhhSchema>;
export type ActualizarContactoRrhhInput = z.infer<
  typeof actualizarContactoRrhhSchema
>;