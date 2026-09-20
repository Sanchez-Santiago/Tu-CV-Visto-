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
  renovar: (
    items: {
      postulacion_id: number;
      asunto?: string;
      cuerpo?: string;
      firmas?: number[];
    }[],
    firmas?: number[],
  ) => Promise<ResultadoRenovar>;
  refrescarPostulaciones: () => Promise<void>;
  refrescarEmails: () => Promise<void>;
  refrescarSeguimientos: () => Promise<void>;
  refrescarEmpresas: () => Promise<void>;
  refrescarContactos: () => Promise<void>;
  refrescarFirmas: () => Promise<void>;
}) {
  const { success, error } = useToast();
  const [actualizando, setActualizando] = useState(false);
  const [analizandoIA, setAnalizandoIA] = useState(false);

  const refrescarListas = useCallback(
    () =>
      Promise.all([
        opts.refrescarPostulaciones(),
        opts.refrescarEmails(),
        opts.refrescarSeguimientos(),
        opts.refrescarEmpresas(),
        opts.refrescarContactos(),
        opts.refrescarFirmas(),
      ]),
    [
      opts.refrescarPostulaciones,
      opts.refrescarEmails,
      opts.refrescarSeguimientos,
      opts.refrescarEmpresas,
      opts.refrescarContactos,
      opts.refrescarFirmas,
    ],
  );

  const sincronizar = useCallback(
    async (dias: number) => {
      const resumen = await opts.sincronizar(dias);
      await refrescarListas();
      return resumen;
    },
    [opts.sincronizar, refrescarListas],
  );

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
    const resultado = await opts.renovar(items, firmas);
    await refrescarListas();
    return resultado;
  },
  [opts.renovar, refrescarListas],
);

  const analizar = useCallback(async () => {
    const resumen = await opts.analizar();
    await refrescarListas();
    return resumen;
  }, [opts.analizar, refrescarListas]);

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
      const sufijoProveedor = resumen.proveedor ? ` · vía ${resumen.proveedor}` : "";
      success(
        resumen.estados_actualizados > 0
          ? `IA: ${resumen.rechazos} rechazo(s), ${resumen.entrevistas} entrevista(s) y ${resumen.estados_actualizados} estado(s) actualizado(s)${sufijoCreadas}${sufijoProveedor}`
          : resumen.analizados > 0
            ? `IA: ${resumen.analizados} email(s) clasificado(s), sin cambios de estado${sufijoCreadas || ", sin postulaciones detectadas"}${sufijoProveedor}`
            : `IA: sin correos pendientes${sufijoCreadas || ""}${sufijoProveedor}`,
      );
      return resumen;
    } catch (e) {
      error(e instanceof Error ? e.message : "Error al analizar con IA");
      throw e;
    } finally {
      setAnalizandoIA(false);
    }
  }, [analizar, success, error]);

  const actualizarGlobal = useCallback(async () => {
    if (actualizando) return;
    setActualizando(true);
    try {
      const r = await sincronizar(14);
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
    actualizarGlobal,
  };
}