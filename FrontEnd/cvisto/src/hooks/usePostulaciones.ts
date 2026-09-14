import { useCallback } from "react";
import { postulacionesApi } from "@/src/lib/api/client";
import type { Postulacion, PostulacionSinId } from "@/src/schemas/postulacion";
import type { EstadoPostulacion, TipoSeguimiento } from "@/src/schemas/common";
import { useRecurso } from "./useRecurso";

export function usePostulaciones() {
  const base = useRecurso<Postulacion, PostulacionSinId>(postulacionesApi, {
    prepend: true,
  });

  const cambiarEstado = useCallback(
    async (id: string, estado: EstadoPostulacion) => {
      return base.actualizar(id, { estado });
    },
    [base.actualizar],
  );

  const registrarSeguimiento = useCallback(
    async (
      id: string,
      datos: {
        tipoSeguimiento: TipoSeguimiento;
        fecha: string;
        observaciones?: string;
        enviado?: 0 | 1;
      },
      cadenciaDias?: number,
    ) => {
      const actualizada = await postulacionesApi.registrarSeguimiento(
        id,
        datos,
        cadenciaDias,
      );
      base.setData((prev) => prev.map((p) => (p.id === id ? actualizada : p)));
      return actualizada;
    },
    [base.setData],
  );

  return { ...base, cambiarEstado, registrarSeguimiento };
}