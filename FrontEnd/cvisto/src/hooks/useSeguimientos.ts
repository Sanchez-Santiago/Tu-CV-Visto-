import { useCallback } from "react";
import { seguimientosApi } from "@/src/lib/api/client";
import type { Seguimiento, SeguimientoSinId } from "@/src/schemas/seguimiento";
import { useRecurso } from "./useRecurso";

export function useSeguimientos() {
  const base = useRecurso<Seguimiento, SeguimientoSinId>(seguimientosApi, {
    prepend: true,
  });

  const alternarEnviado = useCallback(
    async (id: string) => {
      const actualizado = await seguimientosApi.toggleEnviado(id);
      base.setData((prev) => prev.map((s) => (s.id === id ? actualizado : s)));
      return actualizado;
    },
    [base.setData],
  );

  return { ...base, alternarEnviado };
}