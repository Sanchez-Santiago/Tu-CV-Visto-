import { z } from 'zod';

export const MODALIDADES = [
  'presencial',
  'remoto',
  'hibrido',
  'no_especificado',
] as const;
export type Modalidad = (typeof MODALIDADES)[number];

export const ESTADOS_POSTULACION = [
  'pendiente',
  'en_proceso',
  'entrevista',
  'oferta',
  'aceptado',
  'rechazado',
  'cancelado',
] as const;
export type EstadoPostulacion = (typeof ESTADOS_POSTULACION)[number];

export const INTERESES = ['bajo', 'medio', 'alto'] as const;
export type Interes = (typeof INTERESES)[number];

export const TIPOS_EMAIL = [
  'postulacion',
  'seguimiento',
  'respuesta',
  'otro',
] as const;
export type TipoEmail = (typeof TIPOS_EMAIL)[number];

export const TIPOS_SEGUIMIENTO = [
  'consulta',
  'novedad',
  'recordatorio',
  'nuevo_proyecto',
  'disponibilidad',
] as const;
export type TipoSeguimiento = (typeof TIPOS_SEGUIMIENTO)[number];

export const TIPOS_CONTACTO = [
  'rrhh',
  'reclutador',
  'referencia',
  'cliente',
  'otro',
] as const;
export type TipoContacto = (typeof TIPOS_CONTACTO)[number];

export const flag = z.union([z.literal(0), z.literal(1)]).default(0);
export type Flag = 0 | 1;

export const fechaMes = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato esperado: YYYY-MM');

export const fechaDia = z
  .string()
  .regex(
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    'Formato esperado: YYYY-MM-DD',
  );

export const email = z.string().email('Email inválido');
export const url = z.string().url('URL inválida');