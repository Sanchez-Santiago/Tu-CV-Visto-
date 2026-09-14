import type { Email, EmailSinId } from "@/src/schemas/email";
import { request } from "./http";
import { emailFila, emailPayload } from "./mappers";

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