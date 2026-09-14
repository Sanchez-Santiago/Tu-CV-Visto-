import type { Proyecto, ProyectoSinId } from "@/src/schemas/proyecto";
import { request } from "./http";
import { proyectoFila, proyectoPayload } from "./mappers";

export const proyectosApi = {
  async getAll(): Promise<Proyecto[]> {
    const filas = await request<Record<string, unknown>[]>("/proyectos");
    return filas.map(proyectoFila);
  },

  async create(data: ProyectoSinId): Promise<Proyecto> {
    const creado = await request<Record<string, unknown>>("/proyectos", {
      method: "POST",
      body: JSON.stringify(proyectoPayload(data)),
    });
    return proyectoFila(creado);
  },

  async update(
    id: string,
    cambios: Partial<ProyectoSinId>,
  ): Promise<Proyecto> {
    const payload: Record<string, unknown> = {};
    if (cambios.nombre !== undefined) payload.nombre = cambios.nombre;
    if (cambios.descripcion !== undefined)
      payload.descripcion = cambios.descripcion ?? null;
    if (cambios.tecnologias !== undefined)
      payload.tecnologias = cambios.tecnologias?.length
        ? cambios.tecnologias
        : [];
    if (cambios.url !== undefined) payload.url = cambios.url ?? null;
    const actualizado = await request<Record<string, unknown>>(
      `/proyectos/${id}`,
      { method: "PUT", body: JSON.stringify(payload) },
    );
    return proyectoFila(actualizado);
  },

  async delete(id: string): Promise<boolean> {
    await request(`/proyectos/${id}`, { method: "DELETE" });
    return true;
  },
};