import React, { useState } from "react";
import { Check } from "lucide-react";
import type { Proyecto, ProyectoSinId } from "@/src/schemas/proyecto";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";

interface ProyectoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  inicial: Proyecto | null;
  onSubmit: (data: ProyectoSinId) => Promise<void>;
}

export const ProyectoFormModal: React.FC<ProyectoFormModalProps> = ({
  isOpen,
  onClose,
  inicial,
  onSubmit,
}) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tecnologias, setTecnologias] = useState("");
  const [url, setUrl] = useState("");
  const [guardando, setGuardando] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setNombre(inicial?.nombre ?? "");
      setDescripcion(inicial?.descripcion ?? "");
      setTecnologias((inicial?.tecnologias ?? []).join(", "));
      setUrl(inicial?.url ?? "");
      setGuardando(false);
    }
  }, [isOpen, inicial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setGuardando(true);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        tecnologias: tecnologias
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        url: url.trim() || null,
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
      title={inicial ? "Editar proyecto" : "Nuevo proyecto"}
      description="Agregá un proyecto a tu perfil profesional."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#A7B0AA]">Descripción</label>
          <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Qué hace el proyecto, tu rol, resultados..."
            className="w-full skeuo-input rounded-lg text-sm p-3 focus:outline-none placeholder:text-[#69736D]"
          />
        </div>
        <Input
          label="Tecnologías"
          value={tecnologias}
          onChange={(e) => setTecnologias(e.target.value)}
          placeholder="React, Node, SQL... (separadas por coma)"
        />
        <Input
          label="URL"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/usuario/proyecto"
        />
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