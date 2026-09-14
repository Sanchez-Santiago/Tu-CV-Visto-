import React, { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Plus,
  Calendar,
  Trash2,
  Sparkles,
  Github,
  BellRing,
  MessageSquare,
} from "lucide-react";
import type { Seguimiento } from "@/src/schemas/seguimiento";
import type { Postulacion } from "@/src/schemas/postulacion";
import type { Empresa } from "@/src/schemas/empresa";
import type { TipoSeguimiento } from "@/src/schemas/common";
import { Button } from "@/src/components/ui/Button";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { nombreEmpresa } from "@/src/lib/nombres";
import { TIPO_SEGUIMIENTO_LABELS } from "@/src/lib/estados";
import { postulacionVista } from "@/src/lib/postulaciones";

interface FollowupsViewProps {
  seguimientos: Seguimiento[];
  postulaciones: Postulacion[];
  empresas: Empresa[];
  onToggleEnviado: (id: string) => void;
  onDeleteFollowup: (id: string) => void;
  onOpenNewTaskModal: () => void;
}

const getTipoIcon = (tipo: TipoSeguimiento) => {
  switch (tipo) {
    case "novedad":
      return <Sparkles className="w-4 h-4 text-[#22C55E]" />;
    case "nuevo_proyecto":
      return <Github className="w-4 h-4 text-emerald-300" />;
    case "disponibilidad":
      return <CheckCircle2 className="w-4 h-4 text-teal-400" />;
    case "recordatorio":
      return <BellRing className="w-4 h-4 text-lime-400" />;
    case "consulta":
      return <MessageSquare className="w-4 h-4 text-cyan-400" />;
    default:
      return <CalendarClock className="w-4 h-4 text-[#A7B0AA]" />;
  }
};

const getTipoLabel = (tipo: TipoSeguimiento) => TIPO_SEGUIMIENTO_LABELS[tipo];

export const FollowupsView: React.FC<FollowupsViewProps> = ({
  seguimientos,
  postulaciones,
  empresas,
  onToggleEnviado,
  onDeleteFollowup,
  onOpenNewTaskModal,
}) => {
  const [filter, setFilter] = useState<"pendientes" | "estrategicos" | "todas" | "enviados">("pendientes");

  const postInfo = (f: Seguimiento) =>
    postulacionVista(f.postulacionId, postulaciones, empresas);

  const filtered = seguimientos.filter((s) => {
    if (filter === "pendientes") return s.enviado === 0;
    if (filter === "estrategicos") {
      return ["novedad", "nuevo_proyecto", "disponibilidad", "recordatorio", "consulta"].includes(
        s.tipoSeguimiento
      ) && s.enviado === 0;
    }
    if (filter === "enviados") return s.enviado === 1;
    return true;
  });

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Seguimientos & Estrategia de Contacto"
        subtitle="Mantené una relación periódica con empresas compartiendo valor, proyectos y disponibilidad"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenNewTaskModal}
            leftIcon={<Plus className="w-4 h-4 text-black" />}
          >
            Nuevo contacto / tarea
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 p-1 rounded-xl bg-[#101412] border border-white/[0.06] w-fit">
        <button
          onClick={() => setFilter("pendientes")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filter === "pendientes"
              ? "bg-[#181D1B] text-[#22C55E] shadow-xs"
              : "text-[#A7B0AA] hover:text-[#F2F5F3]"
          }`}
        >
          Pendientes ({seguimientos.filter((s) => s.enviado === 0).length})
        </button>
        <button
          onClick={() => setFilter("estrategicos")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            filter === "estrategicos"
              ? "bg-[#181D1B] text-[#22C55E] shadow-xs"
              : "text-[#A7B0AA] hover:text-[#F2F5F3]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Relación (
          {seguimientos.filter(
            (s) =>
              ["novedad", "nuevo_proyecto", "disponibilidad", "recordatorio", "consulta"].includes(
                s.tipoSeguimiento
              ) && s.enviado === 0
          ).length}
          )
        </button>
        <button
          onClick={() => setFilter("todas")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filter === "todas"
              ? "bg-[#181D1B] text-[#F2F5F3] shadow-xs"
              : "text-[#A7B0AA] hover:text-[#F2F5F3]"
          }`}
        >
          Todas ({seguimientos.length})
        </button>
        <button
          onClick={() => setFilter("enviados")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filter === "enviados"
              ? "bg-[#181D1B] text-[#F2F5F3] shadow-xs"
              : "text-[#A7B0AA] hover:text-[#F2F5F3]"
          }`}
        >
          Enviados ({seguimientos.filter((s) => s.enviado === 1).length})
        </button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-10 h-10 mx-auto text-[#22C55E]/50" />}
            title="No hay tareas en esta vista"
            description="Agendá un nuevo contacto periódico o novedad para mantener presente tu postulación."
            compact
          />
        ) : (
          filtered.map((item) => {
            const { empresa } = postInfo(item);
            const esEnviado = item.enviado === 1;
            const resumen = item.observaciones?.split("\n")[0];
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl skeuo-card-interactive flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  esEnviado ? "opacity-60 bg-[#101412]" : ""
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => onToggleEnviado(item.id)}
                    className="mt-0.5 text-[#69736D] hover:text-[#22C55E] transition-colors shrink-0 cursor-pointer p-0.5"
                    title={esEnviado ? "Marcar como pendiente" : "Marcar como enviado"}
                  >
                    {esEnviado ? (
                      <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                    ) : (
                      <Circle className="w-5 h-5 hover:stroke-[#22C55E]" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="p-1 rounded bg-[#181D1B] border border-white/[0.06] shrink-0">
                        {getTipoIcon(item.tipoSeguimiento)}
                      </span>
                      <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-md bg-white/[0.04] text-[#A7B0AA] border border-white/[0.05]">
                        {getTipoLabel(item.tipoSeguimiento)}
                      </span>
                      <h4
                        className={`text-sm font-semibold truncate ${
                          esEnviado ? "line-through text-[#A7B0AA]" : "text-[#F2F5F3]"
                        }`}
                      >
                        {resumen ||
                          `${getTipoLabel(item.tipoSeguimiento)} para ${empresa}`}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#A7B0AA]">
                      <span className="font-semibold text-[#4ADE80]">{empresa}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#69736D]" />
                        {item.fechaProgramada}
                        {item.fechaEnvio && ` (enviado: ${item.fechaEnvio})`}
                      </span>
                    </div>

                    {item.observaciones && (
                      <p className="text-xs text-[#8A968F] pt-1 italic line-clamp-2">
                        "{item.observaciones}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => onDeleteFollowup(item.id)}
                    className="p-2 text-[#69736D] hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Eliminar tarea"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};