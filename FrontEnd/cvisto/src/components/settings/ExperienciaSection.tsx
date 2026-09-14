import React from "react";
import { Plus, Pencil, Trash2, Briefcase } from "lucide-react";
import type { Experiencia } from "@/src/schemas/experiencia";
import { Button } from "@/src/components/ui/Button";
import { rangoMeses } from "./dateUtils";

interface ExperienciaSectionProps {
  data: Experiencia[];
  onAgregar: () => void;
  onEditar: (exp: Experiencia) => void;
  onEliminar: (id: string) => void;
}

export const ExperienciaSection: React.FC<ExperienciaSectionProps> = ({
  data,
  onAgregar,
  onEditar,
  onEliminar,
}) => (
  <div className="skeuo-surface p-6 space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#181D1B] border border-[#222A26] flex items-center justify-center text-[#22C55E]">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#F2F5F3]">
            Experiencia laboral
          </h3>
          <p className="text-xs text-[#A7B0AA] mt-0.5">
            Tu trayectoria profesional para tus postulaciones
          </p>
        </div>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={onAgregar}
        leftIcon={<Plus className="w-4 h-4 text-black" />}
      >
        Agregar
      </Button>
    </div>

    {data.length === 0 ? (
      <p className="text-xs text-[#69736D] py-2">
        Todavía no registraste experiencias laborales.
      </p>
    ) : (
      <div className="space-y-2">
        {data.map((exp) => (
          <div
            key={exp.id}
            className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[#101412] border border-[#222A26]"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#F2F5F3]">
                {exp.puesto}
              </p>
              <p className="text-xs text-[#4ADE80]">{exp.empresa}</p>
              <p className="text-[11px] text-[#69736D] mt-0.5">
                {rangoMeses(exp.fechaInicio, exp.fechaFin)}
              </p>
              {exp.descripcion && (
                <p className="text-xs text-[#8A968F] mt-1 line-clamp-2">
                  {exp.descripcion}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEditar(exp)}
                className="p-2 text-[#69736D] hover:text-[#4ADE80] rounded-lg hover:bg-[#22C55E]/10 transition-colors cursor-pointer"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onEliminar(exp.id)}
                className="p-2 text-[#69736D] hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);