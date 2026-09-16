import { useCallback, useState } from "react";
import type {
  ResumenSincronizacion,
  RenovacionCandidata,
  ResultadoRenovar,
  ResumenAnalisisIA,
} from "@/src/lib/api/client";
import { useToast } from "@/src/components/ui/Toast";

export function useEstrategiaActions(opts: {
  sincronizar: (dias: number) => Promise<ResumenSincronizacion>;
  analizar: () => Promise<ResumenAnalisisIA>;
  renovar: (items: { postulacion_id: number; asunto?: string; cuerpo?: string }[]) => Promise<ResultadoRenovar>;
  confirmarRechazo: (postulacionId: number) => Promise<void>;
  refrescarPostulaciones: () => Promise<void>;
  refrescarEmails: () => Promise<void>;
  refrescarSeguimientos: () => Promise<void>;
}) {
  const { success, error } = useToast();
  const [actualizando, setActualizando] = useState(false);
  const [analizandoIA, setAnalizandoIA] = useState(false);

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

  const analizar = useCallback(async () => {
    const resumen = await opts.analizar();
    await Promise.all([
      opts.refrescarPostulaciones(),
      opts.refrescarEmails(),
      opts.refrescarSeguimientos(),
    ]);
    return resumen;
  }, [
    opts.analizar,
    opts.refrescarPostulaciones,
    opts.refrescarEmails,
    opts.refrescarSeguimientos,
  ]);

  const analizarIA = useCallback(async () => {
    setAnalizandoIA(true);
    try {
      const resumen = await analizar();
      const partesCreadas = [];
      if (resumen.postulaciones_creadas > 0) {
        partesCreadas.push(`${resumen.postulaciones_creadas} postulación(es) creada(s)`);
      }
      if (resumen.postulaciones_vinculadas > 0) {
        partesCreadas.push(`${resumen.postulaciones_vinculadas} vinculada(s)`);
      }
      const sufijoCreadas =
        partesCreadas.length > 0 ? `, ${partesCreadas.join(", ")}` : "";
      success(
        resumen.estados_actualizados > 0
          ? `IA: ${resumen.rechazos} rechazo(s), ${resumen.entrevistas} entrevista(s) y ${resumen.estados_actualizados} estado(s) actualizado(s)${sufijoCreadas}`
          : resumen.analizados > 0
            ? `IA: ${resumen.analizados} email(s) clasificado(s), sin cambios de estado${sufijoCreadas || ", sin postulaciones detectadas"}`
            : `IA: sin correos pendientes${sufijoCreadas || ""}`,
      );
      return resumen;
    } catch (e) {
      error(e instanceof Error ? e.message : "Error al analizar con IA");
      throw e;
    } finally {
      setAnalizandoIA(false);
    }
  }, [analizar, success, error]);

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
    analizandoIA,
    sincronizar,
    analizar: analizarIA,
    renovar,
    confirmarRechazo,
    actualizarGlobal,
  };
}