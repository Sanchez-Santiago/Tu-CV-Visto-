// ─── Configuration ───────────────────────────────────────────
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const API_URL = `${API_BASE}/api`;

// ─── Internal state ──────────────────────────────────────────
let sesionUsuarioId: number | null = null;

export function getSesionUsuarioId(): number | null {
  return sesionUsuarioId;
}

export function setSesionUsuarioId(id: number | null): void {
  sesionUsuarioId = id;
}

function getToken(): string | null {
  return sessionStorage.getItem("cvisto_token");
}

// ─── HTTP helpers ────────────────────────────────────────────
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const token = getToken();
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
    credentials: "include",
    cache: "no-store",
    ...options,
  });
  const body = await res.json();
  if (res.status === 401) {
    sesionUsuarioId = null;
    sessionStorage.removeItem("cvisto_token");
    throw new Error("Sesión expirada");
  }
  if (body?.ok === false || res.status >= 400) {
    const err = body?.error as
      | { message?: string; details?: unknown }
      | string
      | undefined;
    const msgBase =
      typeof err === "object"
        ? err.message
        : (body?.error as string) || `Error ${res.status}`;
    let detalle = "";
    if (typeof err === "object" && typeof err.details === "string") {
      detalle = ` — ${err.details.slice(0, 300)}`;
    }
    throw new Error(`${msgBase}${detalle}`);
  }
  return body.data as T;
}