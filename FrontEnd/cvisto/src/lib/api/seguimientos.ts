import type { Seguimiento, SeguimientoSinId } from "@/src/schemas/seguimiento";
import { request } from "./http";
import { seguimientoFila, seguimientoPayload } from "./mappers";

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