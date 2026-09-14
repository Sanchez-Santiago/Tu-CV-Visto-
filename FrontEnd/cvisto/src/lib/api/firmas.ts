import type { Firma, FirmaSinId } from "@/src/schemas/firma";
import { request } from "./http";
import { firmaFila, firmaPayload } from "./mappers";

export const firmasApi = {
  async getAll(): Promise<Firma[]> {
    const filas = await request<Record<string, unknown>[]>("/firmas");
    return filas.map(firmaFila);
  },

  async create(data: FirmaSinId): Promise<Firma> {
    const creada = await request<Record<string, unknown>>("/firmas", {
      method: "POST",
      body: JSON.stringify(firmaPayload(data)),
    });
    return firmaFila(creada);
  },

  async update(id: string, cambios: Partial<FirmaSinId>): Promise<Firma> {
    const payload: Record<string, unknown> = {};
    if (cambios.nombre !== undefined) payload.nombre = cambios.nombre;
    if (cambios.tipo !== undefined) payload.tipo = cambios.tipo;
    if (cambios.contenido !== undefined) payload.contenido = cambios.contenido ?? null;
    if (cambios.imagenMime !== undefined) payload.imagen_mime = cambios.imagenMime ?? null;
    if (cambios.imagenBase64 !== undefined) payload.imagen_base64 = cambios.imagenBase64 ?? null;
    if (cambios.enlace !== undefined) payload.enlace = cambios.enlace ?? null;
    const actualizada = await request<Record<string, unknown>>(`/firmas/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return firmaFila(actualizada);
  },

  async delete(id: string): Promise<boolean> {
    await request(`/firmas/${id}`, { method: "DELETE" });
    return true;
  },
};