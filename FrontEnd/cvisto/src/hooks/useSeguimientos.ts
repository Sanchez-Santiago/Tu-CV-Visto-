import { useCallback, useEffect, useState } from "react";
import { seguimientosApi } from "@/src/lib/api/client";
import type { Seguimiento, SeguimientoSinId } from "@/src/schemas/seguimiento";

function mensajeError(e: unknown): string | null {
  return e instanceof Error ? e.message : "Error desconocido";
}

export function useSeguimientos() {
  const [data, setData] = useState<Seguimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      const seguimientos = await seguimientosApi.getAll();
      setData(seguimientos);
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

  const crear = useCallback(async (datos: SeguimientoSinId) => {
    const creado = await seguimientosApi.create(datos);
    setData((prev) => [creado, ...prev]);
    return creado;
  }, []);

  const alternarEnviado = useCallback(async (id: string) => {
    const actualizado = await seguimientosApi.toggleEnviado(id);
    setData((prev) => prev.map((s) => (s.id === id ? actualizado : s)));
    return actualizado;
  }, []);

  const eliminar = useCallback(async (id: string) => {
    await seguimientosApi.delete(id);
    setData((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { data, cargando, error, refrescar, crear, alternarEnviado, eliminar };
}