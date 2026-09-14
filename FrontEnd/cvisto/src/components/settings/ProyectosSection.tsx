import React from "react";
import { Plus, Pencil, Trash2, FolderKanban } from "lucide-react";
import type { Proyecto } from "@/src/schemas/proyecto";
import { Button } from "@/src/components/ui/Button";

interface ProyectosSectionProps {
  data: Proyecto[];
  onAgregar: () => void;
  onEditar: (proyecto: Proyecto) => void;
  onEliminar: (id: string) => void;
}

export const ProyectosSection: React.FC<ProyectosSectionProps> = ({
  data,
  onAgregar,
  onEditar,
  onEliminar,
}) => (
  <div className="skeuo-surface p-6 space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#181D1B] border border-[#222A26] flex items-center justify-center text-[#22C55E]">
          <FolderKanban className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#F2F5F3]">Proyectos</h3>
          <p className="text-xs text-[#A7B0AA] mt-0.5">
            Trabajos personales o freelance para mostrar
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
        Todavía no registraste proyectos.
      </p>
    ) : (
      <div className="space-y-2">
        {data.map((p) => (
          <div
            key={p.id}
            className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[#101412] border border-[#222A26]"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#F2F5F3]">{p.nombre}</p>
              {p.descripcion && (
                <p className="text-xs text-[#8A968F] mt-0.5 line-clamp-2">
                  {p.descripcion}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(p.tecnologias ?? []).map((tec) => (
                  <span
                    key={tec}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#4ADE80] border border-[#22C55E]/20"
                  >
                    {tec}
                  </span>
                ))}
              </div>
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-400 underline mt-1 inline-block"
                >
                  {p.url}
                </a>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEditar(p)}
                className="p-2 text-[#69736D] hover:text-[#4ADE80] rounded-lg hover:bg-[#22C55E]/10 transition-colors cursor-pointer"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onEliminar(p.id)}
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