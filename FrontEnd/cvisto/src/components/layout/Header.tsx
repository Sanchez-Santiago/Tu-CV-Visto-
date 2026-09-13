import React from "react";
import { 
  Menu, 
  Plus, 
  Search, 
  Bell, 
  Sparkles,
  Calendar,
  RefreshCw
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu: () => void;
  onOpenNewApplicationModal: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  urgentFollowupsCount: number;
  onQuickNavigateFollowups: () => void;
  onActualizar?: () => void;
  actualizando?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  onOpenNewApplicationModal,
  searchQuery,
  onSearchChange,
  urgentFollowupsCount,
  onQuickNavigateFollowups,
  onActualizar,
  actualizando = false,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-[#080A09]/90 backdrop-blur-md border-b border-white/[0.06] px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4 select-none">
      {/* Left: Mobile trigger & view title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden text-[#A7B0AA] hover:text-[#F2F5F3] p-2 rounded-[10px] bg-[#141817] border border-white/[0.08]"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-[#F2F5F3] tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-[#A7B0AA] hidden sm:block font-normal">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Search, Quick notification pill & Primary CTA */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Global Search Input */}
        <div className="relative hidden md:flex items-center w-52 lg:w-64">
          <Search className="absolute left-3 w-4 h-4 text-[#69736D] pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar empresa, puesto..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full skeuo-input rounded-[11px] text-xs py-2 pl-9 pr-7 text-[#F2F5F3] placeholder:text-[#69736D] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 text-xs text-[#69736D] hover:text-[#F2F5F3]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Urgent followups indicator */}
        {urgentFollowupsCount > 0 && (
          <button
            onClick={onQuickNavigateFollowups}
            title={`${urgentFollowupsCount} tareas pendientes de seguimiento`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-[#121614] border border-white/[0.06] text-xs text-[#A7B0AA] hover:text-[#F2F5F3] hover:border-white/[0.12] transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            <span className="font-medium text-[#F2F5F3]">{urgentFollowupsCount}</span>
            <span className="text-[11px] text-[#A7B0AA]">pendientes</span>
          </button>
        )}

        {/* Global Actualizar button */}
        {onActualizar && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onActualizar}
            isLoading={actualizando}
            disabled={!onActualizar}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            title="Sincronizar Gmail y actualizar datos"
            className="whitespace-nowrap"
          >
            <span className="hidden xs:inline">{actualizando ? "Actualizando..." : "Actualizar"}</span>
            <span className="xs:hidden">Act</span>
          </Button>
        )}

        {/* Primary Action Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewApplicationModal}
          leftIcon={<Plus className="w-4 h-4 text-[#080A09]" />}
          className="whitespace-nowrap"
        >
          <span className="hidden xs:inline">Nueva postulación</span>
          <span className="xs:hidden">Nueva</span>
        </Button>
      </div>
    </header>
  );
};
