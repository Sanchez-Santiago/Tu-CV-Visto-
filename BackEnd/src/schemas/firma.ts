import { z } from 'zod';

export const TIPOS_FIRMA = ['texto', 'imagen'] as const;

const enlaceUrl = z
  .string({ invalid_type_error: 'enlace debe ser texto' })
  .trim()
  .url('enlace debe ser una URL válida')
  .max(500)
  .nullable()
  .optional();

const crearFirmaBaseSchema = z.object({
  nombre: z
    .string({ required_error: 'nombre es obligatorio' })
    .trim()
    .min(1, 'nombre no puede estar vacío')
    .max(120, 'nombre demasiado largo'),
  tipo: z.enum(TIPOS_FIRMA, {
    required_error: 'tipo es obligatorio',
    invalid_type_error: 'tipo inválido',
  }),
  contenido: z.string().trim().max(5000).nullable().optional(),
  imagen_mime: z.string().trim().max(100).nullable().optional(),
  imagen_base64: z
    .string()
    .trim()
    .max(4_000_000, 'imagen demasiado grande')
    .nullable()
    .optional(),
  enlace: enlaceUrl,
});

export const crearFirmaMeSchema = crearFirmaBaseSchema.superRefine((val, ctx) => {
  if (val.tipo === 'texto' && !val.contenido) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contenido'],
      message: 'contenido es requerido para firmas de texto',
    });
  }
  if (val.tipo === 'imagen' && !val.imagen_base64) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['imagen_base64'],
      message: 'imagen_base64 es requerido para firmas de imagen',
    });
  }
});

export type CrearFirmaMeInput = z.infer<typeof crearFirmaMeSchema>;

export const actualizarFirmaSchema = crearFirmaBaseSchema
  .partial()
  .superRefine((val, ctx) => {
    if (val.tipo === 'texto' && val.contenido === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contenido'],
        message: 'contenido es requerido para firmas de texto',
      });
    }
    if (val.tipo === 'imagen' && val.imagen_base64 === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['imagen_base64'],
        message: 'imagen_base64 es requerido para firmas de imagen',
      });
    }
  });
export type ActualizarFirmaInput = z.infer<typeof actualizarFirmaSchema>;
