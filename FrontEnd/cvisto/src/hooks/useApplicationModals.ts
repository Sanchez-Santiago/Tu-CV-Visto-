import { useCallback, useState } from "react";
import type { Postulacion, PostulacionSinId } from "@/src/schemas/postulacion";
import type { EstadoPostulacion } from "@/src/schemas/common";
import type { Email } from "@/src/schemas/email";
import type { Empresa } from "@/src/schemas/empresa";
import { nombreEmpresa, empresaIdDesdeDominio } from "@/src/lib/nombres";
import { useToast } from "@/src/components/ui/Toast";

interface PrefillAppForm {
  empresaId?: number;
  fechaPostulacion?: string;
  fuente?: string;
}

export function useApplicationModals(opts: {
  crearPostulacion: (data: PostulacionSinId) => Promise<Postulacion>;
  actualizarPostulacion: (
    id: string,
    cambios: Partial<PostulacionSinId>,
  ) => Promise<Postulacion>;
  eliminarPostulacion: (id: string) => Promise<void>;
  cambiarEstadoPostulacion: (
    id: string,
    estado: EstadoPostulacion,
  ) => Promise<Postulacion>;
  actualizarEmailPostulacion: (
    id: string,
    cambios: Partial<import("@/src/schemas/email").EmailSinId>,
  ) => Promise<Email>;
  empresas: Empresa[];
}) {
  const { success, error } = useToast();
  const [isAppFormOpen, setIsAppFormOpen] = useState(false);
  const [editingApplication, setEditingApplication] =
    useState<Postulacion | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<Postulacion | null>(null);
  const [appFormPrefill, setAppFormPrefill] = useState<PrefillAppForm | null>(
    null,
  );
  const [appFormPrefillEmail, setAppFormPrefillEmail] = useState<Email | null>(
    null,
  );

  const abrirNuevo = useCallback(() => {
    setEditingApplication(null);
    setAppFormPrefill(null);
    setAppFormPrefillEmail(null);
    setIsAppFormOpen(true);
  }, []);

  const abrirEdicion = useCallback((p: Postulacion) => {
    setEditingApplication(p);
    setAppFormPrefill(null);
    setAppFormPrefillEmail(null);
    setIsAppFormOpen(true);
  }, []);

  const cerrarForm = useCallback(() => {
    setIsAppFormOpen(false);
    setEditingApplication(null);
    setAppFormPrefill(null);
    setAppFormPrefillEmail(null);
  }, []);

  const guardar = useCallback(
    async (data: PostulacionSinId) => {
      try {
        if (editingApplication) {
          const updated = await opts.actualizarPostulacion(
            editingApplication.id,
            data,
          );
          if (selectedApplication?.id === updated.id) {
            setSelectedApplication(updated);
          }
          success(
            `Postulación a ${nombreEmpresa(opts.empresas, updated.empresaId)} actualizada`,
          );
        } else {
          const created = await opts.crearPostulacion(data);
          if (appFormPrefillEmail) {
            await opts.actualizarEmailPostulacion(appFormPrefillEmail.id, {
              postulacionId: Number(created.id),
            });
            setAppFormPrefillEmail(null);
            setAppFormPrefill(null);
            success(
              `Postulación a ${nombreEmpresa(opts.empresas, created.empresaId)} registrada y email vinculado`,
            );
          } else {
            success(
              `Postulación a ${nombreEmpresa(opts.empresas, created.empresaId)} registrada exitosamente`,
            );
          }
        }
      } catch (err) {
        error("No se pudo guardar la postulación");
        throw err;
      }
    },
    [
      editingApplication,
      selectedApplication,
      appFormPrefillEmail,
      opts.actualizarPostulacion,
      opts.crearPostulacion,
      opts.actualizarEmailPostulacion,
      opts.empresas,
      success,
      error,
    ],
  );

  const crearDesdeEmail = useCallback(
    (email: Email) => {
      setEditingApplication(null);
      setAppFormPrefillEmail(email);
      setAppFormPrefill({
        empresaId: empresaIdDesdeDominio(opts.empresas, email.remitente),
        fechaPostulacion: email.fecha.slice(0, 10),
        fuente: "Email",
      });
      setIsAppFormOpen(true);
    },
    [opts.empresas],
  );

  const cambiarEstado = useCallback(
    async (id: string, newEstado: EstadoPostulacion) => {
      try {
        const updated = await opts.cambiarEstadoPostulacion(id, newEstado);
        if (selectedApplication?.id === id) {
          setSelectedApplication(updated);
        }
        success(`Estado actualizado a "${newEstado.replace("_", " ")}"`);
      } catch (err) {
        error("Error al cambiar de estado");
      }
    },
    [selectedApplication, opts.cambiarEstadoPostulacion, success, error],
  );

  const eliminar = useCallback(
    async (id: string) => {
      try {
        await opts.eliminarPostulacion(id);
        if (selectedApplication?.id === id) {
          setSelectedApplication(null);
        }
        success("Postulación eliminada del workspace");
      } catch (err) {
        error("No se pudo eliminar la postulación");
      }
    },
    [selectedApplication, opts.eliminarPostulacion, success, error],
  );

  return {
    isAppFormOpen,
    editingApplication,
    selectedApplication,
    appFormPrefill,
    appFormPrefillEmail,
    setSelectedApplication,
    abrirNuevo,
    abrirEdicion,
    cerrarForm,
    guardar,
    crearDesdeEmail,
    cambiarEstado,
    eliminar,
  };
}