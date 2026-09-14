import { empresasApi } from "@/src/lib/api/client";
import type { Empresa, EmpresaSinId } from "@/src/schemas/empresa";
import { useRecurso } from "./useRecurso";

export function useEmpresas() {
  return useRecurso<Empresa, EmpresaSinId>(empresasApi);
}