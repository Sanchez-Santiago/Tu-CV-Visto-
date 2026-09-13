import { z } from 'zod';

export const asignarContactoSchema = z.object({
  contacto_rrhh_id: z
    .number()
    .int()
    .positive('contacto_rrhh_id debe ser positivo'),
});
export type AsignarContactoInput = z.infer<typeof asignarContactoSchema>;

export const postulacionIdParams = z.object({
  postulacionId: z.coerce
    .number()
    .int()
    .positive('postulacionId debe ser positivo'),
});
export type PostulacionIdParams = z.infer<typeof postulacionIdParams>;

export const postulacionContactoParams = z.object({
  postulacionId: z.coerce
    .number()
    .int()
    .positive('postulacionId debe ser positivo'),
  contactoId: z.coerce
    .number()
    .int()
    .positive('contactoId debe ser positivo'),
});
export type PostulacionContactoParams = z.infer<
  typeof postulacionContactoParams
>;