import { proyectosApi } from "@/src/lib/api/client";
import type { Proyecto, ProyectoSinId } from "@/src/schemas/proyecto";
import { useRecurso } from "./useRecurso";

export function useProyectos() {
  return useRecurso<Proyecto, ProyectoSinId>(proyectosApi, { prepend: true });
}