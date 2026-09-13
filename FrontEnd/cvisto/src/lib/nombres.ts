import type { Empresa } from "@/src/schemas/empresa";

export function nombreEmpresa(
  empresas: Empresa[],
  empresaId: number | null | undefined,
): string {
  if (empresaId === null || empresaId === undefined) return "Sin empresa";
  const empresa = empresas.find((e) => Number(e.id) === Number(empresaId));
  return empresa?.nombre ?? `Empresa #${empresaId}`;
}

export function nombrePostulacion(
  postulaciones: Array<{ id: string; empresaId: number | null; puesto: string }>,
  postulacionId: number | null | undefined,
  empresas: Empresa[],
): string {
  if (postulacionId === null || postulacionId === undefined) return "Sin postulación";
  const postulacion = postulaciones.find(
    (p) => Number(p.id) === Number(postulacionId),
  );
  if (!postulacion) return `Postulación #${postulacionId}`;
  return `${nombreEmpresa(empresas, postulacion.empresaId)} – ${postulacion.puesto}`;
}

const TLDs = new Set([
  "com", "com.ar", "com.mx", "com.co", "com.br", "com.pe", "com.uy",
  "com.ve", "com.ec", "com.py", "com.do", "co", "net", "org", "io",
  "dev", "app", "es", "mx", "ar", "cl", "br", "uy", "pe", "ve", "ec",
  "info", "biz", "jobs", "edu", "gob", "gov",
]);

export function empresaIdDesdeDominio(
  empresas: Empresa[],
  email: string,
): number | undefined {
  const direccion = (
    email.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) ?? []
  )[0];
  if (!direccion) return undefined;
  const arroba = direccion.lastIndexOf("@");
  if (arroba === -1) return undefined;
  let dominio = direccion.slice(arroba + 1).toLowerCase();
  for (const tld of TLDs) {
    if (dominio.endsWith(`.${tld}`)) {
      dominio = dominio.slice(0, -(tld.length + 1));
      break;
    }
  }
  const nombre = dominio.replace(/[^a-z0-9]/g, "");
  if (!nombre) return undefined;
  const empresa = empresas.find(
    (e) => e.nombre.toLowerCase() === nombre.toLowerCase(),
  );
  return empresa ? Number(empresa.id) : undefined;
}