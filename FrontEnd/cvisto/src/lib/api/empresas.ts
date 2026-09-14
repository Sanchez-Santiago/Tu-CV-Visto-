import type { Empresa, EmpresaSinId } from "@/src/schemas/empresa";
import { request } from "./http";
import { empresaFila, empresaPayload } from "./mappers";

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