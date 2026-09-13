import { useCallback, useEffect, useState } from "react";
import { proyectosApi } from "@/src/lib/api/client";
import type { Proyecto, ProyectoSinId } from "@/src/schemas/proyecto";

export function useProyectos() {
  const [data, setData] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      setData(await proyectosApi.getAll());
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

  const crear = useCallback(async (datos: ProyectoSinId) => {
    const creado = await proyectosApi.create(datos);
    setData((prev) => [creado, ...prev]);
    return creado;
  }, []);

  const actualizar = useCallback(
    async (id: string, cambios: Partial<ProyectoSinId>) => {
      const actualizado = await proyectosApi.update(id, cambios);
      setData((prev) => prev.map((p) => (p.id === id ? actualizado : p)));
      return actualizado;
    },
    [],
  );

  const eliminar = useCallback(async (id: string) => {
    await proyectosApi.delete(id);
    setData((prev) => prev.filter((p) => p.id !== id));
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