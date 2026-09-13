import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "secondary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all duration-160 rounded-[10px] select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22C55E]/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none";

  const sizeClasses = {
    sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
    md: "text-sm px-4 py-2 gap-2 h-9",
    lg: "text-base px-5 py-2.5 gap-2.5 h-10",
    icon: "h-9 w-9 p-0 flex items-center justify-center",
  };

  const variantClasses = {
    primary: "skeuo-button-primary",
    secondary: "skeuo-button-secondary",
    danger:
      "bg-[#201314] hover:bg-[#2A1719] text-[#F87171] border border-[#481E21] active:translate-y-[1px] shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.03)]",
    ghost:
      "bg-transparent hover:bg-[#181D1B] text-[#A7B0AA] hover:text-[#F2F5F3] border border-transparent active:bg-[#1C221F]",
    outline:
      "bg-transparent hover:bg-[#141817] text-[#F2F5F3] border border-white/[0.08] active:translate-y-[1px]",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
