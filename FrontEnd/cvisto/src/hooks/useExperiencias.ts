import { experienciasApi } from "@/src/lib/api/client";
import type { Experiencia, ExperienciaSinId } from "@/src/schemas/experiencia";
import { useRecurso } from "./useRecurso";

export function useExperiencias() {
  return useRecurso<Experiencia, ExperienciaSinId>(experienciasApi, {
    prepend: true,
  });
}