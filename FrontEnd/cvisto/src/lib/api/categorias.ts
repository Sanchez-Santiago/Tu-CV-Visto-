import type { Categoria } from "@/src/schemas/categoria";
import { request } from "./http";
import { categoriaFila } from "./mappers";

export const categoriasApi = {
  async listar(): Promise<Categoria[]> {
    const filas = await request<Record<string, unknown>[]>("/categorias");
    return filas.map(categoriaFila);
  },

  async crear(nombre: string): Promise<Categoria> {
    const creada = await request<Record<string, unknown>>("/categorias", {
      method: "POST",
      body: JSON.stringify({ nombre }),
    });
    return categoriaFila(creada);
  },

  async listarDeUsuario(usuarioId: number): Promise<Categoria[]> {
    const filas = await request<Record<string, unknown>[]>(
      `/usuarios/${usuarioId}/categorias`,
    );
    return filas.map(categoriaFila);
  },

  async asignar(usuarioId: number, categoriaId: number): Promise<Categoria> {
    const asignada = await request<Record<string, unknown>>(
      `/usuarios/${usuarioId}/categorias`,
      {
        method: "POST",
        body: JSON.stringify({ categoria_id: categoriaId }),
      },
    );
    return categoriaFila(asignada);
  },

  async quitar(usuarioId: number, categoriaId: number): Promise<boolean> {
    await request(`/usuarios/${usuarioId}/categorias/${categoriaId}`, {
      method: "DELETE",
    });
    return true;
  },
};