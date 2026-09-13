import { useCallback, useEffect, useState } from "react";
import { experienciasApi } from "@/src/lib/api/client";
import type { Experiencia, ExperienciaSinId } from "@/src/schemas/experiencia";

export function useExperiencias() {
  const [data, setData] = useState<Experiencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      setData(await experienciasApi.getAll());
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

  const crear = useCallback(async (datos: ExperienciaSinId) => {
    const creada = await experienciasApi.create(datos);
    setData((prev) => [creada, ...prev]);
    return creada;
  }, []);

  const actualizar = useCallback(
    async (id: string, cambios: Partial<ExperienciaSinId>) => {
      const actualizada = await experienciasApi.update(id, cambios);
      setData((prev) => prev.map((e) => (e.id === id ? actualizada : e)));
      return actualizada;
    },
    [],
  );

  const eliminar = useCallback(async (id: string) => {
    await experienciasApi.delete(id);
    setData((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return {
    data,
    cargando,
    error,
    refrescar,
    crear,
    actualizar,
    eliminar,
  };
}