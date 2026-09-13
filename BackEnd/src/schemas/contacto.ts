import { z } from 'zod';
import { email, TIPOS_CONTACTO } from '../types/common';

export const crearContactoSchema = z.object({
  usuario_id: z.number().int().positive('usuario_id debe ser positivo'),
  tipo: z.enum(TIPOS_CONTACTO, {
    required_error: 'tipo es obligatorio',
    invalid_type_error: 'tipo inválido',
  }),
  nombre: z.string().trim().min(1).max(200).optional(),
  email: email.optional(),
  telefono: z.string().trim().max(100).optional(),
  observaciones: z.string().trim().max(2000).optional(),
});

export const actualizarContactoSchema = crearContactoSchema.partial();

export type CrearContactoInput = z.infer<typeof crearContactoSchema>;
export type ActualizarContactoInput = z.infer<typeof actualizarContactoSchema>;