import { z } from "zod";

export const ContactoSchema = z.object({
  id: z.string(),
  empresaId: z.number().int().positive("La empresa es requerida"),
  nombre: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  cargo: z.string().max(200).nullable().optional(),
  observaciones: z.string().max(2000).nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export type Contacto = z.infer<typeof ContactoSchema>;

export const ContactoSinIdSchema = ContactoSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type ContactoSinId = z.infer<typeof ContactoSinIdSchema>;