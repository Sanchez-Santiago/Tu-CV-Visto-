import React from "react";
import { MapPin, Calendar, Trash2, Edit2 } from "lucide-react";
import type { Postulacion } from "@/src/schemas/postulacion";
import type { Empresa } from "@/src/schemas/empresa";
import type { EstadoPostulacion } from "@/src/schemas/common";
import { Badge } from "@/src/components/ui/Badge";
import { nombreEmpresa } from "@/src/lib/nombres";
import { OPCIONES_ESTADO } from "@/src/lib/estados";

interface ApplicationCardProps {
  postulacion: Postulacion;
  empresas: Empresa[];
  onSelect: (p: Postulacion) => void;
  onEdit: (p: Postulacion) => void;
  onDelete: (id: string) => void;
  onQuickStatusChange: (id: string, newEstado: EstadoPostulacion) => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  postulacion,
  empresas,
  onSelect,
  onEdit,
  onDelete,
  onQuickStatusChange,
}) => {
  const empresa = nombreEmpresa(empresas, postulacion.empresaId);

  return (
    <div
      onClick={() => onSelect(postulacion)}
      className="p-5 rounded-xl skeuo-card-interactive flex flex-col justify-between group relative overflow-hidden"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#101412] border border-[#26312B] flex items-center justify-center font-bold text-sm text-[#F2F5F3] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] group-hover:border-[#22C55E]/40 group-hover:text-[#22C55E] transition-colors">
              {empresa.charAt(0)}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#F2F5F3] group-hover:text-[#4ADE80] transition-colors line-clamp-1">
                {empresa}
              </h4>
              <p className="text-xs text-[#A7B0AA] font-medium line-clamp-1">
                {postulacion.puesto}
              </p>
            </div>
          </div>

          <Badge estado={postulacion.estado} size="sm" />
        </div>

        <div className="mt-4 pt-3 border-t border-[#1F2723] grid grid-cols-2 gap-2 text-xs text-[#A7B0AA]">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#69736D] shrink-0" />
            <span className="capitalize truncate">
              {postulacion.modalidad ?? "no especificada"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="w-3.5 h-3.5 text-[#69736D] shrink-0" />
            <span className="truncate">{postulacion.fechaPostulacion ?? "—"}</span>
          </div>
        </div>

        {postulacion.observaciones && (
          <p className="mt-3 text-xs text-[#69736D] line-clamp-2 italic bg-[#101412]/60 p-2 rounded border border-[#1E2521]">
            "{postulacion.observaciones}"
          </p>
        )}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-4 pt-3 border-t border-[#1C2320] flex items-center justify-between"
      >
        <select
          value={postulacion.estado}
          onChange={(e) =>
            onQuickStatusChange(postulacion.id, e.target.value as EstadoPostulacion)
          }
          className="bg-[#101412] text-[11px] text-[#A7B0AA] hover:text-[#F2F5F3] border border-[#232C28] rounded px-2 py-1 focus:outline-none focus:border-[#22C55E] cursor-pointer"
        >
          {OPCIONES_ESTADO.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(postulacion)}
            className="p-1.5 text-[#69736D] hover:text-[#F2F5F3] rounded hover:bg-[#181D1B] transition-colors"
            title="Editar postulación"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(postulacion.id)}
            className="p-1.5 text-[#69736D] hover:text-rose-400 rounded hover:bg-[#2A1517] transition-colors"
            title="Eliminar postulación"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};