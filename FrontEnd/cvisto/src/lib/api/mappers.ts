import type { Postulacion, PostulacionSinId } from "@/src/schemas/postulacion";
import { PostulacionSchema, PostulacionSinIdSchema } from "@/src/schemas/postulacion";
import type { Empresa, EmpresaSinId } from "@/src/schemas/empresa";
import { EmpresaSchema, EmpresaSinIdSchema } from "@/src/schemas/empresa";
import type { Contacto, ContactoSinId } from "@/src/schemas/contacto";
import { ContactoSchema, ContactoSinIdSchema } from "@/src/schemas/contacto";
import type { Seguimiento, SeguimientoSinId } from "@/src/schemas/seguimiento";
import { SeguimientoSchema, SeguimientoSinIdSchema } from "@/src/schemas/seguimiento";
import type { Email, EmailSinId } from "@/src/schemas/email";
import { EmailSchema, EmailSinIdSchema } from "@/src/schemas/email";
import type { Experiencia, ExperienciaSinId } from "@/src/schemas/experiencia";
import { ExperienciaSchema, ExperienciaSinIdSchema } from "@/src/schemas/experiencia";
import type { Proyecto, ProyectoSinId } from "@/src/schemas/proyecto";
import { ProyectoSchema, ProyectoSinIdSchema } from "@/src/schemas/proyecto";
import type { Categoria } from "@/src/schemas/categoria";
import { CategoriaSchema } from "@/src/schemas/categoria";
import type { Firma, FirmaSinId } from "@/src/schemas/firma";
import { FirmaSchema } from "@/src/schemas/firma";
import type { Usuario, UsuarioSinId } from "@/src/schemas/usuario";
import { UsuarioSchema, UsuarioSinIdSchema } from "@/src/schemas/usuario";

// ─── Backend → Frontend (columns = identity, 1:1) ────────────
export function filaAEntero(valor: unknown): number {
  return Number(valor);
}

export function postulacionFila(fila: Record<string, unknown>): Postulacion {
  return PostulacionSchema.parse({
    id: String(fila.id),
    usuarioId: filaAEntero(fila.usuario_id),
    empresaId: filaAEntero(fila.empresa_id),
    puesto: fila.puesto,
    modalidad: (fila.modalidad as string | null) ?? null,
    respondio: (fila.respondio as number) ?? 0,
    estado: fila.estado,
    interes: fila.interes,
    fuente: (fila.fuente as string | null) ?? null,
    cantidadMailsEnviados: (fila.cantidad_mails_enviados as number) ?? 0,
    fechaPostulacion: (fila.fecha_postulacion as string | null) ?? null,
    ultimoContacto: (fila.ultimo_contacto as string | null) ?? null,
    proximoContacto: (fila.proxima_contacto as string | null) ?? null,
    observaciones: (fila.observaciones as string | null) ?? null,
    createdAt: (fila.created_at as string | null) ?? null,
    updatedAt: (fila.updated_at as string | null) ?? null,
  });
}

export function empresaFila(fila: Record<string, unknown>): Empresa {
  return EmpresaSchema.parse({
    id: String(fila.id),
    nombre: fila.nombre,
    pais: (fila.pais as string | null) ?? null,
    provincia: (fila.provincia as string | null) ?? null,
    ciudad: (fila.ciudad as string | null) ?? null,
    modalidad: (fila.modalidad as string | null) ?? null,
    cadenciaContacto: (fila.cadencia_contacto as number | null) ?? null,
    observaciones: (fila.observaciones as string | null) ?? null,
    createdAt: (fila.created_at as string | null) ?? null,
    updatedAt: (fila.updated_at as string | null) ?? null,
  });
}

export function contactoFila(fila: Record<string, unknown>): Contacto {
  return ContactoSchema.parse({
    id: String(fila.id),
    empresaId: filaAEntero(fila.empresa_id),
    nombre: fila.nombre,
    email: fila.email,
    cargo: (fila.cargo as string | null) ?? null,
    observaciones: (fila.observaciones as string | null) ?? null,
    createdAt: (fila.created_at as string | null) ?? null,
    updatedAt: (fila.updated_at as string | null) ?? null,
  });
}

export function seguimientoFila(fila: Record<string, unknown>): Seguimiento {
  return SeguimientoSchema.parse({
    id: String(fila.id),
    postulacionId: filaAEntero(fila.postulacion_id),
    fechaProgramada: fila.fecha_programada,
    tipoSeguimiento: fila.tipo_seguimiento,
    enviado: (fila.enviado as number) ?? 0,
    requiereAprobacion: (fila.requiere_aprobacion as number) ?? 1,
    fechaEnvio: (fila.fecha_envio as string | null) ?? null,
    observaciones: (fila.observaciones as string | null) ?? null,
    createdAt: (fila.created_at as string | null) ?? null,
  });
}

export function emailFila(fila: Record<string, unknown>): Email {
  return EmailSchema.parse({
    id: String(fila.id),
    postulacionId:
      fila.postulacion_id === null || fila.postulacion_id === undefined
        ? null
        : filaAEntero(fila.postulacion_id),
    gmailMessageId: (fila.gmail_message_id as string | null) ?? null,
    tipo: fila.tipo,
    tipoSeguimiento: (fila.tipo_seguimiento as string | null) ?? null,
    asunto: (fila.asunto as string | null) ?? null,
    remitente: fila.remitente,
    destinatario: fila.destinatario,
    fecha: fila.fecha,
    enviado: (fila.enviado as number) ?? 1,
    contenidoResumen: (fila.contenido_resumen as string | null) ?? null,
    cuerpoHtml: (fila.cuerpo_html as string | null) ?? null,
    createdAt: (fila.created_at as string | null) ?? null,
  });
}

export function experienciaFila(fila: Record<string, unknown>): Experiencia {
  return ExperienciaSchema.parse({
    id: String(fila.id),
    usuarioId: filaAEntero(fila.usuario_id),
    empresa: fila.empresa,
    puesto: fila.puesto,
    fechaInicio: (fila.fecha_inicio as string | null) ?? null,
    fechaFin: (fila.fecha_fin as string | null) ?? null,
    descripcion: (fila.descripcion as string | null) ?? null,
    createdAt: (fila.created_at as string | null) ?? null,
    updatedAt: (fila.updated_at as string | null) ?? null,
  });
}

export function proyectoFila(fila: Record<string, unknown>): Proyecto {
  const tec = fila.tecnologias as string | null | undefined;
  return ProyectoSchema.parse({
    id: String(fila.id),
    usuarioId: filaAEntero(fila.usuario_id),
    nombre: fila.nombre,
    descripcion: (fila.descripcion as string | null) ?? null,
    tecnologias: tec ? tec.split(",").map((t) => t.trim()).filter(Boolean) : [],
    url: (fila.url as string | null) ?? null,
    createdAt: (fila.created_at as string | null) ?? null,
    updatedAt: (fila.updated_at as string | null) ?? null,
  });
}

export function categoriaFila(fila: Record<string, unknown>): Categoria {
  return CategoriaSchema.parse({
    id: String(fila.id),
    nombre: fila.nombre,
    createdAt: (fila.created_at as string | null) ?? null,
  });
}

export function firmaFila(fila: Record<string, unknown>): Firma {
  return FirmaSchema.parse({
    id: String(fila.id),
    usuarioId: filaAEntero(fila.usuario_id),
    nombre: fila.nombre,
    tipo: fila.tipo,
    contenido: (fila.contenido as string | null) ?? null,
    imagenMime: (fila.imagen_mime as string | null) ?? null,
    imagenBase64: (fila.imagen_base64 as string | null) ?? null,
    enlace: (fila.enlace as string | null) ?? null,
    createdAt: (fila.created_at as string | null) ?? null,
    updatedAt: (fila.updated_at as string | null) ?? null,
  });
}

export function usuarioFila(fila: Record<string, unknown>): Usuario {
  return UsuarioSchema.parse({
    id: String(fila.id),
    nombre: fila.nombre,
    email: fila.email,
    perfil: (fila.perfil as string | null) ?? null,
    pais: (fila.pais as string | null) ?? null,
    provincia: (fila.provincia as string | null) ?? null,
    cv: (fila.cv as string | null) ?? null,
    telefono: (fila.telefono as string | null) ?? null,
    linkedin: (fila.linkedin as string | null) ?? null,
    sitioWeb: (fila.sitio_web as string | null) ?? null,
    createdAt: (fila.created_at as string | null) ?? null,
    updatedAt: (fila.updated_at as string | null) ?? null,
  });
}

// ─── Frontend → Backend (columns = identity, 1:1) ────────────
export function postulacionPayload(
  data: PostulacionSinId,
  usuarioId: number,
): Record<string, unknown> {
  return {
    usuario_id: usuarioId,
    empresa_id: data.empresaId,
    puesto: data.puesto,
    modalidad: data.modalidad ?? null,
    respondio: data.respondio,
    estado: data.estado,
    interes: data.interes,
    fuente: data.fuente ?? null,
    cantidad_mails_enviados: data.cantidadMailsEnviados,
    fecha_postulacion: data.fechaPostulacion ?? null,
    ultimo_contacto: data.ultimoContacto ?? null,
    proxima_contacto: data.proximoContacto ?? null,
    observaciones: data.observaciones ?? null,
  };
}

export function empresaPayload(data: EmpresaSinId): Record<string, unknown> {
  return {
    nombre: data.nombre,
    pais: data.pais ?? null,
    provincia: data.provincia ?? null,
    ciudad: data.ciudad ?? null,
    modalidad: data.modalidad ?? null,
    cadencia_contacto: data.cadenciaContacto ?? null,
    observaciones: data.observaciones ?? null,
  };
}

export function contactoPayload(data: ContactoSinId): Record<string, unknown> {
  return {
    empresa_id: data.empresaId,
    nombre: data.nombre,
    email: data.email,
    cargo: data.cargo ?? null,
    observaciones: data.observaciones ?? null,
  };
}

export function seguimientoPayload(data: SeguimientoSinId): Record<string, unknown> {
  return {
    postulacion_id: data.postulacionId,
    fecha_programada: data.fechaProgramada,
    tipo_seguimiento: data.tipoSeguimiento,
    enviado: data.enviado,
    requiere_aprobacion: data.requiereAprobacion,
    fecha_envio: data.fechaEnvio ?? null,
    observaciones: data.observaciones ?? null,
  };
}

export function emailPayload(data: EmailSinId): Record<string, unknown> {
  return {
    postulacion_id: data.postulacionId,
    gmail_message_id: data.gmailMessageId ?? null,
    tipo: data.tipo,
    tipo_seguimiento: data.tipoSeguimiento ?? null,
    asunto: data.asunto ?? null,
    remitente: data.remitente,
    destinatario: data.destinatario,
    fecha: data.fecha,
    enviado: data.enviado,
    contenido_resumen: data.contenidoResumen ?? null,
    cuerpo_html: data.cuerpoHtml ?? null,
  };
}

export function experienciaPayload(data: ExperienciaSinId): Record<string, unknown> {
  return {
    empresa: data.empresa,
    puesto: data.puesto,
    fecha_inicio: data.fechaInicio ?? null,
    fecha_fin: data.fechaFin ?? null,
    descripcion: data.descripcion ?? null,
  };
}

export function proyectoPayload(data: ProyectoSinId): Record<string, unknown> {
  return {
    nombre: data.nombre,
    descripcion: data.descripcion ?? null,
    tecnologias: data.tecnologias?.length ? data.tecnologias : undefined,
    url: data.url ?? null,
  };
}

export function firmaPayload(data: FirmaSinId): Record<string, unknown> {
  return {
    nombre: data.nombre,
    tipo: data.tipo,
    contenido: data.contenido ?? null,
    imagen_mime: data.imagenMime ?? null,
    imagen_base64: data.imagenBase64 ?? null,
    enlace: data.enlace ?? null,
  };
}

export function usuarioPayload(data: UsuarioSinId): Record<string, unknown> {
  return {
    nombre: data.nombre,
    perfil: data.perfil ?? null,
    pais: data.pais ?? null,
    provincia: data.provincia ?? null,
    cv: data.cv ?? null,
    telefono: data.telefono ?? null,
    linkedin: data.linkedin ?? null,
    sitio_web: data.sitioWeb ?? null,
  };
}