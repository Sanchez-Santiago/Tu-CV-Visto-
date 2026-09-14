import { request } from "./http";
import { emailFila } from "./mappers";
import type { Email } from "@/src/schemas/email";
import type { ResumenSincronizacion } from "./estrategia";

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
    firmas?: number[];
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
    if (input.firmas?.length) {
      payload.firmas = input.firmas;
    }
    const data = await request<Record<string, unknown>>("/gmail/enviar", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return emailFila(data);
  },
};