import React from "react";
import { 
  Clock, 
  Activity, 
  Video, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Ban,
  Tag
} from "lucide-react";
import { EstadoPostulacion } from "@/src/types/schemas";

interface BadgeProps {
  estado?: EstadoPostulacion;
  label?: string;
  variant?: "neutral" | "success" | "warning" | "info" | "danger" | "purple";
  size?: "sm" | "md";
  className?: string;
}

export const estadoConfig: Record<
  EstadoPostulacion,
  {
    label: string;
    dotColor: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    icon: React.ReactNode;
  }
> = {
  pendiente: {
    label: "Pendiente",
    dotColor: "bg-[#9CA3AF]",
    bgColor: "bg-white/[0.04]",
    borderColor: "border-white/[0.08]",
    textColor: "text-[#9CA3AF]",
    icon: <Clock className="w-3 h-3 text-[#9CA3AF]" />,
  },
  en_proceso: {
    label: "En proceso",
    dotColor: "bg-[#60A5FA]",
    bgColor: "bg-[#60A5FA]/[0.08]",
    borderColor: "border-[#60A5FA]/25",
    textColor: "text-[#60A5FA]",
    icon: <Activity className="w-3 h-3 text-[#60A5FA]" />,
  },
  entrevista: {
    label: "Entrevista",
    dotColor: "bg-[#A78BFA]",
    bgColor: "bg-[#A78BFA]/[0.08]",
    borderColor: "border-[#A78BFA]/25",
    textColor: "text-[#A78BFA]",
    icon: <Video className="w-3 h-3 text-[#A78BFA]" />,
  },
  oferta: {
    label: "Oferta",
    dotColor: "bg-[#FBBF24]",
    bgColor: "bg-[#FBBF24]/[0.08]",
    borderColor: "border-[#FBBF24]/25",
    textColor: "text-[#FBBF24]",
    icon: <Sparkles className="w-3 h-3 text-[#FBBF24]" />,
  },
  aceptado: {
    label: "Aceptado",
    dotColor: "bg-[#22C55E]",
    bgColor: "bg-[#22C55E]/[0.08]",
    borderColor: "border-[#22C55E]/25",
    textColor: "text-[#22C55E]",
    icon: <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />,
  },
  rechazado: {
    label: "Rechazado",
    dotColor: "bg-[#F87171]",
    bgColor: "bg-[#F87171]/[0.08]",
    borderColor: "border-[#F87171]/25",
    textColor: "text-[#F87171]",
    icon: <XCircle className="w-3 h-3 text-[#F87171]" />,
  },
  cancelado: {
    label: "Cancelado",
    dotColor: "bg-[#6B7280]",
    bgColor: "bg-[#6B7280]/[0.06]",
    borderColor: "border-[#6B7280]/20",
    textColor: "text-[#6B7280]",
    icon: <Ban className="w-3 h-3 text-[#6B7280]" />,
  },
};

export const Badge: React.FC<BadgeProps> = ({
  estado,
  label,
  variant = "neutral",
  size = "md",
  className = "",
}) => {
  if (estado && estadoConfig[estado]) {
    const config = estadoConfig[estado];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border font-medium whitespace-nowrap select-none shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${
          config.bgColor
        } ${config.borderColor} ${config.textColor} ${
          size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs"
        } ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} shrink-0`} />
        <span>{config.label}</span>
      </span>
    );
  }

  // Custom general badge
  const variantStyles = {
    neutral: "bg-white/[0.04] border-white/[0.08] text-[#9CA3AF]",
    success: "bg-[#22C55E]/[0.08] border-[#22C55E]/25 text-[#22C55E]",
    warning: "bg-[#FBBF24]/[0.08] border-[#FBBF24]/25 text-[#FBBF24]",
    info: "bg-[#60A5FA]/[0.08] border-[#60A5FA]/25 text-[#60A5FA]",
    danger: "bg-[#F87171]/[0.08] border-[#F87171]/25 text-[#F87171]",
    purple: "bg-[#A78BFA]/[0.08] border-[#A78BFA]/25 text-[#A78BFA]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border font-medium whitespace-nowrap select-none ${
        variantStyles[variant]
      } ${size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs"} ${className}`}
    >
      <Tag className="w-2.5 h-2.5 opacity-70" />
      <span>{label}</span>
    </span>
  );
};
