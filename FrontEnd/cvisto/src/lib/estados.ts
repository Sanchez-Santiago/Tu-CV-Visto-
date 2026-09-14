import type {
  EstadoPostulacion,
  TipoEmail,
  TipoSeguimiento,
} from "@/src/schemas/common";

export const ESTADO_LABELS: Record<EstadoPostulacion, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  entrevista: "Entrevista",
  oferta: "Oferta",
  aceptado: "Aceptado",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
};

export const ESTADO_COLORS: Record<string, string> = {
  pendiente: "#FBBF24",
  en_proceso: "#38BDF8",
  entrevista: "#A78BFA",
  oferta: "#2DD4BF",
  aceptado: "#22C55E",
  rechazado: "#FB7185",
  cancelado: "#A8A29E",
};

export const OPCIONES_ESTADO: { value: EstadoPostulacion; label: string }[] = [
  { value: "pendiente", label: "● Pendiente" },
  { value: "en_proceso", label: "● En proceso" },
  { value: "entrevista", label: "● Entrevista" },
  { value: "oferta", label: "● Oferta" },
  { value: "aceptado", label: "● Aceptado" },
  { value: "rechazado", label: "● Rechazado" },
  { value: "cancelado", label: "● Cancelado" },
];

export const TIPO_SEGUIMIENTO_LABELS: Record<TipoSeguimiento, string> = {
  novedad: "Novedad de perfil",
  nuevo_proyecto: "Nuevo proyecto / GitHub",
  disponibilidad: "Disponibilidad",
  recordatorio: "Cadencia de contacto",
  consulta: "Consulta estratégica",
};

export const TIPO_EMAIL_LABELS: Record<TipoEmail, string> = {
  postulacion: "Postulación",
  seguimiento: "Seguimiento",
  respuesta: "Respuesta",
  otro: "Otro",
};