import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "lg",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/65 backdrop-blur-xs transition-opacity duration-200"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-[#171C19] border border-white/[0.07] rounded-[20px] shadow-[0_14px_32px_rgba(0,0,0,0.35),0_24px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] z-10 overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95`}
      >
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/[0.06] bg-[#141817]">
          <div>
            <h2 className="text-base font-semibold text-[#F2F5F3]">{title}</h2>
            {description && (
              <p className="text-xs text-[#A7B0AA] mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="text-[#A7B0AA] hover:text-[#F2F5F3] p-1.5 rounded-[10px] hover:bg-[#181D1B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
