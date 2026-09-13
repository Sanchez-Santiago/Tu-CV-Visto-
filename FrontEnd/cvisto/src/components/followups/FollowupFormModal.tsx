import React, { useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { Button } from "@/src/components/ui/Button";
import type { SeguimientoSinId } from "@/src/schemas/seguimiento";
import type { Postulacion } from "@/src/schemas/postulacion";
import type { Empresa } from "@/src/schemas/empresa";
import type { TipoSeguimiento } from "@/src/schemas/common";
import { Calendar } from "lucide-react";
import { nombreEmpresa } from "@/src/lib/nombres";

interface FollowupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SeguimientoSinId) => Promise<void>;
  prefilledPostulacionId?: string;
  postulaciones: Postulacion[];
  empresas: Empresa[];
}

export const FollowupFormModal: React.FC<FollowupFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prefilledPostulacionId = "",
  postulaciones,
  empresas,
}) => {
  const [postulacionId, setPostulacionId] = useState(prefilledPostulacionId);
  const [tipo, setTipo] = useState<TipoSeguimiento>("novedad");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [enviado, setEnviado] = useState<0 | 1>(0);
  const [observaciones, setObservaciones] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postulacionId) return;

    await onSubmit({
      postulacionId: Number(postulacionId),
      fechaProgramada: fecha,
      tipoSeguimiento: tipo,
      enviado,
      requiereAprobacion: 1,
      fechaEnvio: null,
      observaciones: observaciones.trim() || null,
    });

    setPostulacionId("");
    setObservaciones("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo contacto / seguimiento estratégico"
      description="Planificá el envío periódico de novedades, proyectos o recordatorios para mantener el interés."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Postulación vinculada"
          value={postulacionId}
          onChange={(e) => setPostulacionId(e.target.value)}
          required
          options={[
            { value: "", label: "Seleccionar postulación..." },
            ...postulaciones.map((p) => ({
              value: p.id,
              label: `${nombreEmpresa(empresas, p.empresaId)} — ${p.puesto}`,
            })),
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Select
            label="Tipo de contacto / seguimiento"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoSeguimiento)}
            options={[
              { value: "novedad", label: "✨ Novedad de perfil (avance / aprendizaje)" },
              { value: "nuevo_proyecto", label: "💻 Nuevo proyecto (GitHub / portfolio)" },
              { value: "disponibilidad", label: "🟢 Disponibilidad laboral y estado" },
              { value: "recordatorio", label: "⏰ Recordatorio periódico (cadencia)" },
              { value: "consulta", label: "💬 Consulta estratégica de seguimiento" },
            ]}
          />

          <Input
            label="Fecha programada"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enviado === 1}
            onChange={(e) => setEnviado(e.target.checked ? 1 : 0)}
            className="accent-[#22C55E] w-4 h-4 rounded"
          />
          <span className="text-xs font-medium text-[#F2F5F3]">
            Ya fue enviado (se marcará como completo)
          </span>
        </label>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#A7B0AA]">
            Notas o detalles del contacto
          </label>
          <textarea
            rows={2}
            placeholder="Detalles de la novedad a compartir, tecnologías, enlaces, o lo que respondió la empresa..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full skeuo-input rounded-[10px] text-xs p-3 focus:outline-none placeholder:text-[#69736D]"
          />
        </div>

        <div className="pt-3 border-t border-white/[0.06] flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Calendar className="w-4 h-4 text-black" />}
          >
            Guardar contacto / tarea
          </Button>
        </div>
      </form>
    </Modal>
  );
};