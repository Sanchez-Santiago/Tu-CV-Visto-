import { useCallback } from "react";
import type { Empresa, EmpresaSinId } from "@/src/schemas/empresa";
import { useToast } from "@/src/components/ui/Toast";

export function useEmpresasActions(opts: {
  crear: (data: EmpresaSinId) => Promise<Empresa>;
  eliminar: (id: string) => Promise<void>;
}) {
  const { success, error } = useToast();

  const crear = useCallback(
    async (data: EmpresaSinId) => {
      try {
        const created = await opts.crear(data);
        success(`Empresa ${created.nombre} agregada`);
      } catch (err) {
        error("Error al guardar empresa");
      }
    },
    [opts.crear, success, error],
  );

  const eliminar = useCallback(
    async (id: string) => {
      try {
        await opts.eliminar(id);
        success("Empresa eliminada");
      } catch (err) {
        error("Error al eliminar empresa");
      }
    },
    [opts.eliminar, success, error],
  );

  return { crear, eliminar };
}