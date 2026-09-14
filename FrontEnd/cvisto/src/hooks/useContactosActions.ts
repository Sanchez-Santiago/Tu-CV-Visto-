import { useCallback } from "react";
import type { Contacto, ContactoSinId } from "@/src/schemas/contacto";
import { useToast } from "@/src/components/ui/Toast";

export function useContactosActions(opts: {
  crear: (data: ContactoSinId) => Promise<Contacto>;
  eliminar: (id: string) => Promise<void>;
}) {
  const { success, error } = useToast();

  const crear = useCallback(
    async (data: ContactoSinId) => {
      try {
        const created = await opts.crear(data);
        success(`Contacto ${created.nombre} guardado`);
      } catch (err) {
        error("Error al guardar contacto");
      }
    },
    [opts.crear, success, error],
  );

  const eliminar = useCallback(
    async (id: string) => {
      try {
        await opts.eliminar(id);
        success("Contacto eliminado");
      } catch (err) {
        error("Error al eliminar contacto");
      }
    },
    [opts.eliminar, success, error],
  );

  return { crear, eliminar };
}