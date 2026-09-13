import { z } from "zod";

export const TiposFirma = ["texto", "imagen"] as const;
export type TipoFirma = (typeof TiposFirma)[number];

export const FirmaSchema = z.object({
  id: z.string(),
  usuarioId: z.number().int().positive(),
  nombre: z.string().min(1, "El nombre es requerido"),
  tipo: z.enum(TiposFirma),
  contenido: z.string().max(5000).nullable().optional(),
  imagenMime: z.string().nullable().optional(),
  imagenBase64: z.string().nullable().optional(),
  enlace: z.string().url("URL inválida").nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export type Firma = z.infer<typeof FirmaSchema>;

export const FirmaSinIdSchema = FirmaSchema.omit({
  id: true,
  usuarioId: true,
  createdAt: true,
  updatedAt: true,
});
export type FirmaSinId = z.infer<typeof FirmaSinIdSchema>;