import { firmasApi } from "@/src/lib/api/client";
import type { Firma, FirmaSinId } from "@/src/schemas/firma";
import { useRecurso } from "./useRecurso";

export function useFirmas() {
  return useRecurso<Firma, FirmaSinId>(firmasApi);
}