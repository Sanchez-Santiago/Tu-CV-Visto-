import React, { useState } from "react";
import { Check } from "lucide-react";
import type { Experiencia, ExperienciaSinId } from "@/src/schemas/experiencia";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";

interface ExperienciaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  inicial: Experiencia | null;
  onSubmit: (data: ExperienciaSinId) => Promise<void>;
}

export const ExperienciaFormModal: React.FC<ExperienciaFormModalProps> = ({
  isOpen,
  onClose,
  inicial,
  onSubmit,
}) => {
  const [empresa, setEmpresa] = useState("");
  const [puesto, setPuesto] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [trabajoActual, setTrabajoActual] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setEmpresa(inicial?.empresa ?? "");
      setPuesto(inicial?.puesto ?? "");
      setFechaInicio(inicial?.fechaInicio ?? "");
      setFechaFin(inicial?.fechaFin ?? "");
      setTrabajoActual(!inicial?.fechaFin);
      setDescripcion(inicial?.descripcion ?? "");
      setGuardando(false);
    }
  }, [isOpen, inicial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa.trim() || !puesto.trim()) return;
    setGuardando(true);
    try {
      await onSubmit({
        empresa: empresa.trim(),
        puesto: puesto.trim(),
        fechaInicio: fechaInicio || null,
        fechaFin: trabajoActual ? null : fechaFin || null,
        descripcion: descripcion.trim() || null,
      });
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={inicial ? "Editar experiencia" : "Nueva experiencia"}
      description="Registrá un puesto laboral para tu perfil."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Empresa"
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          required
        />
        <Input
          label="Puesto"
          value={puesto}
          onChange={(e) => setPuesto(e.target.value)}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#A7B0AA]">Desde</label>
            <input
              type="month"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full skeuo-input rounded-lg text-sm px-3 py-2.5 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#A7B0AA]">Hasta</label>
            <input
              type="month"
              value={trabajoActual ? "" : fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              disabled={trabajoActual}
              className="w-full skeuo-input rounded-lg text-sm px-3 py-2.5 focus:outline-none disabled:opacity-40"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={trabajoActual}
            onChange={(e) => setTrabajoActual(e.target.checked)}
            className="accent-[#22C55E] w-4 h-4 rounded"
          />
          <span className="text-xs font-medium text-[#F2F5F3]">
            Trabajo actual
          </span>
        </label>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#A7B0AA]">Descripción</label>
          <textarea
            rows={4}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Responsabilidades, logros, stack utilizado..."
            className="w-full skeuo-input rounded-lg text-sm p-3 focus:outline-none placeholder:text-[#69736D]"
          />
        </div>
        <div className="pt-3 border-t border-white/[0.06] flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={guardando}
            leftIcon={<Check className="w-4 h-4 text-black" />}
          >
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
};