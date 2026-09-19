import { request } from "./http";
import { emailFila } from "./mappers";
import type { Email } from "@/src/schemas/email";

// ─── Estrategia / Sincronización (Gmail) ─────────────────────
export type TipoRespuestaDetectada =
  | "rechazo"
  | "entrevista"
  | "oferta"
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
  analisis_ia?: ResumenAnalisisIA;
}

export interface AnalisisDetalleIA {
  email_id: number;
  postulacion_id: number | null;
  empresa: string;
  tipo_respuesta: TipoRespuestaDetectada;
  snippet: string;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  fuente: "keywords" | "ia";
  postulacion_creada?: boolean;
  vinculado_a_existente?: boolean;
  puesto?: string;
}

export interface ResumenAnalisisIA {
  analizados: number;
  rechazos: number;
  entrevistas: number;
  ofertas: number;
  estados_actualizados: number;
  postulaciones_creadas: number;
  postulaciones_vinculadas: number;
  detalle: AnalisisDetalleIA[];
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

export const estrategiaApi = {
  async renovaciones(): Promise<RenovacionCandidata[]> {
    const data = await request<Record<string, unknown>[]>(
      "/estrategia/renovaciones",
    );
    return data as unknown as RenovacionCandidata[];
  },

  async renovar(
    items: {
      postulacion_id: number;
      asunto?: string;
      cuerpo?: string;
      firmas?: number[];
    }[],
    firmas?: number[],
  ): Promise<ResultadoRenovar> {
    const data = await request<Record<string, unknown>>("/estrategia/renovar", {
      method: "POST",
      body: JSON.stringify({
        items,
        ...(firmas?.length ? { firmas } : {}),
      }),
    });
    return {
      enviados: Number(data.enviados),
      emails: Array.isArray(data.emails)
        ? data.emails.map(emailFila)
        : [],
    };
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