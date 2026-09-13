import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, description?: string) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "success", description?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = { id, type, message, description };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  const success = useCallback((message: string, description?: string) => {
    addToast(message, "success", description);
  }, [addToast]);

  const error = useCallback((message: string, description?: string) => {
    addToast(message, "error", description);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border bg-[#141817] shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all animate-in fade-in slide-in-from-bottom-3 ${
              t.type === "success"
                ? "border-[#22C55E]/40 text-[#F2F5F3]"
                : t.type === "error"
                ? "border-rose-500/40 text-[#F2F5F3]"
                : "border-sky-500/40 text-[#F2F5F3]"
            }`}
          >
            {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />}
            {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {t.type === "info" && <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#F2F5F3]">{t.message}</p>
              {t.description && <p className="text-xs text-[#A7B0AA] mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#69736D] hover:text-[#F2F5F3] transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
