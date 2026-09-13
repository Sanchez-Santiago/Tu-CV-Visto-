import React from "react";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users2,
  CalendarClock,
  Mail,
  BarChart3,
  Settings,
  Target,
  X,
} from "lucide-react";
import type { Usuario } from "@/src/schemas/usuario";

export type NavView =
  | "dashboard"
  | "postulaciones"
  | "empresas"
  | "contactos"
  | "seguimientos"
  | "emails"
  | "estrategia"
  | "estadisticas"
  | "configuracion";

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  usuario: Usuario;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingFollowupsCount: number;
  activeAppsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  usuario,
  isOpenMobile,
  onCloseMobile,
  pendingFollowupsCount,
  activeAppsCount,
}) => {
  const navSections = [
    {
      title: "PRINCIPAL",
      items: [
        {
          id: "dashboard" as NavView,
          label: "Dashboard",
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: "postulaciones" as NavView,
          label: "Postulaciones",
          icon: <Briefcase className="w-4 h-4" />,
          badge: activeAppsCount > 0 ? activeAppsCount : undefined,
        },
        {
          id: "empresas" as NavView,
          label: "Empresas",
          icon: <Building2 className="w-4 h-4" />,
        },
        {
          id: "contactos" as NavView,
          label: "Contactos",
          icon: <Users2 className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "GESTIÓN",
      items: [
        {
          id: "seguimientos" as NavView,
          label: "Seguimientos",
          icon: <CalendarClock className="w-4 h-4" />,
          badge: pendingFollowupsCount > 0 ? pendingFollowupsCount : undefined,
          badgeColor: "bg-[#22C55E]/20 text-[#4ADE80] border-[#22C55E]/30",
        },
        {
          id: "emails" as NavView,
          label: "Emails",
          icon: <Mail className="w-4 h-4" />,
        },
        {
          id: "estrategia" as NavView,
          label: "Estrategia",
          icon: <Target className="w-4 h-4" />,
          badgeColor: "bg-[#22C55E]/20 text-[#4ADE80] border-[#22C55E]/30",
        },
      ],
    },
    {
      title: "ANÁLISIS",
      items: [
        {
          id: "estadisticas" as NavView,
          label: "Estadísticas",
          icon: <BarChart3 className="w-4 h-4" />,
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0D100F] border-r border-white/[0.06] select-none">
      {/* Brand Logo Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          {/* Logo Mark: Physical recessed surface with subtle green light */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-[10px] bg-[#121614] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.5)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-[#F2F5F3] font-['Inter']">
              CVisto
            </span>
            <span className="block text-[10px] uppercase font-medium tracking-wider text-[#A7B0AA] -mt-0.5">
              Workspace
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden text-[#A7B0AA] hover:text-[#F2F5F3] p-1.5 rounded-[10px] hover:bg-[#181D1B]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#69736D]">
              {section.title}
            </span>
            <div className="space-y-1 mt-1">
              {section.items.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-sm font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-[#22C55E]/[0.08] text-[#F2F5F3] border border-[#22C55E]/[0.15] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                        : "text-[#A7B0AA] hover:text-[#F2F5F3] hover:bg-[#141817]/60 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? "text-[#22C55E]" : "text-[#69736D]"}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                          item.badgeColor ||
                          "bg-white/[0.04] text-[#A7B0AA] border-white/[0.06]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Profile & Configuration */}
      <div className="p-3.5 border-t border-white/[0.05] space-y-2 bg-[#0B0E0D]">
        <button
          onClick={() => {
            onNavigate("configuracion");
            onCloseMobile();
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm font-medium transition-colors ${
            currentView === "configuracion"
              ? "bg-[#22C55E]/[0.08] text-[#F2F5F3] border border-[#22C55E]/[0.15]"
              : "text-[#A7B0AA] hover:text-[#F2F5F3] hover:bg-[#141817]"
          }`}
        >
          <Settings className="w-4 h-4 text-[#69736D]" />
          <span>Configuración</span>
        </button>

        {/* User Card with Physical Surface and '● Conectado' dot */}
        <div className="flex items-center gap-3 p-2.5 rounded-[12px] bg-[#121614] border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_2px_8px_rgba(0,0,0,0.3)]">
          <div className="w-8 h-8 rounded-full bg-[#181D1B] border border-white/[0.08] flex items-center justify-center text-xs font-semibold text-[#22C55E] shrink-0">
            {usuario.nombre.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#F2F5F3] truncate">
              {usuario.nombre}
            </p>
            <p className="text-[11px] text-[#A7B0AA] truncate flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              Conectado
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (270px) */}
      <aside className="hidden lg:block w-[270px] shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-[270px] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
