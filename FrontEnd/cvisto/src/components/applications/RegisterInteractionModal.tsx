import React, { useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { Button } from "@/src/components/ui/Button";
import type { TipoSeguimiento } from "@/src/schemas/common";
import { Calendar, Send } from "lucide-react";

export interface DatosRegistroContacto {
  tipoSeguimiento: TipoSeguimiento;
  fecha: string;
  observaciones?: string;
  enviado?: 0 | 1;
}

interface RegisterInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresa: string;
  puesto: string;
  onSubmit: (
    datos: DatosRegistroContacto,
    diasCadenciaSugerida?: number
  ) => Promise<void>;
}

export const RegisterInteractionModal: React.FC<RegisterInteractionModalProps> = ({
  isOpen,
  onClose,
  empresa,
  puesto,
  onSubmit,
}) => {
  const [tipo, setTipo] = useState<TipoSeguimiento>("novedad");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [detalle, setDetalle] = useState("");
  const [enviado, setEnviado] = useState<0 | 1>(0);
  const [proximoContactoEnDias, setProximoContactoEnDias] = useState<number>(14);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          tipoSeguimiento: tipo,
          fecha,
          observaciones: detalle.trim() || undefined,
          enviado,
        },
        proximoContactoEnDias
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar contacto / seguimiento"
      description={`Registrá el contacto realizado con ${empresa} para actualizar las fechas de la postulación y agendar el próximo contacto.`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-[#121614] border border-white/[0.06] text-xs">
          <span className="text-[#A7B0AA]">Empresa:</span>{" "}
          <span className="font-semibold text-[#F2F5F3]">{empresa}</span>
          <span className="text-[#69736D] mx-2">•</span>
          <span className="text-[#A7B0AA]">Rol:</span>{" "}
          <span className="font-semibold text-[#4ADE80]">{puesto}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Select
            label="Tipo de seguimiento / contacto"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoSeguimiento)}
            options={[
              { value: "novedad", label: "✨ Novedad de perfil (proyectos, cursos)" },
              { value: "nuevo_proyecto", label: "💻 Nuevo proyecto publicado (GitHub)" },
              { value: "disponibilidad", label: "🟢 Disponibilidad laboral y estado" },
              { value: "recordatorio", label: "⏰ Revalidación de interés estratégico" },
              { value: "consulta", label: "💬 Consulta cordial de seguimiento" },
            ]}
          />

          <Input
            label="Fecha del contacto"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#A7B0AA]">
            Detalle de lo comunicado
          </label>
          <textarea
            rows={3}
            placeholder="Resumen del mensaje enviado, qué tecnologías mencionaste, puntos clave..."
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            className="w-full skeuo-input rounded-[10px] text-xs p-3 focus:outline-none placeholder:text-[#69736D]"
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
            Marcar como enviado (si el mail o mensaje ya fue despachado)
          </span>
        </label>

        <div className="p-3.5 rounded-xl bg-[#121614] border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#F2F5F3] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#22C55E]" /> Cadencia sugerida para el próximo contacto
            </span>
            <span className="text-xs font-mono text-[#4ADE80]">
              En {proximoContactoEnDias} días
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {[7, 10, 14, 21, 30].map((dias) => (
              <button
                key={dias}
                type="button"
                onClick={() => setProximoContactoEnDias(dias)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  proximoContactoEnDias === dias
                    ? "bg-[#22C55E] text-black font-semibold shadow-xs"
                    : "bg-[#181D1B] text-[#A7B0AA] hover:text-[#F2F5F3] border border-white/[0.05]"
                }`}
              >
                {dias} días
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.06] flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            leftIcon={<Send className="w-4 h-4 text-black" />}
          >
            {isSubmitting ? "Registrando..." : "Registrar seguimiento"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};