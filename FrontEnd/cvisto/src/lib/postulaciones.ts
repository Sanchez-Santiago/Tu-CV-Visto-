import type { Postulacion } from "@/src/schemas/postulacion";
import type { Empresa } from "@/src/schemas/empresa";
import { nombreEmpresa } from "@/src/lib/nombres";

export function postulacionVista(
  postulacionId: number | null | undefined,
  postulaciones: Postulacion[],
  empresas: Empresa[],
  textos?: { sinAsociar?: string; noEncontrada?: string },
): { postulacion: Postulacion | undefined; empresa: string } {
  const sinAsociar = textos?.sinAsociar ?? "Sin asociar";
  const noEncontrada = textos?.noEncontrada ?? "(Postulación no encontrada)";
  if (postulacionId === null || postulacionId === undefined) {
    return { postulacion: undefined, empresa: sinAsociar };
  }
  const postulacion = postulaciones.find(
    (p) => Number(p.id) === Number(postulacionId),
  );
  const empresa = postulacion
    ? nombreEmpresa(empresas, postulacion.empresaId)
    : noEncontrada;
  return { postulacion, empresa };
}