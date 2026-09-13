import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[#A7B0AA] flex items-center justify-between">
            <span>{label}</span>
            {props.required && <span className="text-[#22C55E] text-[10px] uppercase font-semibold tracking-wider">Requerido</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[#69736D] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full skeuo-input rounded-[11px] text-sm px-3.5 py-2 placeholder:text-[#69736D] focus:outline-none ${
              leftIcon ? "pl-9" : ""
            } ${rightIcon ? "pr-9" : ""} ${
              error ? "!border-[#F87171]/70 !focus:border-[#F87171]" : ""
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-[#69736D] pointer-events-none flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-400 mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#69736D] mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
