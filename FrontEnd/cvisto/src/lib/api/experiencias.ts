import type { Experiencia, ExperienciaSinId } from "@/src/schemas/experiencia";
import { request } from "./http";
import { experienciaFila, experienciaPayload } from "./mappers";

export const experienciasApi = {
  async getAll(): Promise<Experiencia[]> {
    const filas = await request<Record<string, unknown>[]>("/experiencias");
    return filas.map(experienciaFila);
  },

  async create(data: ExperienciaSinId): Promise<Experiencia> {
    const creada = await request<Record<string, unknown>>("/experiencias", {
      method: "POST",
      body: JSON.stringify(experienciaPayload(data)),
    });
    return experienciaFila(creada);
  },

  async update(
    id: string,
    cambios: Partial<ExperienciaSinId>,
  ): Promise<Experiencia> {
    const payload: Record<string, unknown> = {};
    if (cambios.empresa !== undefined) payload.empresa = cambios.empresa;
    if (cambios.puesto !== undefined) payload.puesto = cambios.puesto;
    if (cambios.fechaInicio !== undefined)
      payload.fecha_inicio = cambios.fechaInicio ?? null;
    if (cambios.fechaFin !== undefined)
      payload.fecha_fin = cambios.fechaFin ?? null;
    if (cambios.descripcion !== undefined)
      payload.descripcion = cambios.descripcion ?? null;
    const actualizada = await request<Record<string, unknown>>(
      `/experiencias/${id}`,
      { method: "PUT", body: JSON.stringify(payload) },
    );
    return experienciaFila(actualizada);
  },

  async delete(id: string): Promise<boolean> {
    await request(`/experiencias/${id}`, { method: "DELETE" });
    return true;
  },
};