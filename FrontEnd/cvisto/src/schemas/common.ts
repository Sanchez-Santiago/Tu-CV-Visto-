import { z } from "zod";

export const ModalidadSchema = z.enum([
  "presencial",
  "remoto",
  "hibrido",
  "no_especificado",
]);
export type Modalidad = z.infer<typeof ModalidadSchema>;

export const EstadoPostulacionSchema = z.enum([
  "pendiente",
  "en_proceso",
  "entrevista",
  "oferta",
  "aceptado",
  "rechazado",
  "cancelado",
]);
export type EstadoPostulacion = z.infer<typeof EstadoPostulacionSchema>;

export const InteresSchema = z.enum(["bajo", "medio", "alto"]);
export type Interes = z.infer<typeof InteresSchema>;

export const TipoEmailSchema = z.enum([
  "postulacion",
  "seguimiento",
  "respuesta",
  "otro",
]);
export type TipoEmail = z.infer<typeof TipoEmailSchema>;

export const TipoSeguimientoSchema = z.enum([
  "consulta",
  "novedad",
  "recordatorio",
  "nuevo_proyecto",
  "disponibilidad",
]);
export type TipoSeguimiento = z.infer<typeof TipoSeguimientoSchema>;

export const TipoRespuestaSchema = z.enum([
  "rechazo",
  "entrevista",
  "oferta",
  "novedad",
  "contacto",
  "otro",
]);
export type TipoRespuesta = z.infer<typeof TipoRespuestaSchema>;

export const FlagSchema = z.union([z.literal(0), z.literal(1)]);
export type Flag = z.infer<typeof FlagSchema>;