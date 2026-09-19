import { useCallback, useEffect, useState } from "react";
import {
  estrategiaApi,
  gmailApi,
  type EstadisticasEstrategia,
  type RenovacionCandidata,
  type ResumenAnalisisIA,
  type ResumenSincronizacion,
} from "@/src/lib/api/client";
import { mensajeError } from "@/src/lib/errores";

export function useEstrategia() {
  const [renovaciones, setRenovaciones] = useState<RenovacionCandidata[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasEstrategia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      const [renov, stats] = await Promise.all([
        estrategiaApi.renovaciones(),
        estrategiaApi.estadisticas(),
      ]);
      setRenovaciones(renov);
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

  const analizar = useCallback(async (): Promise<ResumenAnalisisIA> => {
    const resumen = await gmailApi.analizar();
    await refrescar();
    return resumen;
  }, [refrescar]);

  const renovar = useCallback(
    async (
      items: {
        postulacion_id: number;
        asunto?: string;
        cuerpo?: string;
        firmas?: number[];
      }[],
      firmas?: number[],
    ) => {
      const resultado = await estrategiaApi.renovar(items, firmas);
      await refrescar();
      return resultado;
    },
    [refrescar],
  );

  return {
    renovaciones,
    estadisticas,
    cargando,
    error,
    refrescar,
    sincronizar,
    analizar,
    renovar,
  };
}