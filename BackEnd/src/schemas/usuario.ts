import { z } from 'zod';
import { email, url } from '../types/common';

export const crearUsuarioSchema = z.object({
  nombre: z
    .string({ required_error: 'nombre es obligatorio' })
    .trim()
    .min(1, 'nombre no puede estar vacío')
    .max(150, 'nombre no puede superar los 150 caracteres'),
  email: email,
  perfil: z.string().trim().max(500).nullish(),
  pais: z.string().trim().max(100).nullish(),
  provincia: z.string().trim().max(100).nullish(),
  cv: z.string().trim().max(2000).nullish(),
  telefono: z.string().trim().max(60).nullish(),
  linkedin: url.nullish(),
  sitio_web: url.nullish(),
});

export const actualizarUsuarioSchema = crearUsuarioSchema.partial();

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;