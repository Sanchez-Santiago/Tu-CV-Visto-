import React, { useState, useEffect } from "react";
import { Modal } from "@/src/components/ui/Modal";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { Button } from "@/src/components/ui/Button";
import type { Empresa } from "@/src/schemas/empresa";
import type { PostulacionSinId } from "@/src/schemas/postulacion";
import type { Postulacion } from "@/src/schemas/postulacion";
import type {
  EstadoPostulacion,
  Interes,
  Modalidad,
} from "@/src/schemas/common";
import { Check, Briefcase } from "lucide-react";
import { OPCIONES_ESTADO } from "@/src/lib/estados";

interface ApplicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PostulacionSinId) => Promise<void>;
  initialData?: Postulacion | null;
  empresas: Empresa[];
  prefill?: {
    empresaId?: number;
    fechaPostulacion?: string;
    fuente?: string;
  } | null;
}

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  empresas,
  prefill = null,
}) => {
  const isEditing = Boolean(initialData);

  const [empresaId, setEmpresaId] = useState<number>(0);
  const [puesto, setPuesto] = useState("");
  const [modalidad, setModalidad] = useState<Modalidad>("remoto");
  const [estado, setEstado] = useState<EstadoPostulacion>("pendiente");
  const [interes, setInteres] = useState<Interes>("medio");
  const [respondio, setRespondio] = useState<0 | 1>(0);
  const [fuente, setFuente] = useState("");
  const [fechaPostulacion, setFechaPostulacion] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [observaciones, setObservaciones] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (initialData) {
      setEmpresaId(initialData.empresaId);
      setPuesto(initialData.puesto);
      setModalidad(initialData.modalidad ?? "remoto");
      setEstado(initialData.estado);
      setInteres(initialData.interes);
      setRespondio(initialData.respondio as 0 | 1);
      setFuente(initialData.fuente ?? "");
      setFechaPostulacion(initialData.fechaPostulacion ?? new Date().toISOString().split("T")[0]);
      setObservaciones(initialData.observaciones ?? "");
    } else {
      setEmpresaId(
        prefill?.empresaId ??
          (empresas[0]?.id ? Number(empresas[0].id) : 0)
      );
      setPuesto("");
      setModalidad("remoto");
      setEstado("pendiente");
      setInteres("medio");
      setRespondio(0);
      setFuente(prefill?.fuente ?? "");
      setFechaPostulacion(
        prefill?.fechaPostulacion ?? new Date().toISOString().split("T")[0]
      );
      setObservaciones("");
    }
    setErrors({});
    setIsSuccess(false);
  }, [initialData, isOpen, prefill, empresas]);

  useEffect(() => {
    if (!initialData && !empresaId && empresas.length > 0) {
      setEmpresaId(Number(empresas[0].id));
    }
  }, [empresas, initialData, empresaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!empresaId) {
      setErrors({ empresaId: "Seleccioná una empresa." });
      return;
    }

    const formData: PostulacionSinId = {
      usuarioId: 0,
      empresaId,
      puesto: puesto.trim(),
      modalidad,
      respondio,
      estado,
      interes,
      fuente: fuente.trim() || null,
      cantidadMailsEnviados: initialData?.cantidadMailsEnviados ?? 0,
      fechaPostulacion: fechaPostulacion || null,
      ultimoContacto: initialData?.ultimoContacto ?? null,
      proximoContacto: initialData?.proximoContacto ?? null,
      observaciones: observaciones.trim() || null,
    };

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(false);
        onClose();
      }, 500);
    } catch (err) {
      setIsSubmitting(false);
      setErrors({ general: "Error al guardar la postulación." });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar postulación" : "Nueva postulación"}
      description="Registra una nueva oportunidad laboral en tu Digital Workspace."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg">
            {errors.general}
          </div>
        )}

        {/* Row 1: Empresa & Puesto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#A7B0AA]">
              Empresa <span className="text-[#22C55E]">*</span>
            </label>
            <select
              value={empresaId || ""}
              onChange={(e) => setEmpresaId(Number(e.target.value))}
              className={`w-full skeuo-input rounded-lg text-sm p-2.5 focus:outline-none ${
                errors.empresaId ? "border-rose-500/60" : ""
              }`}
            >
              <option value="" disabled>
                Seleccioná una empresa...
              </option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
            {errors.empresaId && (
              <p className="text-[11px] text-rose-400">{errors.empresaId}</p>
            )}
            {empresas.length === 0 && (
              <p className="text-[11px] text-[#69736D]">
                Creá una empresa primero en la sección Empresas.
              </p>
            )}
          </div>

          <Input
            label="Puesto / Posición"
            placeholder="Ej: IT Support Analyst"
            value={puesto}
            onChange={(e) => setPuesto(e.target.value)}
            error={errors.puesto}
            leftIcon={<Briefcase className="w-4 h-4" />}
            required
          />
        </div>

        {/* Row 2: Modalidad & Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Select
            label="Modalidad"
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value as Modalidad)}
            options={[
              { value: "presencial", label: "Presencial" },
              { value: "remoto", label: "Remoto" },
              { value: "hibrido", label: "Híbrido" },
              { value: "no_especificado", label: "No especificado" },
            ]}
          />

          <Select
            label="Estado inicial"
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoPostulacion)}
            options={OPCIONES_ESTADO}
          />
        </div>

        {/* Row 3: Interés & ¿Respondió? */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Select
            label="Interés"
            value={interes}
            onChange={(e) => setInteres(e.target.value as Interes)}
            options={[
              { value: "alto", label: "Alto" },
              { value: "medio", label: "Medio" },
              { value: "bajo", label: "Bajo" },
            ]}
          />

          <Select
            label="¿La empresa respondió?"
            value={String(respondio)}
            onChange={(e) => setRespondio(e.target.value === "1" ? 1 : 0)}
            options={[
              { value: "0", label: "No" },
              { value: "1", label: "Sí" },
            ]}
          />
        </div>

        {/* Row 4: Fecha & Fuente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Fecha de postulación"
            type="date"
            value={fechaPostulacion}
            onChange={(e) => setFechaPostulacion(e.target.value)}
            required
          />

          <Input
            label="Fuente"
            placeholder="Ej: LinkedIn, Portal de empleo, Referido"
            value={fuente}
            onChange={(e) => setFuente(e.target.value)}
          />
        </div>

        {/* Row 5: Observaciones */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#A7B0AA]">
            Observaciones
          </label>
          <textarea
            rows={3}
            placeholder="Detalles sobre requisitos técnicos, preguntas de la entrevista o impresiones..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full skeuo-input rounded-lg text-sm p-3 focus:outline-none placeholder:text-[#69736D]"
          />
        </div>

        {/* Footer Buttons */}
        <div className="pt-4 border-t border-[#222A26] flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={isSuccess ? <Check className="w-4 h-4 text-black" /> : undefined}
          >
            {isSuccess
              ? "✓ Guardado"
              : isSubmitting
              ? "Guardando..."
              : isEditing
              ? "Actualizar postulación"
              : "Guardar postulación"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};