import React from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actions,
  className = "",
}) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}
  >
    <div>
      <h2 className="text-xl font-bold tracking-tight text-[#F2F5F3] font-['Inter']">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs text-[#A7B0AA] mt-0.5">{subtitle}</p>
      )}
    </div>
    {actions && (
      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        {actions}
      </div>
    )}
  </div>
);