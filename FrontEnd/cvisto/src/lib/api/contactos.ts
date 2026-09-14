import type { Contacto, ContactoSinId } from "@/src/schemas/contacto";
import { request } from "./http";
import { contactoFila, contactoPayload } from "./mappers";

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