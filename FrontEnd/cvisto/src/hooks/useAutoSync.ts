import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/src/components/ui/Toast";

const INTERVALO_MS = 120_000;
const DIAS_AUTO_SYNC = 14;

/**
 * Sincroniza los mails de Gmail al montar y cada 2 minutos, en silencio
 * (solo muestra un toast si falla). No ejecuta la IA: es solo Gmail → DB.
 */
export function useAutoSync(opts: {
  habilitado: boolean;
  sincronizar: (dias: number) => Promise<unknown>;
}) {
  const { error } = useToast();
  const [ultimaSincronizacion, setUltimaSincronizacion] =
    useState<Date | null>(null);
  const [sincronizandoAuto, setSincronizandoAuto] = useState(false);
  const enCurso = useRef(false);
  const sincronizarRef = useRef(opts.sincronizar);
  sincronizarRef.current = opts.sincronizar;

  const ejecutar = useCallback(async () => {
    if (enCurso.current) return;
    if (document.visibilityState === "hidden") return;
    enCurso.current = true;
    setSincronizandoAuto(true);
    try {
      await sincronizarRef.current(DIAS_AUTO_SYNC);
      setUltimaSincronizacion(new Date());
    } catch (e) {
      error(
        e instanceof Error ? e.message : "Error en sincronización automática",
      );
    } finally {
      enCurso.current = false;
      setSincronizandoAuto(false);
    }
  }, [error]);

  useEffect(() => {
    if (!opts.habilitado) return;
    void ejecutar();
    const id = window.setInterval(() => {
      void ejecutar();
    }, INTERVALO_MS);
    const alVisibilizar = () => {
      if (document.visibilityState === "visible") {
        void ejecutar();
      }
    };
    document.addEventListener("visibilitychange", alVisibilizar);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", alVisibilizar);
    };
  }, [opts.habilitado, ejecutar]);

  return { ultimaSincronizacion, sincronizandoAuto };
}
