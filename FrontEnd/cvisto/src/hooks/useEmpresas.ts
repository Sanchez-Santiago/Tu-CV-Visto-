import { useCallback, useEffect, useState } from "react";
import { empresasApi } from "@/src/lib/api/client";
import type { Empresa } from "@/src/schemas/empresa";

function mensajeError(e: unknown): string | null {
  return e instanceof Error ? e.message : "Error desconocido";
}

export function useEmpresas() {
  const [data, setData] = useState<Empresa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      const empresas = await empresasApi.getAll();
      setData(empresas);
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

  const crear = useCallback(async (datos: Omit<Empresa, "id">) => {
    const creada = await empresasApi.create(datos);
    setData((prev) => [...prev, creada]);
    return creada;
  }, []);

  const actualizar = useCallback(
    async (id: string, cambios: Partial<Empresa>) => {
      const actualizada = await empresasApi.update(id, cambios);
      setData((prev) => prev.map((e) => (e.id === id ? actualizada : e)));
      return actualizada;
    },
    [],
  );

  const eliminar = useCallback(async (id: string) => {
    await empresasApi.delete(id);
    setData((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { data, cargando, error, refrescar, crear, actualizar, eliminar };
}