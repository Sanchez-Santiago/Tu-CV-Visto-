export interface UsuarioRow {
  id: number;
  nombre: string;
  email: string;
  perfil: string | null;
  pais: string | null;
  provincia: string | null;
  cv: string | null;
  telefono: string | null;
  linkedin: string | null;
  sitio_web: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExperienciaRow {
  id: number;
  usuario_id: number;
  empresa: string;
  puesto: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProyectoRow {
  id: number;
  usuario_id: number;
  nombre: string;
  descripcion: string | null;
  tecnologias: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FirmaRow {
  id: number;
  usuario_id: number;
  nombre: string;
  tipo: 'texto' | 'imagen';
  contenido: string | null;
  imagen_mime: string | null;
  imagen_base64: string | null;
  enlace: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoriaRow {
  id: number;
  nombre: string;
  created_at: string;
}

export interface UsuarioCategoriaRow {
  usuario_id: number;
  categoria_id: number;
}

export interface ContactoRow {
  id: number;
  usuario_id: number;
  tipo: string;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmpresaRow {
  id: number;
  nombre: string;
  pais: string | null;
  provincia: string | null;
  ciudad: string | null;
  modalidad: string | null;
  cadencia_contacto: number | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactoRrhhRow {
  id: number;
  empresa_id: number;
  nombre: string;
  email: string;
  cargo: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostulacionRow {
  id: number;
  usuario_id: number;
  empresa_id: number;
  puesto: string;
  modalidad: string | null;
  respondio: number;
  estado: string;
  interes: string;
  fuente: string | null;
  cantidad_mails_enviados: number;
  fecha_postulacion: string | null;
  ultimo_contacto: string | null;
  proxima_contacto: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostulacionContactoRow {
  postulacion_id: number;
  contacto_rrhh_id: number;
}

export interface EmailRow {
  id: number;
  postulacion_id: number | null;
  gmail_message_id: string | null;
  tipo: string;
  tipo_seguimiento: string | null;
  asunto: string | null;
  remitente: string;
  destinatario: string;
  fecha: string;
  enviado: number;
  contenido_resumen: string | null;
  cuerpo_html: string | null;
  tipo_respuesta: string | null;
  tipo_respuesta_fuente: string | null;
  created_at: string;
}

export interface SeguimientoRow {
  id: number;
  postulacion_id: number;
  fecha_programada: string;
  tipo_seguimiento: string;
  enviado: number;
  requiere_aprobacion: number;
  fecha_envio: string | null;
  observaciones: string | null;
  created_at: string;
}