import { useCallback, useEffect, useState } from "react";
import { categoriasApi } from "@/src/lib/api/client";
import type { Categoria } from "@/src/schemas/categoria";

interface UseCategoriasResult {
  todas: Categoria[];
  seleccionadas: Categoria[];
  cargando: boolean;
  refrescar: () => Promise<void>;
  crear: (nombre: string) => Promise<Categoria>;
  alternar: (categoriaId: number) => Promise<boolean>;
}

export function useCategorias(usuarioId: number): UseCategoriasResult {
  const [todas, setTodas] = useState<Categoria[]>([]);
  const [seleccionadas, setSeleccionadas] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      const [cats, selec] = await Promise.all([
        categoriasApi.listar(),
        categoriasApi.listarDeUsuario(usuarioId),
      ]);
      setTodas(cats);
      setSeleccionadas(selec);
    } catch {
      // silencioso: las secciones ya muestran estado vacío
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const crear = useCallback(async (nombre: string) => {
    const creada = await categoriasApi.crear(nombre);
    setTodas((prev) => [...prev, creada]);
    return creada;
  }, []);

  const alternar = useCallback(
    async (categoriaId: number) => {
      const yaAsignada = seleccionadas.some(
        (c) => Number(c.id) === categoriaId,
      );
      if (yaAsignada) {
        await categoriasApi.quitar(usuarioId, categoriaId);
        setSeleccionadas((prev) =>
          prev.filter((c) => Number(c.id) !== categoriaId),
        );
        return false;
      }
      const asignada = await categoriasApi.asignar(usuarioId, categoriaId);
      setSeleccionadas((prev) => [...prev, asignada]);
      return true;
    },
    [usuarioId, seleccionadas],
  );

  return { todas, seleccionadas, cargando, refrescar, crear, alternar };
}