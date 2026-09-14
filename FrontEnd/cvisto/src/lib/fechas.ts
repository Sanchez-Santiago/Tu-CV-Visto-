const pad = (n: number) => String(n).padStart(2, "0");

export function hoyDia(): string {
  return new Date().toISOString().slice(0, 10);
}

export function sumarDias(dateStr: string, dias: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function fechaDia(fecha: string | null | undefined): string {
  return (fecha ?? "").slice(0, 10);
}

export function aFechaLocalISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function aMesLocalISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}