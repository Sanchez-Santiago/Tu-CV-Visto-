import React, { useState, useMemo } from "react";
import {
  Plus,
  LayoutList,
  LayoutGrid,
  Kanban,
  Briefcase,
  Mail,
  Trash2,
  X,
  CalendarClock,
} from "lucide-react";
import type { Postulacion } from "@/src/schemas/postulacion";
import type { Empresa } from "@/src/schemas/empresa";
import type { EstadoPostulacion, TipoSeguimiento } from "@/src/schemas/common";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { SearchInput } from "@/src/components/ui/SearchInput";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ApplicationTable } from "./ApplicationTable";
import { ApplicationCard } from "./ApplicationCard";
import { Badge } from "@/src/components/ui/Badge";
import { nombreEmpresa } from "@/src/lib/nombres";
import { OPCIONES_ESTADO } from "@/src/lib/estados";
import { LinkedEmailsModal } from "@/src/components/emails/LinkedEmailsModal";
import type { Email } from "@/src/schemas/email";
import type { Firma } from "@/src/schemas/firma";

const TIPOS_SEGUIMIENTO: { value: TipoSeguimiento; label: string }[] = [
  { value: "novedad", label: "✨ Novedad de perfil" },
  { value: "nuevo_proyecto", label: "💻 Nuevo proyecto" },
  { value: "disponibilidad", label: "🟢 Disponibilidad" },
  { value: "recordatorio", label: "⏰ Recordatorio" },
  { value: "consulta", label: "💬 Consulta" },
];

interface ApplicationsViewProps {
  postulaciones: Postulacion[];
  empresas: Empresa[];
  emails?: Email[];
  firmas?: Firma[];
  onSelectApplication: (p: Postulacion) => void;
  onEditApplication: (p: Postulacion) => void;
  onDeleteApplication: (id: string) => void;
  onQuickStatusChange: (id: string, newEstado: EstadoPostulacion) => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkStatusChange: (ids: string[], estado: EstadoPostulacion) => Promise<void>;
  onBulkProgramar: (
    ids: string[],
    datos: {
      fechaProgramada: string;
      tipoSeguimiento: TipoSeguimiento;
      observaciones?: string | null;
    },
  ) => Promise<void>;
  onOpenNewModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onComposeEmail?: (prefill: {
    destinatario: string;
    asunto: string;
    cuerpo: string;
  }) => void;
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  postulaciones,
  empresas,
  emails = [],
  firmas = [],
  onSelectApplication,
  onEditApplication,
  onDeleteApplication,
  onQuickStatusChange,
  onBulkDelete,
  onBulkStatusChange,
  onBulkProgramar,
  onOpenNewModal,
  searchQuery,
  onSearchChange,
  onComposeEmail,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<"table" | "cards" | "kanban">("table");
  const [linkedEmailsPostulacion, setLinkedEmailsPostulacion] = useState<Postulacion | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [bulkEstado, setBulkEstado] = useState<EstadoPostulacion>("en_proceso");
  const [bulkConfirmarBorrado, setBulkConfirmarBorrado] = useState(false);
  const [bulkProgramarAbierto, setBulkProgramarAbierto] = useState(false);
  const [bulkFecha, setBulkFecha] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [bulkTipo, setBulkTipo] = useState<TipoSeguimiento>("novedad");
  const [bulkObs, setBulkObs] = useState("");
  const [ejecutandoBulk, setEjecutandoBulk] = useState(false);

  const filterTabs = [
    { id: "todos", label: "Todos", count: postulaciones.length },
    {
      id: "pendiente",
      label: "Pendientes",
      count: postulaciones.filter((p) => p.estado === "pendiente").length,
    },
    {
      id: "en_proceso",
      label: "En proceso",
      count: postulaciones.filter((p) => p.estado === "en_proceso").length,
    },
    {
      id: "entrevista",
      label: "Entrevistas",
      count: postulaciones.filter((p) => p.estado === "entrevista").length,
    },
    {
      id: "oferta",
      label: "Ofertas",
      count: postulaciones.filter((p) => p.estado === "oferta").length,
    },
    {
      id: "aceptado",
      label: "Aceptados",
      count: postulaciones.filter((p) => p.estado === "aceptado").length,
    },
    {
      id: "rechazado",
      label: "Rechazados",
      count: postulaciones.filter((p) => p.estado === "rechazado").length,
    },
  ];

  // Filtering
  const filteredPostulaciones = useMemo(() => {
    return postulaciones.filter((item) => {
      const empresa = nombreEmpresa(empresas, item.empresaId).toLowerCase();
      const matchesSearch =
        empresa.includes(searchQuery.toLowerCase()) ||
        item.puesto.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "todos" ? true : item.estado === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [postulaciones, empresas, searchQuery, selectedStatus]);

  // Kanban columns definition
  const kanbanColumns: { id: EstadoPostulacion; title: string }[] = [
    { id: "pendiente", title: "Pendiente" },
    { id: "en_proceso", title: "En Proceso" },
    { id: "entrevista", title: "Entrevista" },
    { id: "oferta", title: "Oferta" },
  ];

  // Selección múltiple
  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTodosFiltrados = () => {
    setSeleccionados((prev) => {
      const ids = filteredPostulaciones.map((p) => p.id);
      const todosMarcados =
        ids.length > 0 && ids.every((id) => prev.has(id));
      if (todosMarcados) return new Set();
      return new Set(ids);
    });
  };

  const limpiarSeleccion = () => setSeleccionados(new Set());

  const idsSeleccionados = useMemo(
    () => filteredPostulaciones.filter((p) => seleccionados.has(p.id)).map((p) => p.id),
    [filteredPostulaciones, seleccionados],
  );

  const ejecutarBulk = async (accion: () => Promise<void>) => {
    setEjecutandoBulk(true);
    try {
      await accion();
      limpiarSeleccion();
    } finally {
      setEjecutandoBulk(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <SectionHeader
        title="Postulaciones"
        subtitle="Gestioná cada etapa de tu proceso de selección laboral"
        actions={
          <>
            {/* View switcher */}
            <div className="flex items-center p-1 rounded-lg bg-[#101412] border border-[#232C28]">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded transition-all ${
                  viewMode === "table"
                    ? "bg-[#181D1B] text-[#22C55E] shadow-xs"
                    : "text-[#69736D] hover:text-[#A7B0AA]"
                }`}
                title="Vista de Tabla"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded transition-all ${
                  viewMode === "cards"
                    ? "bg-[#181D1B] text-[#22C55E] shadow-xs"
                    : "text-[#69736D] hover:text-[#A7B0AA]"
                }`}
                title="Vista de Tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 rounded transition-all ${
                  viewMode === "kanban"
                    ? "bg-[#181D1B] text-[#22C55E] shadow-xs"
                    : "text-[#69736D] hover:text-[#A7B0AA]"
                }`}
                title="Tablero Kanban"
              >
                <Kanban className="w-4 h-4" />
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={onOpenNewModal}
              leftIcon={<Plus className="w-4 h-4 text-black" />}
            >
              Nueva
            </Button>
          </>
        }
      />

      {/* Search and Filters Section */}
      <div className="skeuo-surface p-4 space-y-3.5">
        {/* Search input */}
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="🔎 Buscar empresa o puesto..."
        />

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => {
            const isSelected = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-[#181D1B] text-[#F2F5F3] border border-[#2B3631] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.4)]"
                    : "text-[#A7B0AA] hover:text-[#F2F5F3] hover:bg-[#141817] border border-transparent"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-[#22C55E]/20 text-[#4ADE80] font-semibold"
                      : "bg-[#101412] text-[#69736D]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk action bar */}
      {seleccionados.size > 0 && (
        <div className="skeuo-surface p-3 flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-[#F2F5F3] bg-[#22C55E]/15 border border-[#22C55E]/30 rounded-full px-2.5 py-1">
            {seleccionados.size} seleccionada(s)
          </span>

          <select
            value={bulkEstado}
            onChange={(e) => setBulkEstado(e.target.value as EstadoPostulacion)}
            className="bg-[#101412] text-xs text-[#F2F5F3] border border-[#2A3530] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#22C55E] cursor-pointer"
            title="Cambiar estado de las seleccionadas"
          >
            {OPCIONES_ESTADO.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            disabled={ejecutandoBulk}
            onClick={() =>
              ejecutarBulk(() => onBulkStatusChange(idsSeleccionados, bulkEstado))
            }
          >
            Cambiar estado
          </Button>

          <Button
            variant="secondary"
            size="sm"
            disabled={ejecutandoBulk}
            onClick={() => setBulkProgramarAbierto(true)}
            leftIcon={<CalendarClock className="w-3.5 h-3.5" />}
          >
            Programar contacto
          </Button>

          <Button
            variant="danger"
            size="sm"
            disabled={ejecutandoBulk}
            onClick={() => setBulkConfirmarBorrado(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Borrar
          </Button>

          <button
            type="button"
            onClick={limpiarSeleccion}
            className="ml-auto p-1.5 rounded text-[#69736D] hover:text-[#F2F5F3] hover:bg-[#181D1B] transition-colors"
            title="Limpiar selección"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {filteredPostulaciones.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-10 h-10 mx-auto text-[#69736D]" />}
          title="No se encontraron postulaciones"
          description={
            searchQuery
              ? `No hay coincidencias para "${searchQuery}". Probá cambiando los términos de búsqueda.`
              : "No hay postulaciones con el filtro seleccionado."
          }
          centered
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onSearchChange("");
                setSelectedStatus("todos");
              }}
            >
              Limpiar filtros
            </Button>
          }
        />
      ) : viewMode === "kanban" ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const colApps = filteredPostulaciones.filter((p) => p.estado === col.id);
            return (
              <div
                key={col.id}
                className="skeuo-surface p-3.5 flex flex-col min-h-[420px] bg-[#0E1210]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#1F2723] mb-3">
                  <div className="flex items-center gap-2">
                    <Badge estado={col.id} size="sm" />
                  </div>
                  <span className="text-xs text-[#69736D] font-semibold bg-[#141817] px-2 py-0.5 rounded border border-[#232C28]">
                    {colApps.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colApps.map((p) => {
                    const empresa = nombreEmpresa(empresas, p.empresaId);
                    return (
                    <div
                      key={p.id}
                      onClick={() => onSelectApplication(p)}
                      className="p-3.5 rounded-lg bg-[#141817] border border-[#242E28] hover:border-[#22C55E]/40 hover:bg-[#181D1B] transition-all cursor-pointer shadow-xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#F2F5F3] group-hover:text-[#4ADE80] transition-colors">
                          {empresa}
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={seleccionados.has(p.id)}
                            onChange={() => toggleSeleccion(p.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-3.5 h-3.5 rounded accent-[#22C55E] cursor-pointer"
                            title="Seleccionar postulación"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLinkedEmailsPostulacion(p);
                            }}
                            className="p-1 rounded hover:bg-[#1C2320] text-[#69736D] hover:text-[#22C55E] transition-colors"
                            title="Ver emails vinculados"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] text-[#69736D]">
                            {(p.fechaPostulacion ?? "").slice(5)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-[#A7B0AA] mt-1 font-medium line-clamp-1">
                        {p.puesto}
                      </p>
                    </div>
                    );
                  })}
                  {colApps.length === 0 && (
                    <div className="h-24 border border-dashed border-[#1F2723] rounded-lg flex items-center justify-center text-[11px] text-[#69736D]">
                      Sin aplicaciones
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === "cards" ? (
        /* Cards Grid View (Digital Workspace Cards) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPostulaciones.map((p) => (
            <ApplicationCard
              key={p.id}
              postulacion={p}
              empresas={empresas}
              onSelect={onSelectApplication}
              onEdit={onEditApplication}
              onDelete={onDeleteApplication}
              onQuickStatusChange={onQuickStatusChange}
              onViewEmails={setLinkedEmailsPostulacion}
              seleccionado={seleccionados.has(p.id)}
              onToggleSeleccion={toggleSeleccion}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <ApplicationTable
          postulaciones={filteredPostulaciones}
          empresas={empresas}
          onSelect={onSelectApplication}
          onEdit={onEditApplication}
          onDelete={onDeleteApplication}
          onQuickStatusChange={onQuickStatusChange}
          onViewEmails={setLinkedEmailsPostulacion}
          seleccionados={seleccionados}
          onToggleSeleccion={toggleSeleccion}
          onToggleTodos={toggleTodosFiltrados}
        />
      )}

      {/* Modal de emails vinculados */}
      <LinkedEmailsModal
        isOpen={Boolean(linkedEmailsPostulacion)}
        onClose={() => setLinkedEmailsPostulacion(null)}
        title={
          linkedEmailsPostulacion
            ? `${linkedEmailsPostulacion.puesto} — ${nombreEmpresa(
                empresas,
                linkedEmailsPostulacion.empresaId,
              )}`
            : ""
        }
        subtitle="Correos asociados a este proceso de postulación"
        firmas={firmas}
        emails={
          linkedEmailsPostulacion
            ? emails.filter(
                (e) =>
                  Number(e.postulacionId) === Number(linkedEmailsPostulacion.id),
              )
            : []
        }
        onComposeEmail={onComposeEmail}
      />

      {/* Confirmar borrado en lote */}
      <Modal
        isOpen={bulkConfirmarBorrado}
        onClose={() => setBulkConfirmarBorrado(false)}
        title="Borrar postulaciones"
        description={`Esta acción eliminará ${seleccionados.size} postulación(es) del workspace.`}
      >
        <div className="space-y-4">
          <p className="text-xs text-[#A7B0AA] leading-relaxed">
            ¿Estás seguro? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setBulkConfirmarBorrado(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={ejecutandoBulk}
              onClick={() => {
                setBulkConfirmarBorrado(false);
                void ejecutarBulk(() => onBulkDelete(idsSeleccionados));
              }}
            >
              Borrar {seleccionados.size}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Programar contacto en lote */}
      <Modal
        isOpen={bulkProgramarAbierto}
        onClose={() => setBulkProgramarAbierto(false)}
        title="Programar contacto"
        description={`Crea una tarea de seguimiento pendiente para cada una de las ${seleccionados.size} postulación(es) seleccionada(s). No envía mails.`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-[#A7B0AA] font-medium">
                Fecha programada
              </span>
              <input
                type="date"
                value={bulkFecha}
                onChange={(e) => setBulkFecha(e.target.value)}
                className="mt-1 w-full skeuo-input rounded-[10px] text-xs py-2 px-3 text-[#F2F5F3] focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-[#A7B0AA] font-medium">
                Tipo de contacto
              </span>
              <select
                value={bulkTipo}
                onChange={(e) => setBulkTipo(e.target.value as TipoSeguimiento)}
                className="mt-1 w-full bg-[#101412] text-xs text-[#F2F5F3] border border-[#2A3530] rounded-[10px] px-3 py-2 focus:outline-none focus:border-[#22C55E] cursor-pointer"
              >
                {TIPOS_SEGUIMIENTO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-[#A7B0AA] font-medium">
              Observaciones (opcional)
            </span>
            <textarea
              value={bulkObs}
              onChange={(e) => setBulkObs(e.target.value)}
              rows={3}
              placeholder="Notas para estos seguimientos..."
              className="mt-1 w-full skeuo-input rounded-[10px] text-xs py-2 px-3 text-[#F2F5F3] placeholder:text-[#69736D] focus:outline-none resize-none"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setBulkProgramarAbierto(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={ejecutandoBulk || !bulkFecha}
              onClick={() => {
                setBulkProgramarAbierto(false);
                void ejecutarBulk(() =>
                  onBulkProgramar(idsSeleccionados, {
                    fechaProgramada: bulkFecha,
                    tipoSeguimiento: bulkTipo,
                    observaciones: bulkObs.trim() || null,
                  }),
                );
              }}
            >
              Programar {seleccionados.size}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
