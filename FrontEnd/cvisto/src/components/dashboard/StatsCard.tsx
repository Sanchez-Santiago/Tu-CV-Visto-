import React from "react";
import { ArrowUpRight, TrendingUp } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number | string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  accentColor?: string;
  dotColor?: string;
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  change,
  isPositive = true,
  icon,
  accentColor = "text-[#22C55E]",
  dotColor = "bg-[#22C55E]",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-[16px] skeuo-card-interactive flex flex-col justify-between overflow-hidden group ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#A7B0AA]">
          {label}
        </span>
        <div className="p-2 rounded-[10px] bg-[#121614] border border-white/[0.06] text-[#A7B0AA] group-hover:text-[#F2F5F3] transition-colors">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-[32px] font-semibold tracking-tight text-[#F2F5F3] font-['Inter'] leading-none">
          {value}
        </span>
        {change && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#A7B0AA]">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            {change}
          </span>
        )}
      </div>
    </div>
  );
};
