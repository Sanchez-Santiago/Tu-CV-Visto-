import { useCallback, useEffect, useState } from "react";
import { firmasApi } from "@/src/lib/api/client";
import type { Firma, FirmaSinId } from "@/src/schemas/firma";

export function useFirmas() {
  const [data, setData] = useState<Firma[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      setData(await firmasApi.getAll());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const crear = useCallback(async (datos: FirmaSinId) => {
    const creada = await firmasApi.create(datos);
    setData((prev) => [...prev, creada]);
    return creada;
  }, []);

  const actualizar = useCallback(
    async (id: string, cambios: Partial<FirmaSinId>) => {
      const actualizada = await firmasApi.update(id, cambios);
      setData((prev) => prev.map((f) => (f.id === id ? actualizada : f)));
      return actualizada;
    },
    [],
  );

  const eliminar = useCallback(async (id: string) => {
    await firmasApi.delete(id);
    setData((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { data, cargando, error, refrescar, crear, actualizar, eliminar };
}