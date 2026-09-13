import React from "react";
import { CheckCircle2, Circle, Clock, ArrowRight, Plus } from "lucide-react";
import type { Seguimiento } from "@/src/schemas/seguimiento";
import type { Postulacion } from "@/src/schemas/postulacion";
import type { Empresa } from "@/src/schemas/empresa";
import { nombreEmpresa } from "@/src/lib/nombres";

interface FollowUpWidgetProps {
  seguimientos: Seguimiento[];
  postulaciones: Postulacion[];
  empresas: Empresa[];
  onToggleEnviado: (id: string) => void;
  onNavigateToFollowups: () => void;
  onOpenNewTask: () => void;
}

export const FollowUpWidget: React.FC<FollowUpWidgetProps> = ({
  seguimientos,
  postulaciones,
  empresas,
  onToggleEnviado,
  onNavigateToFollowups,
  onOpenNewTask,
}) => {
  const pending = seguimientos.filter((s) => s.enviado === 0).slice(0, 4);

  const postInfo = (s: Seguimiento) => {
    const p = postulaciones.find((post) => Number(post.id) === Number(s.postulacionId));
    const empresa = p ? nombreEmpresa(empresas, p.empresaId) : "";
    return { empresa };
  };

  return (
    <div className="skeuo-surface p-5 sm:p-6 rounded-[16px] flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.05]">
        <div>
          <h3 className="text-sm font-semibold text-[#F2F5F3] tracking-tight">
            Seguimientos
          </h3>
          <p className="text-xs text-[#A7B0AA] mt-0.5 flex items-center gap-1.5">
            <span>Hoy</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-[#F2F5F3] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              {pending.length} pendientes
            </span>
          </p>
        </div>

        <button
          onClick={onOpenNewTask}
          className="p-1.5 rounded-[8px] bg-[#121614] border border-white/[0.06] text-[#A7B0AA] hover:text-[#22C55E] hover:border-[#22C55E]/20 transition-colors"
          title="Agregar seguimiento"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="my-3 space-y-2.5 overflow-y-auto max-h-[190px]">
        {pending.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#69736D]">
            <CheckCircle2 className="w-7 h-7 mx-auto text-[#22C55E]/30 mb-2" />
            Sin tareas pendientes para hoy.
          </div>
        ) : (
          pending.map((item) => {
            const { empresa } = postInfo(item);
            const resumen =
              item.observaciones?.split("\n")[0] ||
              item.tipoSeguimiento.replace("_", " ");
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-[12px] bg-[#121614] border border-white/[0.06] hover:border-white/[0.1] transition-colors group"
              >
                <button
                  onClick={() => onToggleEnviado(item.id)}
                  className="mt-0.5 text-[#69736D] hover:text-[#22C55E] transition-colors shrink-0 cursor-pointer"
                  title="Marcar como enviado"
                >
                  {item.enviado === 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  ) : (
                    <Circle className="w-4 h-4 hover:stroke-[#22C55E]" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#F2F5F3] leading-snug line-clamp-2">
                    {resumen}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[#A7B0AA]">
                    {empresa && <span className="font-semibold text-[#4ADE80]">{empresa}</span>}
                    {empresa && <span>•</span>}
                    <span className="flex items-center gap-1 text-[#69736D]">
                      <Clock className="w-3 h-3 text-[#69736D]" />
                      {item.fechaProgramada}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
        <button
          onClick={onOpenNewTask}
          className="inline-flex items-center gap-1.5 text-xs text-[#A7B0AA] hover:text-[#F2F5F3] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Nueva tarea
        </button>
        <button
          onClick={onNavigateToFollowups}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#22C55E] hover:text-[#4ADE80] transition-colors cursor-pointer"
        >
          Ver agenda completa <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};