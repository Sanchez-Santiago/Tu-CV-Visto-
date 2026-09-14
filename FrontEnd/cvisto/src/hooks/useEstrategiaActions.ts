import { useCallback, useState } from "react";
import type {
  ResumenSincronizacion,
  RenovacionCandidata,
  ResultadoRenovar,
} from "@/src/lib/api/client";
import { useToast } from "@/src/components/ui/Toast";

export function useEstrategiaActions(opts: {
  sincronizar: (dias: number) => Promise<ResumenSincronizacion>;
  renovar: (items: { postulacion_id: number; asunto?: string; cuerpo?: string }[]) => Promise<ResultadoRenovar>;
  confirmarRechazo: (postulacionId: number) => Promise<void>;
  refrescarPostulaciones: () => Promise<void>;
  refrescarEmails: () => Promise<void>;
  refrescarSeguimientos: () => Promise<void>;
}) {
  const { success, error } = useToast();
  const [actualizando, setActualizando] = useState(false);

  const sincronizar = useCallback(
    async (dias: number) => {
      const resumen = await opts.sincronizar(dias);
      await Promise.all([
        opts.refrescarPostulaciones(),
        opts.refrescarEmails(),
        opts.refrescarSeguimientos(),
      ]);
      return resumen;
    },
    [
      opts.sincronizar,
      opts.refrescarPostulaciones,
      opts.refrescarEmails,
      opts.refrescarSeguimientos,
    ],
  );

  const renovar = useCallback(
    async (items: { postulacion_id: number; asunto?: string; cuerpo?: string }[]) => {
      return opts.renovar(items);
    },
    [opts.renovar],
  );

  const confirmarRechazo = useCallback(
    async (postulacionId: number) => {
      return opts.confirmarRechazo(postulacionId);
    },
    [opts.confirmarRechazo],
  );

  const actualizarGlobal = useCallback(async () => {
    if (actualizando) return;
    setActualizando(true);
    try {
      const r = await sincronizar(60);
      success(
        r.importados > 0 || r.estados_actualizados > 0
          ? `Actualizado: ${r.importados} mails nuevos, ${r.estados_actualizados} estado(s) actualizado(s)`
          : "Datos al día: sin cambios",
      );
    } catch (e) {
      error(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setActualizando(false);
    }
  }, [sincronizar, actualizando, success, error]);

  return {
    actualizando,
    sincronizar,
    renovar,
    confirmarRechazo,
    actualizarGlobal,
  };
}