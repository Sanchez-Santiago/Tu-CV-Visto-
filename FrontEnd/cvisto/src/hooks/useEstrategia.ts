import { useCallback, useEffect, useState } from "react";
import {
  estrategiaApi,
  gmailApi,
  type EstadisticasEstrategia,
  type RenovacionCandidata,
  type ResumenSincronizacion,
  type RevisionRechazoCandidata,
} from "@/src/lib/api/client";
import { mensajeError } from "@/src/lib/errores";

export function useEstrategia() {
  const [renovaciones, setRenovaciones] = useState<RenovacionCandidata[]>([]);
  const [revisiones, setRevisiones] = useState<RevisionRechazoCandidata[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasEstrategia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      const [renov, rev, stats] = await Promise.all([
        estrategiaApi.renovaciones(),
        estrategiaApi.revisionRechazos(),
        estrategiaApi.estadisticas(),
      ]);
      setRenovaciones(renov);
      setRevisiones(rev);
      setEstadisticas(stats);
      setError(null);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const sincronizar = useCallback(
    async (dias: number): Promise<ResumenSincronizacion> => {
      const resumen = await gmailApi.sincronizar(dias);
      await refrescar();
      return resumen;
    },
    [refrescar],
  );

  const renovar = useCallback(
    async (
      items: { postulacion_id: number; asunto?: string; cuerpo?: string }[],
    ) => {
      const resultado = await estrategiaApi.renovar(items);
      await refrescar();
      return resultado;
    },
    [refrescar],
  );

  const confirmarRechazo = useCallback(
    async (postulacionId: number) => {
      await estrategiaApi.confirmarRechazo(postulacionId);
      await refrescar();
    },
    [refrescar],
  );

  return {
    renovaciones,
    revisiones,
    estadisticas,
    cargando,
    error,
    refrescar,
    sincronizar,
    renovar,
    confirmarRechazo,
  };
}