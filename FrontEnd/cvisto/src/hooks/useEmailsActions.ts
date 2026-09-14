import { useCallback } from "react";
import type { Email, EmailSinId } from "@/src/schemas/email";
import { useToast } from "@/src/components/ui/Toast";

export function useEmailsActions(opts: {
  crear: (data: EmailSinId) => Promise<Email>;
  eliminar: (id: string) => Promise<void>;
}) {
  const { success, error } = useToast();

  const crear = useCallback(
    async (data: EmailSinId) => {
      try {
        await opts.crear(data);
        success("Email registrado");
      } catch (err) {
        error("Error al registrar email");
      }
    },
    [opts.crear, success, error],
  );

  const eliminar = useCallback(
    async (id: string) => {
      try {
        await opts.eliminar(id);
        success("Email eliminado");
      } catch (err) {
        error("Error al eliminar email");
      }
    },
    [opts.eliminar, success, error],
  );

  return { crear, eliminar };
}