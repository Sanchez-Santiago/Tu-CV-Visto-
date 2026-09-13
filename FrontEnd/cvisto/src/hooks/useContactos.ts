import { useCallback, useEffect, useState } from "react";
import { contactosApi } from "@/src/lib/api/client";
import type { Contacto, ContactoSinId } from "@/src/schemas/contacto";

function mensajeError(e: unknown): string | null {
  return e instanceof Error ? e.message : "Error desconocido";
}

export function useContactos() {
  const [data, setData] = useState<Contacto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      const contactos = await contactosApi.getAll();
      setData(contactos);
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

  const crear = useCallback(async (datos: ContactoSinId) => {
    const creado = await contactosApi.create(datos);
    setData((prev) => [...prev, creado]);
    return creado;
  }, []);

  const eliminar = useCallback(async (id: string) => {
    await contactosApi.delete(id);
    setData((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { data, cargando, error, refrescar, crear, eliminar };
}