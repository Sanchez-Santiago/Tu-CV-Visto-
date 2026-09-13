import { useCallback, useEffect, useState } from "react";
import { emailsApi } from "@/src/lib/api/client";
import type { Email, EmailSinId } from "@/src/schemas/email";

function mensajeError(e: unknown): string | null {
  return e instanceof Error ? e.message : "Error desconocido";
}

export function useEmails() {
  const [data, setData] = useState<Email[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      const emails = await emailsApi.getAll();
      setData(emails);
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

  const crear = useCallback(async (datos: EmailSinId) => {
    const creado = await emailsApi.create(datos);
    setData((prev) => [creado, ...prev]);
    return creado;
  }, []);

  const eliminar = useCallback(async (id: string) => {
    await emailsApi.delete(id);
    setData((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const actualizar = useCallback(
    async (id: string, cambios: Partial<EmailSinId>) => {
      const actualizado = await emailsApi.update(id, cambios);
      setData((prev) => prev.map((e) => (e.id === id ? actualizado : e)));
      return actualizado;
    },
    []
  );

  return { data, cargando, error, refrescar, crear, eliminar, actualizar };
}