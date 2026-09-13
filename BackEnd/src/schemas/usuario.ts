import { z } from 'zod';
import { email } from '../types/common';

export const crearUsuarioSchema = z.object({
  nombre: z
    .string({ required_error: 'nombre es obligatorio' })
    .trim()
    .min(1, 'nombre no puede estar vacío')
    .max(150, 'nombre no puede superar los 150 caracteres'),
  email: email,
  perfil: z.string().trim().max(500).optional(),
  pais: z.string().trim().max(100).optional(),
  provincia: z.string().trim().max(100).optional(),
  cv: z.string().trim().max(2000).optional(),
});

export const actualizarUsuarioSchema = crearUsuarioSchema.partial();

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;