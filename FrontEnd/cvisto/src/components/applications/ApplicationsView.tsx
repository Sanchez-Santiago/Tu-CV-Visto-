import React, { useState, useMemo } from "react";
import { 
  Plus, 
  LayoutList, 
  LayoutGrid, 
  Kanban,
  Briefcase
} from "lucide-react";
import type { Postulacion } from "@/src/schemas/postulacion";
import type { Empresa } from "@/src/schemas/empresa";
import type { EstadoPostulacion } from "@/src/schemas/common";
import { Button } from "@/src/components/ui/Button";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { SearchInput } from "@/src/components/ui/SearchInput";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ApplicationTable } from "./ApplicationTable";
import { ApplicationCard } from "./ApplicationCard";
import { Badge } from "@/src/components/ui/Badge";
import { nombreEmpresa } from "@/src/lib/nombres";

interface ApplicationsViewProps {
  postulaciones: Postulacion[];
  empresas: Empresa[];
  onSelectApplication: (p: Postulacion) => void;
  onEditApplication: (p: Postulacion) => void;
  onDeleteApplication: (id: string) => void;
  onQuickStatusChange: (id: string, newEstado: EstadoPostulacion) => void;
  onOpenNewModal: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  postulaciones,
  empresas,
  onSelectApplication,
  onEditApplication,
  onDeleteApplication,
  onQuickStatusChange,
  onOpenNewModal,
  searchQuery,
  onSearchChange,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<"table" | "cards" | "kanban">("table");

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
                        <span className="text-[10px] text-[#69736D]">
                          {(p.fechaPostulacion ?? "").slice(5)}
                        </span>
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
        />
      )}
    </div>
  );
};
