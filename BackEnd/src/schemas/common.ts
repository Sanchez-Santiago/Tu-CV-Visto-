import { z } from 'zod';

export const idParams = z.object({
  id: z.coerce
    .number()
    .int('El id debe ser un entero')
    .positive('El id debe ser positivo'),
});
export type IdParams = z.infer<typeof idParams>;
