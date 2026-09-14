import { useCallback, useState } from "react";
import type { Seguimiento, SeguimientoSinId } from "@/src/schemas/seguimiento";
import type { Postulacion } from "@/src/schemas/postulacion";
import type { TipoSeguimiento } from "@/src/schemas/common";
import { useToast } from "@/src/components/ui/Toast";

export interface DatosRegistroContacto {
  tipoSeguimiento: TipoSeguimiento;
  fecha: string;
  observaciones?: string;
  enviado?: 0 | 1;
}

export function useSeguimientosActions(opts: {
  crear: (data: SeguimientoSinId) => Promise<Seguimiento>;
  eliminar: (id: string) => Promise<void>;
  alternarEnviado: (id: string) => Promise<Seguimiento>;
  refrescar: () => Promise<void>;
  registrarSeguimiento: (
    postulacionId: string,
    datos: DatosRegistroContacto,
    cadenciaDias?: number,
  ) => Promise<Seguimiento | Postulacion>;
}) {
  const { success, error } = useToast();
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [followupPrefillPostulacionId, setFollowupPrefillPostulacionId] =
    useState("");

  const abrirNuevaTarea = useCallback(() => {
    setFollowupPrefillPostulacionId("");
    setIsFollowupModalOpen(true);
  }, []);

  const abrirTareaParaPostulacion = useCallback((postulacionId: string) => {
    setFollowupPrefillPostulacionId(postulacionId);
    setIsFollowupModalOpen(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setIsFollowupModalOpen(false);
    setFollowupPrefillPostulacionId("");
  }, []);

  const alternar = useCallback(
    async (id: string) => {
      try {
        const updated = await opts.alternarEnviado(id);
        success(
          updated.enviado === 1
            ? "Tarea marcada como enviada"
            : "Tarea reactivada",
        );
      } catch (err) {
        error("Error al actualizar la tarea");
      }
    },
    [opts.alternarEnviado, success, error],
  );

  const crear = useCallback(
    async (data: SeguimientoSinId) => {
      try {
        await opts.crear(data);
        success("Nuevo seguimiento programado");
      } catch (err) {
        error("Error al crear seguimiento");
      }
    },
    [opts.crear, success, error],
  );

  const eliminar = useCallback(
    async (id: string) => {
      try {
        await opts.eliminar(id);
        success("Seguimiento eliminado");
      } catch (err) {
        error("Error al eliminar seguimiento");
      }
    },
    [opts.eliminar, success, error],
  );

  const registrar = useCallback(
    async (
      postulacionId: string,
      datos: DatosRegistroContacto,
      diasCadenciaSugerida?: number,
    ) => {
      try {
        await opts.registrarSeguimiento(
          postulacionId,
          datos,
          diasCadenciaSugerida,
        );
        await opts.refrescar();
        success("Contacto registrado y próximo contacto agendado");
      } catch (err) {
        error("Error al registrar el contacto");
        throw err;
      }
    },
    [opts.registrarSeguimiento, opts.refrescar, success, error],
  );

  return {
    isFollowupModalOpen,
    followupPrefillPostulacionId,
    abrirNuevaTarea,
    abrirTareaParaPostulacion,
    cerrarModal,
    alternar,
    crear,
    eliminar,
    registrar,
  };
}