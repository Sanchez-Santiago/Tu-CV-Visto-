export function formatearMesAnio(mes?: string | null): string {
  if (!mes) return "Actualidad";
  const [anio, m] = mes.split("-");
  if (!anio || !m) return mes;
  const nombreMes =
    ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
     "septiembre", "octubre", "noviembre", "diciembre"][Number(m) - 1] ?? m;
  return `${nombreMes} ${anio}`;
}

export function rangoMeses(inicio?: string | null, fin?: string | null): string {
  const desde = formatearMesAnio(inicio ?? null);
  const hasta = fin ? formatearMesAnio(fin) : "Actualidad";
  return `${desde} — ${hasta}`;
}