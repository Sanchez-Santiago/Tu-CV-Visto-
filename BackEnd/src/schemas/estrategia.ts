import { z } from 'zod';

export const itemRenovarSchema = z.object({
  postulacion_id: z
    .number()
    .int()
    .positive('postulacion_id debe ser positivo'),
  asunto: z.string().trim().max(500).optional(),
  cuerpo: z.string().trim().max(50000).optional(),
  firmas: z.array(z.number().int().positive()).optional(),
});
export type ItemRenovarInput = z.infer<typeof itemRenovarSchema>;

export const renovarSchema = z.object({
  items: z.array(itemRenovarSchema).min(1, 'Seleccioná al menos un ítem').max(50),
  firmas: z.array(z.number().int().positive()).optional(),
});
export type RenovarInput = z.infer<typeof renovarSchema>;

export const confirmarRechazoSchema = z.object({
  postulacion_id: z
    .number()
    .int()
    .positive('postulacion_id debe ser positivo'),
});
export type ConfirmarRechazoInput = z.infer<typeof confirmarRechazoSchema>;