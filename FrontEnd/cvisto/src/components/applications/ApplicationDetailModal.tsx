import React, { useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import type { Postulacion } from "@/src/schemas/postulacion";
import type { Seguimiento } from "@/src/schemas/seguimiento";
import type { Empresa } from "@/src/schemas/empresa";
import type { EstadoPostulacion } from "@/src/schemas/common";
import {
  Building2,
  Briefcase,
  Calendar,
  Mail,
  Plus,
  Clock,
  FileText,
  Trash2,
  Edit3,
  Sparkles,
} from "lucide-react";
import { nombreEmpresa } from "@/src/lib/nombres";
import {
  DatosRegistroContacto,
  RegisterInteractionModal,
} from "./RegisterInteractionModal";

interface ApplicationDetailModalProps {
  postulacion: Postulacion | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: EstadoPostulacion) => void;
  onEdit: (p: Postulacion) => void;
  onDelete: (id: string) => void;
  onAddFollowup: (postulacionId: string) => void;
  onRegisterInteraction: (
    id: string,
    datos: DatosRegistroContacto,
    dias?: number
  ) => Promise<void>;
  linkedFollowups: Seguimiento[];
  empresas: Empresa[];
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  postulacion,
  isOpen,
  onClose,
  onUpdateStatus,
  onEdit,
  onDelete,
  onAddFollowup,
  onRegisterInteraction,
  linkedFollowups,
  empresas,
}) => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  if (!postulacion) return null;

  // Relationship timing calculation
  const hoy = new Date();
  const ultimoDate = postulacion.ultimoContacto ? new Date(postulacion.ultimoContacto) : null;
  const diasDesdeUltimo = ultimoDate
    ? Math.max(0, Math.floor((hoy.getTime() - ultimoDate.getTime()) / (1000 * 3600 * 24)))
    : null;

  const proxDate = postulacion.proximoContacto ? new Date(postulacion.proximoContacto) : null;
  const diasHastaProximo = proxDate
    ? Math.ceil((proxDate.getTime() - hoy.getTime()) / (1000 * 3600 * 24))
    : null;

  const empresa = empresas.find((e) => Number(e.id) === Number(postulacion.empresaId));
  const cadencia = empresa?.cadenciaContacto ?? 30;
  const empresaNombre = nombreEmpresa(empresas, postulacion.empresaId);

  const getRelationshipStatus = () => {
    if (diasDesdeUltimo === null) {
      return {
        label: "Sin contacto registrado",
        color: "text-[#A7B0AA] bg-white/[0.05] border-white/[0.1]",
        desc: "Comenzá registrando el envío de tu postulación.",
      };
    }
    if (diasDesdeUltimo <= 7) {
      return {
        label: "Contacto reciente / Al día",
        color: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30",
        desc: `Último contacto hace ${diasDesdeUltimo} días. Estás dentro de la ventana de espera natural.`,
      };
    }
    if (diasDesdeUltimo <= cadencia) {
      return {
        label: "Relación activa",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        desc: `Último contacto hace ${diasDesdeUltimo} días. Próximo contacto sugerido en ${diasHastaProximo ?? 0} días.`,
      };
    }
    return {
      label: "Momento ideal para enviar novedades",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      desc: `Han pasado ${diasDesdeUltimo} días desde el último contacto. Compartí un nuevo proyecto, avance o certificación para mantener presente tu perfil sin insistir.`,
    };
  };

  const relStatus = getRelationshipStatus();

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${empresaNombre} — ${postulacion.puesto}`}
        description="Expediente y gestión estratégica de relación con la empresa"
        maxWidth="xl"
      >
        <div className="space-y-6">
          {/* Header Bar: Status & Quick Status Picker */}
          <div className="p-4 rounded-xl bg-[#101412] border border-[#222A26] flex flex-wrap items-center justify-between gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#A7B0AA]">Estado del proceso:</span>
              <Badge estado={postulacion.estado} size="md" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#69736D]">Cambiar estado:</span>
              <select
                value={postulacion.estado}
                onChange={(e) =>
                  onUpdateStatus(postulacion.id, e.target.value as EstadoPostulacion)
                }
                className="bg-[#141817] text-xs font-medium text-[#F2F5F3] border border-[#2B3530] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#22C55E] cursor-pointer"
              >
                <option value="pendiente">● Pendiente</option>
                <option value="en_proceso">● En proceso</option>
                <option value="entrevista">● Entrevista</option>
                <option value="oferta">● Oferta</option>
                <option value="aceptado">● Aceptado</option>
                <option value="rechazado">● Rechazado</option>
                <option value="cancelado">● Cancelado</option>
              </select>
            </div>
          </div>

          {/* Strategic Relationship & Cadence Card */}
          <div className="p-4 rounded-xl bg-[#111613] border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.3)] space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#18201C] border border-[#232F28] text-[#22C55E]">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#F2F5F3]">
                    Estrategia de Relación & Cadencia
                  </h4>
                  <p className="text-[11px] text-[#A7B0AA]">
                    Transformá la insistencia en interés profesional compartiendo valor periódicamente
                  </p>
                </div>
              </div>

              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border self-start sm:self-auto ${relStatus.color}`}
              >
                {relStatus.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-lg bg-[#151B18] border border-white/[0.04]">
                <span className="text-[10px] text-[#69736D] uppercase font-semibold">
                  Último contacto
                </span>
                <p className="font-semibold text-[#F2F5F3] mt-0.5">
                  {postulacion.ultimoContacto || "Sin registrar"}
                </p>
                {diasDesdeUltimo !== null && (
                  <span className="text-[10px] text-[#A7B0AA]">
                    (hace {diasDesdeUltimo} {diasDesdeUltimo === 1 ? "día" : "días"})
                  </span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-[#151B18] border border-white/[0.04]">
                <span className="text-[10px] text-[#69736D] uppercase font-semibold">
                  Próximo contacto sugerido
                </span>
                <p className="font-semibold text-[#4ADE80] mt-0.5">
                  {postulacion.proximoContacto || "No programado"}
                </p>
                {diasHastaProximo !== null && (
                  <span className="text-[10px] text-[#A7B0AA]">
                    {diasHastaProximo > 0
                      ? `(en ${diasHastaProximo} días)`
                      : diasHastaProximo === 0
                      ? "(hoy)"
                      : `(hace ${Math.abs(diasHastaProximo)} días)`}
                  </span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-[#151B18] border border-white/[0.04]">
                <span className="text-[10px] text-[#69736D] uppercase font-semibold">
                  Cadencia objetivo
                </span>
                <p className="font-semibold text-[#F2F5F3] mt-0.5">
                  Cada {cadencia} días
                </p>
                <span className="text-[10px] text-[#A7B0AA]">
                  {postulacion.cantidadMailsEnviados} mails enviados
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#D1D9D4] leading-relaxed italic bg-black/20 p-2.5 rounded-lg border border-white/[0.03]">
              💡 {relStatus.desc}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsRegisterModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5 text-black" />}
                className="text-xs h-8"
              >
                Registrar contacto / seguimiento
              </Button>
            </div>
          </div>

          {/* Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-[#101412] border border-[#1E2622]">
              <span className="text-[11px] text-[#69736D] uppercase font-semibold">
                Modalidad
              </span>
              <p className="text-sm font-medium text-[#F2F5F3] mt-1 capitalize">
                {postulacion.modalidad ?? "No especificada"}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#101412] border border-[#1E2622]">
              <span className="text-[11px] text-[#69736D] uppercase font-semibold">
                Fecha de postulación
              </span>
              <p className="text-sm font-medium text-[#F2F5F3] mt-1">
                {postulacion.fechaPostulacion ?? "Sin registrar"}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#101412] border border-[#1E2622]">
              <span className="text-[11px] text-[#69736D] uppercase font-semibold">
                Interés
              </span>
              <p className="text-sm font-medium text-[#F2F5F3] mt-1 capitalize">
                {postulacion.interes}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#101412] border border-[#1E2622]">
              <span className="text-[11px] text-[#69736D] uppercase font-semibold">
                ¿Respondió?
              </span>
              <p className="text-sm font-medium text-[#F2F5F3] mt-1">
                {postulacion.respondio === 1 ? "Sí" : "Todavía no"}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#101412] border border-[#1E2622]">
              <span className="text-[11px] text-[#69736D] uppercase font-semibold">
                Fuente
              </span>
              <p className="text-sm font-medium text-[#F2F5F3] mt-1 truncate">
                {postulacion.fuente || "No registrada"}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#101412] border border-[#1E2622]">
              <span className="text-[11px] text-[#69736D] uppercase font-semibold">
                Mails enviados
              </span>
              <p className="text-sm font-medium text-[#F2F5F3] mt-1">
                {postulacion.cantidadMailsEnviados}
              </p>
            </div>
          </div>

          {/* Observaciones */}
          {postulacion.observaciones && (
            <div className="p-4 rounded-xl bg-[#101412] border border-[#222A26] space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A7B0AA] flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#22C55E]" /> Observaciones
              </h4>
              <p className="text-xs text-[#D1D9D4] whitespace-pre-line leading-relaxed">
                {postulacion.observaciones}
              </p>
            </div>
          )}

          {/* Linked Follow-ups */}
          <div className="p-4 rounded-xl bg-[#101412] border border-[#222A26] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A7B0AA] flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#22C55E]" /> Tareas de Seguimiento Agendadas
              </h4>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onAddFollowup(postulacion.id)}
                leftIcon={<Plus className="w-3 h-3" />}
                className="text-xs py-1 h-7"
              >
                Nueva tarea
              </Button>
            </div>

            {linkedFollowups.length === 0 ? (
              <p className="text-xs text-[#69736D] py-2">
                No tenés seguimientos agendados para esta postulación.
              </p>
            ) : (
              <div className="space-y-2">
                {linkedFollowups.map((f) => (
                  <div
                    key={f.id}
                    className="p-2.5 rounded-lg bg-[#141817] border border-[#1F2723] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p
                        className={`font-medium italic ${
                          f.enviado === 1 ? "line-through text-[#69736D]" : "text-[#F2F5F3]"
                        }`}
                      >
                        {f.observaciones?.split("\n")[0] ||
                          `Seguimiento – ${f.tipoSeguimiento.replace("_", " ")}`}
                      </p>
                      <span className="text-[11px] text-[#A7B0AA] uppercase">
                        {f.tipoSeguimiento.replace("_", " ")} — Fecha: {f.fechaProgramada}
                      </span>
                    </div>
                    {f.enviado === 1 ? (
                      <span className="text-[10px] text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded">
                        Enviado
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        Pendiente
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#222A26] flex items-center justify-between">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (window.confirm("¿Seguro que deseas eliminar esta postulación?")) {
                  onDelete(postulacion.id);
                  onClose();
                }
              }}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Eliminar
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(postulacion);
                }}
                leftIcon={<Edit3 className="w-4 h-4" />}
              >
                Editar datos
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Register Interaction Modal */}
      {isRegisterModalOpen && (
        <RegisterInteractionModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          empresa={empresaNombre}
          puesto={postulacion.puesto}
          onSubmit={async (datos, dias) => {
            await onRegisterInteraction(postulacion.id, datos, dias);
          }}
        />
      )}
    </>
  );
};