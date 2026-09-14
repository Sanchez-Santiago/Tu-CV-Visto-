import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  centered?: boolean;
  compact?: boolean;
  surface?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  centered = false,
  compact = false,
  surface = true,
}) => (
  <div
    className={`${surface ? "skeuo-surface " : ""}p-12 text-center ${
      compact ? "space-y-2" : "space-y-3"
    }`}
  >
    {icon && <div className="flex justify-center">{icon}</div>}
    <h3 className="text-base font-semibold text-[#F2F5F3]">{title}</h3>
    {description && (
      <p
        className={`text-xs text-[#A7B0AA] ${
          centered ? "max-w-sm mx-auto" : ""
        }`}
      >
        {description}
      </p>
    )}
    {action && <div className="flex justify-center pt-1">{action}</div>}
  </div>
);