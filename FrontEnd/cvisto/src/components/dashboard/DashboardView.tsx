import React from "react";
import { 
  Send, 
  Activity, 
  Video, 
  Award, 
  Plus
} from "lucide-react";
import type { Postulacion } from "@/src/schemas/postulacion";
import type { Seguimiento } from "@/src/schemas/seguimiento";
import type { Email } from "@/src/schemas/email";
import type { Empresa } from "@/src/schemas/empresa";
import type { Usuario } from "@/src/schemas/usuario";
import { StatsCard } from "./StatsCard";
import { ActivityChart } from "./ActivityChart";
import { FollowUpWidget } from "./FollowUpWidget";
import { RecentApplications } from "./RecentApplications";
import { Button } from "@/src/components/ui/Button";

interface DashboardViewProps {
  usuario: Usuario;
  postulaciones: Postulacion[];
  emails: Email[];
  seguimientos: Seguimiento[];
  empresas: Empresa[];
  onToggleEnviado: (id: string) => void;
  onSelectApplication: (p: Postulacion) => void;
  onNavigate: (view: "postulaciones" | "seguimientos" | "empresas") => void;
  onOpenNewApplicationModal: () => void;
  onOpenNewFollowupModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  usuario,
  postulaciones,
  emails,
  seguimientos,
  empresas,
  onToggleEnviado,
  onSelectApplication,
  onNavigate,
  onOpenNewApplicationModal,
  onOpenNewFollowupModal,
}) => {
  const totalPostulaciones = postulaciones.length;
  const enProceso = postulaciones.filter((p) => p.estado === "en_proceso").length;
  const entrevistas = postulaciones.filter((p) => p.estado === "entrevista").length;
  const ofertas = postulaciones.filter((p) => p.estado === "oferta" || p.estado === "aceptado").length;
  const pendientesSeguimiento = seguimientos.filter((s) => s.enviado === 0).length;

  return (
    <div className="space-y-6">
      {/* Workspace Header Panel: Section 31 - "Buen día, Santiago | Resumen de tu búsqueda laboral | ● Conectado" */}
      <div className="p-6 rounded-[16px] skeuo-surface flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-[#F2F5F3] font-['Inter']">
              Buen día, {usuario.nombre}
            </h2>
          </div>
          <p className="text-sm text-[#A7B0AA] mt-1 font-normal">
            Resumen de tu búsqueda laboral
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#121614] border border-white/[0.06] text-xs text-[#A7B0AA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            <span className="font-medium text-[#F2F5F3]">Conectado</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={onOpenNewApplicationModal}
            leftIcon={<Plus className="w-4 h-4 text-[#080A09]" />}
          >
            Nueva postulación
          </Button>
        </div>
      </div>

      {/* Bento Grid Row 1: Section 31 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Postulaciones"
          value={totalPostulaciones}
          change="Total registradas"
          dotColor="bg-[#22C55E]"
          icon={<Send className="w-4 h-4 text-[#22C55E]" />}
          onClick={() => onNavigate("postulaciones")}
        />
        <StatsCard
          label="En proceso"
          value={enProceso}
          change="Avance activo"
          dotColor="bg-[#60A5FA]"
          icon={<Activity className="w-4 h-4 text-[#60A5FA]" />}
          onClick={() => onNavigate("postulaciones")}
        />
        <StatsCard
          label="Entrevistas"
          value={entrevistas}
          change="En calendario"
          dotColor="bg-[#A78BFA]"
          icon={<Video className="w-4 h-4 text-[#A78BFA]" />}
          onClick={() => onNavigate("postulaciones")}
        />
        <StatsCard
          label="Ofertas"
          value={ofertas}
          change="Propuestas"
          dotColor="bg-[#FBBF24]"
          icon={<Award className="w-4 h-4 text-[#FBBF24]" />}
          onClick={() => onNavigate("postulaciones")}
        />
      </div>

      {/* Bento Grid Row 2: Actividad (7 cols) + Seguimientos (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 h-full">
          <ActivityChart
            postulaciones={postulaciones}
            emails={emails}
          />
        </div>
        <div className="lg:col-span-5 h-full">
          <FollowUpWidget
            seguimientos={seguimientos}
            postulaciones={postulaciones}
            empresas={empresas}
            onToggleEnviado={onToggleEnviado}
            onNavigateToFollowups={() => onNavigate("seguimientos")}
            onOpenNewTask={onOpenNewFollowupModal}
          />
        </div>
      </div>

      {/* Bento Grid Row 3: Últimas Postulaciones */}
      <div>
        <RecentApplications
          postulaciones={postulaciones}
          empresas={empresas}
          onSelectApplication={onSelectApplication}
          onNavigateToApplications={() => onNavigate("postulaciones")}
        />
      </div>
    </div>
  );
};
