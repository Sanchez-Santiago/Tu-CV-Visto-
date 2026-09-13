import { useCallback, useEffect, useState } from "react";
import { postulacionesApi } from "@/src/lib/api/client";
import type { Postulacion, PostulacionSinId } from "@/src/schemas/postulacion";
import type {
  EstadoPostulacion,
  TipoSeguimiento,
} from "@/src/schemas/common";

function mensajeError(e: unknown): string | null {
  return e instanceof Error ? e.message : "Error desconocido";
}

export function usePostulaciones() {
  const [data, setData] = useState<Postulacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      const postulaciones = await postulacionesApi.getAll();
      setData(postulaciones);
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

  const crear = useCallback(async (datos: PostulacionSinId) => {
    const creada = await postulacionesApi.create(datos);
    setData((prev) => [creada, ...prev]);
    return creada;
  }, []);

  const actualizar = useCallback(
    async (id: string, cambios: Partial<Postulacion>) => {
      const actualizada = await postulacionesApi.update(id, cambios);
      setData((prev) => prev.map((p) => (p.id === id ? actualizada : p)));
      return actualizada;
    },
    [],
  );

  const eliminar = useCallback(async (id: string) => {
    await postulacionesApi.delete(id);
    setData((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const cambiarEstado = useCallback(
    async (id: string, estado: EstadoPostulacion) => {
      const actualizada = await postulacionesApi.cambiarEstado(id, estado);
      setData((prev) => prev.map((p) => (p.id === id ? actualizada : p)));
      return actualizada;
    },
    [],
  );

  const registrarSeguimiento = useCallback(
    async (
      id: string,
      datos: {
        tipoSeguimiento: TipoSeguimiento;
        fecha: string;
        observaciones?: string;
        enviado?: 0 | 1;
      },
      cadenciaDias?: number,
    ) => {
      const actualizada = await postulacionesApi.registrarSeguimiento(
        id,
        datos,
        cadenciaDias,
      );
      setData((prev) => prev.map((p) => (p.id === id ? actualizada : p)));
      return actualizada;
    },
    [],
  );

  return {
    data,
    cargando,
    error,
    refrescar,
    crear,
    actualizar,
    eliminar,
    cambiarEstado,
    registrarSeguimiento,
  };
}