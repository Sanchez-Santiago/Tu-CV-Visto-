import type { Usuario } from "@/src/schemas/usuario";
import { request, API_BASE, getSesionUsuarioId, setSesionUsuarioId } from "./http";
import { usuarioFila } from "./mappers";

// ─── Resolver de sesión ──────────────────────────────────────
export async function resolverUsuarioId(): Promise<number> {
  if (getSesionUsuarioId()) return getSesionUsuarioId()!;
  const me = await USUARIO.getMe();
  setSesionUsuarioId(Number(me.id));
  return Number(me.id);
}

// ─── Auth helpers ────────────────────────────────────────────
export const USUARIO = {
  async getMe(): Promise<Usuario> {
    const fila = await request<Record<string, unknown>>(
      `${API_BASE}/auth/me`,
    );
    setSesionUsuarioId(Number(fila.id));
    return usuarioFila(fila);
  },

  async updateMe(data: Partial<Usuario>): Promise<Usuario> {
    const payload: Record<string, unknown> = {};
    if (data.nombre !== undefined) payload.nombre = data.nombre;
    if (data.perfil !== undefined) payload.perfil = data.perfil ?? null;
    if (data.pais !== undefined) payload.pais = data.pais ?? null;
    if (data.provincia !== undefined) payload.provincia = data.provincia ?? null;
    if (data.cv !== undefined) payload.cv = data.cv ?? null;
    if (data.telefono !== undefined) payload.telefono = data.telefono ?? null;
    if (data.linkedin !== undefined) payload.linkedin = data.linkedin ?? null;
    if (data.sitioWeb !== undefined) payload.sitio_web = data.sitioWeb ?? null;
    const fila = await request<Record<string, unknown>>("/usuarios/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return usuarioFila(fila);
  },

  async logout(): Promise<void> {
    await request(`${API_BASE}/auth/logout`, { method: "POST" });
    setSesionUsuarioId(null);
    sessionStorage.removeItem("cvisto_token");
  },
};

export function urlLoginGoogle(): string {
  return `${API_BASE}/auth/google/login`;
}