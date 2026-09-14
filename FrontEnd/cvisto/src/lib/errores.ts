export function mensajeError(e: unknown): string | null {
  return e instanceof Error ? e.message : "Error desconocido";
}