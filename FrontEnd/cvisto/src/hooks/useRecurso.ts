import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { mensajeError } from "@/src/lib/errores";

export interface RecursoApi<T, Datos = Partial<T>> {
  getAll: () => Promise<T[]>;
  create: (datos: Datos) => Promise<T>;
  update?: (id: string, cambios: Partial<Datos>) => Promise<T>;
  delete: (id: string) => Promise<boolean>;
}

interface UseRecursoOptions {
  prepend?: boolean;
}

export interface UseRecursoResult<T, Datos = Partial<T>> {
  data: T[];
  cargando: boolean;
  error: string | null;
  refrescar: () => Promise<void>;
  crear: (datos: Datos) => Promise<T>;
  actualizar: (id: string, cambios: Partial<Datos>) => Promise<T>;
  eliminar: (id: string) => Promise<void>;
  setData: Dispatch<SetStateAction<T[]>>;
}

export function useRecurso<T, Datos = Partial<T>>(
  api: RecursoApi<T, Datos>,
  options: UseRecursoOptions = {},
): UseRecursoResult<T, Datos> {
  const [data, setData] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      setData(await api.getAll());
      setError(null);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [api]);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const crear = useCallback(
    async (datos: Datos) => {
      const creado = await api.create(datos);
      setData((prev) =>
        options.prepend ? [creado, ...prev] : [...prev, creado],
      );
      return creado;
    },
    [api, options.prepend],
  );

  const actualizar = useCallback(
    async (id: string, cambios: Partial<Datos>) => {
      if (!api.update) throw new Error("El recurso no soporta actualización");
      const actualizado = await api.update(id, cambios);
      setData((prev) =>
        prev.map((item) => (item.id === id ? actualizado : item)),
      );
      return actualizado;
    },
    [api],
  );

  const eliminar = useCallback(
    async (id: string) => {
      await api.delete(id);
      setData((prev) => prev.filter((item) => item.id !== id));
    },
    [api],
  );

  return { data, cargando, error, refrescar, crear, actualizar, eliminar, setData };
}