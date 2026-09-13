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
import type { Usuario, UsuarioSinId } from "@/src/schemas/usuario";
import { UsuarioSchema, UsuarioSinIdSchema } from "@/src/schemas/usuario";
import type { EstadoPostulacion, TipoSeguimiento } from "@/src/schemas/common";

// ─── Configuration ───────────────────────────────────────────
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const API_URL = `${API_BASE}/api`;

// ─── Internal state ──────────────────────────────────────────
let sesionUsuarioId: number | null = null;

// ─── Date helpers ────────────────────────────────────────────
function hoyDia(): string {
  return new Date().toISOString().slice(0, 10);
}
function sumarDias(dateStr: string, dias: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// ─── HTTP helpers ────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
    credentials: "include",
    cache: "no-store",
    ...options,
  });
  const body = await res.json();
  if (res.status === 401) {
    sesionUsuarioId = null;
    throw new Error("Sesión expirada");
  }
  if (body?.ok === false || res.status >= 400) {
    const err = body?.error as
      | { message?: string; details?: unknown }
      | string
      | undefined;
    const msgBase =
      typeof err === "object"
        ? err.message
        : (body?.error as string) || `Error ${res.status}`;
    let detalle = "";
    if (typeof err === "object" && typeof err.details === "string") {
      detalle = ` — ${err.details.slice(0, 300)}`;
    }
    throw new Error(`${msgBase}${detalle}`);
  }
  return body.data as T;
}

// ─── Backend → Frontend (columns = identity, 1:1) ────────────
function filaAEntero(valor: unknown): number {
  return Number(valor);
}

function postulacionFila(fila: Record<string, unknown>): Postulacion {
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

function empresaFila(fila: Record<string, unknown>): Empresa {
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

function contactoFila(fila: Record<string, unknown>): Contacto {
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

function seguimientoFila(fila: Record<string, unknown>): Seguimiento {
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

function emailFila(fila: Record<string, unknown>): Email {
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

function usuarioFila(fila: Record<string, unknown>): Usuario {
  return UsuarioSchema.parse({
    id: String(fila.id),
    nombre: fila.nombre,
    email: fila.email,
    perfil: (fila.perfil as string | null) ?? null,
    pais: (fila.pais as string | null) ?? null,
    provincia: (fila.provincia as string | null) ?? null,
    cv: (fila.cv as string | null) ?? null,
    createdAt: (fila.created_at as string | null) ?? null,
    updatedAt: (fila.updated_at as string | null) ?? null,
  });
}

// ─── Frontend → Backend (columns = identity, 1:1) ────────────
function postulacionPayload(
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

function empresaPayload(data: EmpresaSinId): Record<string, unknown> {
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

function contactoPayload(data: ContactoSinId): Record<string, unknown> {
  return {
    empresa_id: data.empresaId,
    nombre: data.nombre,
    email: data.email,
    cargo: data.cargo ?? null,
    observaciones: data.observaciones ?? null,
  };
}

function seguimientoPayload(data: SeguimientoSinId): Record<string, unknown> {
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

function emailPayload(data: EmailSinId): Record<string, unknown> {
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

function usuarioPayload(data: UsuarioSinId): Record<string, unknown> {
  return {
    nombre: data.nombre,
    perfil: data.perfil ?? null,
    pais: data.pais ?? null,
    provincia: data.provincia ?? null,
    cv: data.cv ?? null,
  };
}

// ─── Resolver de sesión ──────────────────────────────────────
async function resolverUsuarioId(): Promise<number> {
  if (sesionUsuarioId) return sesionUsuarioId;
  const me = await USUARIO.getMe();
  sesionUsuarioId = Number(me.id);
  return sesionUsuarioId;
}

// ─── Domain APIs ─────────────────────────────────────────────
export const postulacionesApi = {
  async getAll(): Promise<Postulacion[]> {
    const filas = await request<Record<string, unknown>[]>("/postulaciones");
    return filas.map(postulacionFila);
  },

  async getById(id: string): Promise<Postulacion | null> {
    try {
      const fila = await request<Record<string, unknown>>(`/postulaciones/${id}`);
      return postulacionFila(fila);
    } catch {
      return null;
    }
  },

  async create(data: PostulacionSinId): Promise<Postulacion> {
    const usuarioId = await resolverUsuarioId();
    const payload = postulacionPayload(data, usuarioId);
    const creada = await request<Record<string, unknown>>("/postulaciones", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return postulacionFila(creada);
  },

  async update(id: string, cambios: Partial<Postulacion>): Promise<Postulacion> {
    const payload: Record<string, unknown> = {};
    if (cambios.empresaId !== undefined) payload.empresa_id = cambios.empresaId;
    if (cambios.puesto !== undefined) payload.puesto = cambios.puesto;
    if (cambios.modalidad !== undefined) payload.modalidad = cambios.modalidad ?? null;
    if (cambios.respondio !== undefined) payload.respondio = cambios.respondio;
    if (cambios.estado !== undefined) payload.estado = cambios.estado;
    if (cambios.interes !== undefined) payload.interes = cambios.interes;
    if (cambios.fuente !== undefined) payload.fuente = cambios.fuente ?? null;
    if (cambios.cantidadMailsEnviados !== undefined)
      payload.cantidad_mails_enviados = cambios.cantidadMailsEnviados;
    if (cambios.fechaPostulacion !== undefined)
      payload.fecha_postulacion = cambios.fechaPostulacion ?? null;
    if (cambios.ultimoContacto !== undefined)
      payload.ultimo_contacto = cambios.ultimoContacto ?? null;
    if (cambios.proximoContacto !== undefined)
      payload.proxima_contacto = cambios.proximoContacto ?? null;
    if (cambios.observaciones !== undefined)
      payload.observaciones = cambios.observaciones ?? null;
    const fila = await request<Record<string, unknown>>(`/postulaciones/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return postulacionFila(fila);
  },

  async cambiarEstado(id: string, estado: EstadoPostulacion): Promise<Postulacion> {
    return this.update(id, { estado });
  },

  async registrarSeguimiento(
    id: string,
    datos: {
      tipoSeguimiento: TipoSeguimiento;
      fecha: string;
      observaciones?: string;
      enviado?: 0 | 1;
    },
    cadenciaDias?: number,
  ): Promise<Postulacion> {
    const fecha = datos.fecha || hoyDia();
    const postulacionFila_ = await request<Record<string, unknown>>(
      `/postulaciones/${id}`,
    );
    const empresa = await request<Record<string, unknown>>(
      `/empresas/${postulacionFila_.empresa_id}`,
    );
    const cadencia =
      (empresa.cadencia_contacto as number | null) ?? cadenciaDias ?? 30;
    const proximaFecha = sumarDias(fecha, cadencia);

    await request("/seguimientos", {
      method: "POST",
      body: JSON.stringify({
        postulacion_id: Number(id),
        fecha_programada: fecha,
        tipo_seguimiento: datos.tipoSeguimiento,
        enviado: datos.enviado ?? 0,
        requiere_aprobacion: 0,
        observaciones: datos.observaciones ?? null,
      }),
    });

    const actualizada = await request<Record<string, unknown>>(
      `/postulaciones/${id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          ultimo_contacto: fecha,
          proxima_contacto: proximaFecha,
        }),
      },
    );
    return postulacionFila(actualizada);
  },

  async delete(id: string): Promise<boolean> {
    await request(`/postulaciones/${id}`, { method: "DELETE" });
    return true;
  },
};

export const empresasApi = {
  async getAll(): Promise<Empresa[]> {
    const filas = await request<Record<string, unknown>[]>("/empresas");
    return filas.map(empresaFila);
  },

  async getById(id: string): Promise<Empresa | null> {
    try {
      const fila = await request<Record<string, unknown>>(`/empresas/${id}`);
      return empresaFila(fila);
    } catch {
      return null;
    }
  },

  async create(data: EmpresaSinId): Promise<Empresa> {
    const creada = await request<Record<string, unknown>>("/empresas", {
      method: "POST",
      body: JSON.stringify(empresaPayload(data)),
    });
    return empresaFila(creada);
  },

  async update(id: string, cambios: Partial<Empresa>): Promise<Empresa> {
    const payload: Record<string, unknown> = {};
    if (cambios.nombre !== undefined) payload.nombre = cambios.nombre;
    if (cambios.pais !== undefined) payload.pais = cambios.pais ?? null;
    if (cambios.provincia !== undefined) payload.provincia = cambios.provincia ?? null;
    if (cambios.ciudad !== undefined) payload.ciudad = cambios.ciudad ?? null;
    if (cambios.modalidad !== undefined) payload.modalidad = cambios.modalidad ?? null;
    if (cambios.cadenciaContacto !== undefined)
      payload.cadencia_contacto = cambios.cadenciaContacto ?? null;
    if (cambios.observaciones !== undefined)
      payload.observaciones = cambios.observaciones ?? null;
    const fila = await request<Record<string, unknown>>(`/empresas/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return empresaFila(fila);
  },

  async delete(id: string): Promise<boolean> {
    await request(`/empresas/${id}`, { method: "DELETE" });
    return true;
  },
};

export const contactosApi = {
  async getAll(): Promise<Contacto[]> {
    const filas = await request<Record<string, unknown>[]>("/contactos-rrhh");
    return filas.map(contactoFila);
  },

  async create(data: ContactoSinId): Promise<Contacto> {
    const creado = await request<Record<string, unknown>>("/contactos-rrhh", {
      method: "POST",
      body: JSON.stringify(contactoPayload(data)),
    });
    return contactoFila(creado);
  },

  async update(id: string, cambios: Partial<Contacto>): Promise<Contacto> {
    const payload: Record<string, unknown> = {};
    if (cambios.empresaId !== undefined) payload.empresa_id = cambios.empresaId;
    if (cambios.nombre !== undefined) payload.nombre = cambios.nombre;
    if (cambios.email !== undefined) payload.email = cambios.email;
    if (cambios.cargo !== undefined) payload.cargo = cambios.cargo ?? null;
    if (cambios.observaciones !== undefined)
      payload.observaciones = cambios.observaciones ?? null;
    const fila = await request<Record<string, unknown>>(`/contactos-rrhh/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return contactoFila(fila);
  },

  async delete(id: string): Promise<boolean> {
    await request(`/contactos-rrhh/${id}`, { method: "DELETE" });
    return true;
  },
};

export const seguimientosApi = {
  async getAll(): Promise<Seguimiento[]> {
    const filas = await request<Record<string, unknown>[]>("/seguimientos");
    return filas.map(seguimientoFila);
  },

  async create(data: SeguimientoSinId): Promise<Seguimiento> {
    const creado = await request<Record<string, unknown>>("/seguimientos", {
      method: "POST",
      body: JSON.stringify(seguimientoPayload(data)),
    });
    return seguimientoFila(creado);
  },

  async toggleEnviado(id: string): Promise<Seguimiento> {
    const filas = await request<Record<string, unknown>[]>("/seguimientos");
    const actual = filas.find((fila) => String(fila.id) === id);
    if (!actual) throw new Error("Seguimiento no encontrado");
    const nuevoEnviado = (actual.enviado as number) === 1 ? 0 : 1;
    await request(`/seguimientos/${id}`, {
      method: "PUT",
      body: JSON.stringify({ enviado: nuevoEnviado }),
    });
    return seguimientoFila({ ...actual, enviado: nuevoEnviado });
  },

  async delete(id: string): Promise<boolean> {
    await request(`/seguimientos/${id}`, { method: "DELETE" });
    return true;
  },
};

export const emailsApi = {
  async getAll(): Promise<Email[]> {
    const filas = await request<Record<string, unknown>[]>("/emails");
    return filas.map(emailFila);
  },

  async create(data: EmailSinId): Promise<Email> {
    const creado = await request<Record<string, unknown>>("/emails", {
      method: "POST",
      body: JSON.stringify(emailPayload(data)),
    });
    return emailFila(creado);
  },

  async update(id: string, cambios: Partial<EmailSinId>): Promise<Email> {
    const payload: Record<string, unknown> = {};
    if (cambios.postulacionId !== undefined)
      payload.postulacion_id = cambios.postulacionId;
    if (cambios.gmailMessageId !== undefined)
      payload.gmail_message_id = cambios.gmailMessageId ?? null;
    if (cambios.tipo !== undefined) payload.tipo = cambios.tipo;
    if (cambios.tipoSeguimiento !== undefined)
      payload.tipo_seguimiento = cambios.tipoSeguimiento ?? null;
    if (cambios.asunto !== undefined) payload.asunto = cambios.asunto ?? null;
    if (cambios.remitente !== undefined) payload.remitente = cambios.remitente;
    if (cambios.destinatario !== undefined)
      payload.destinatario = cambios.destinatario;
    if (cambios.fecha !== undefined) payload.fecha = cambios.fecha;
    if (cambios.enviado !== undefined) payload.enviado = cambios.enviado;
    if (cambios.contenidoResumen !== undefined)
      payload.contenido_resumen = cambios.contenidoResumen ?? null;
    if (cambios.cuerpoHtml !== undefined)
      payload.cuerpo_html = cambios.cuerpoHtml ?? null;
    const actualizado = await request<Record<string, unknown>>(
      `/emails/${id}`,
      { method: "PUT", body: JSON.stringify(payload) }
    );
    return emailFila(actualizado);
  },

  async delete(id: string): Promise<boolean> {
    await request(`/emails/${id}`, { method: "DELETE" });
    return true;
  },
};

// ─── Auth helpers ────────────────────────────────────────────
export const USUARIO = {
  async getMe(): Promise<Usuario> {
    const fila = await request<Record<string, unknown>>(
      `${API_BASE}/auth/me`,
    );
    sesionUsuarioId = Number(fila.id);
    return usuarioFila(fila);
  },

  async updateMe(data: Partial<Usuario>): Promise<Usuario> {
    const payload: Record<string, unknown> = {};
    if (data.nombre !== undefined) payload.nombre = data.nombre;
    if (data.perfil !== undefined) payload.perfil = data.perfil ?? null;
    if (data.pais !== undefined) payload.pais = data.pais ?? null;
    if (data.provincia !== undefined) payload.provincia = data.provincia ?? null;
    if (data.cv !== undefined) payload.cv = data.cv ?? null;
    const fila = await request<Record<string, unknown>>("/usuarios/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return usuarioFila(fila);
  },

  async logout(): Promise<void> {
    await request(`${API_BASE}/auth/logout`, { method: "POST" });
    sesionUsuarioId = null;
  },
};

export type { TipoSeguimiento };

export function urlLoginGoogle(): string {
  return `${API_BASE}/auth/google/login`;
}

// ─── Estrategia / Sincronización (Gmail) ─────────────────────
export type TipoRespuestaDetectada =
  | "rechazo"
  | "entrevista"
  | "novedad"
  | "contacto"
  | "otro";

export interface SincronizacionDetalle {
  postulacion_id: number;
  empresa: string;
  tipo_respuesta: TipoRespuestaDetectada;
  fecha: string;
  snippet: string;
}

export interface ResumenSincronizacion {
  importados: number;
  yaExistentes: number;
  sinMatch: number;
  estados_actualizados: number;
  resumen: Record<TipoRespuestaDetectada, number>;
  detalle: SincronizacionDetalle[];
}

export interface RenovacionCandidata {
  postulacion_id: number;
  empresa: string;
  puesto: string;
  dias_desde_ultimo_contacto: number;
  cantidad_mails_enviados: number;
  tipo_sugerido: string;
  asunto_sugerido: string;
  cuerpo_sugerido: string;
  destinatario: string | null;
}

export interface RevisionRechazoCandidata {
  postulacion_id: number;
  empresa: string;
  puesto: string;
  asunto: string | null;
  fecha: string;
  snippet: string;
}

export interface MailPorMes {
  mes: string;
  enviados: number;
  recibidos: number;
}

export interface MailPorPuesto {
  puesto: string;
  postulaciones: number;
  mails_enviados: number;
  respondidas: number;
}

export interface EstadisticasEstrategia {
  total_postulaciones: number;
  mails_enviados: number;
  mails_recibidos: number;
  respondidas: number;
  tasa_respuesta: number;
  positivas: number;
  entrevistas: number;
  ofertas: number;
  aceptadas: number;
  rechazadas: number;
  activas: number;
  mails_por_mes: MailPorMes[];
  mails_por_puesto: MailPorPuesto[];
}

export interface ResultadoRenovar {
  enviados: number;
  emails: Email[];
}

export interface AdjuntoEnviar {
  nombre: string;
  mimeType: string;
  contenidoBase64: string;
}

export const gmailApi = {
  async sincronizar(dias = 14): Promise<ResumenSincronizacion> {
    const data = await request<Record<string, unknown>>(
      `/gmail/sincronizar?dias=${dias}`,
    );
    return data as unknown as ResumenSincronizacion;
  },

  async enviar(input: {
    destinatario: string;
    asunto?: string;
    cuerpo?: string;
    cc?: string;
    postulacionId?: number | null;
    tipo?: string;
    tipoSeguimiento?: string | null;
    crearSeguimiento?: boolean;
    fechaProgramada?: string | null;
    adjuntos?: AdjuntoEnviar[];
  }): Promise<Email> {
    const payload: Record<string, unknown> = {
      destinatario: input.destinatario,
      asunto: input.asunto,
      cuerpo: input.cuerpo,
      tipo: input.tipo ?? "seguimiento",
    };
    if (input.cc) payload.cc = input.cc;
    if (input.postulacionId != null) {
      payload.postulacion_id = input.postulacionId;
    }
    if (input.tipoSeguimiento) payload.tipo_seguimiento = input.tipoSeguimiento;
    if (input.crearSeguimiento !== undefined)
      payload.crear_seguimiento = input.crearSeguimiento;
    if (input.fechaProgramada) payload.fecha_programada = input.fechaProgramada;
    if (input.adjuntos?.length) {
      payload.adjuntos = input.adjuntos.map((a) => ({
        nombre: a.nombre,
        mime_type: a.mimeType,
        contenido_base64: a.contenidoBase64,
      }));
    }
    const data = await request<Record<string, unknown>>("/gmail/enviar", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return emailFila(data);
  },
};

export const estrategiaApi = {
  async renovaciones(): Promise<RenovacionCandidata[]> {
    const data = await request<Record<string, unknown>[]>(
      "/estrategia/renovaciones",
    );
    return data as unknown as RenovacionCandidata[];
  },

  async renovar(
    items: { postulacion_id: number; asunto?: string; cuerpo?: string }[],
  ): Promise<ResultadoRenovar> {
    const data = await request<Record<string, unknown>>("/estrategia/renovar", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
    return {
      enviados: Number(data.enviados),
      emails: Array.isArray(data.emails)
        ? data.emails.map(emailFila)
        : [],
    };
  },

  async revisionRechazos(): Promise<RevisionRechazoCandidata[]> {
    const data = await request<Record<string, unknown>[]>(
      "/estrategia/revision-rechazos",
    );
    return data as unknown as RevisionRechazoCandidata[];
  },

  async confirmarRechazo(postulacion_id: number): Promise<void> {
    await request("/estrategia/confirmar-rechazo", {
      method: "POST",
      body: JSON.stringify({ postulacion_id }),
    });
  },

  async estadisticas(): Promise<EstadisticasEstrategia> {
    const data = await request<Record<string, unknown>>(
      "/estrategia/estadisticas",
    );
    return data as unknown as EstadisticasEstrategia;
  },

  async debidas(): Promise<Record<string, unknown>[]> {
    return request<Record<string, unknown>[]>("/estrategia/debidas");
  },
};