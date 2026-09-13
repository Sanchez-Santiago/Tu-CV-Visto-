import React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  badgeColor?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", id, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-[#A7B0AA] flex items-center justify-between">
            <span>{label}</span>
            {props.required && <span className="text-[#22C55E] text-[10px] uppercase font-semibold">Requerido</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`w-full skeuo-input rounded-[11px] text-sm px-3.5 py-2 pr-10 appearance-none cursor-pointer focus:outline-none bg-[#0C0F0E] text-[#F2F5F3] ${
              error ? "!border-[#F87171]/70" : ""
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#141817] text-[#F2F5F3]">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 w-4 h-4 text-[#69736D] pointer-events-none" />
        </div>
        {error && <p className="text-xs text-rose-400 mt-0.5">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
