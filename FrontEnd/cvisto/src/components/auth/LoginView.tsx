import React from "react";
import { Logo } from "@/src/components/ui/Logo";

interface LoginViewProps {
  onLogin: () => void;
  onOpenPrivacidad: () => void;
  onOpenTerminos: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  onOpenPrivacidad,
  onOpenTerminos,
}) => {
  return (
    <div className="min-h-screen bg-[#080A09] text-[#F2F5F3] flex items-center justify-center p-4">
      <div className="w-full max-w-md skeuo-surface p-8 flex flex-col items-center text-center">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" />
        </div>
        <p className="text-sm text-[#A7B0AA] mt-1.5 mb-8">
          Gestioná tus postulaciones, seguimientos estratégicos y contactos en
          un solo lugar.
        </p>

        <button
          type="button"
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#181D1B] border border-[#222A26] px-5 py-3.5 text-sm font-semibold text-[#F2F5F3] hover:border-[#22C55E] hover:bg-[#1E2Pet sèp ...]"
          style={{ transition: "all 0.15s ease" }}
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continuar con Google
        </button>

        <p className="text-[11px] text-[#69736D] mt-6 leading-relaxed">
          Al iniciar sesión se crea tu perfil y quedan sincronizados tus datos
          entre esta app y la API de CVisto.
        </p>

        <div className="mt-3 flex items-center justify-center gap-4 text-[11px]">
          <button
            type="button"
            onClick={onOpenPrivacidad}
            className="text-[#69736D] hover:text-[#4ADE80] underline underline-offset-2 transition-colors cursor-pointer"
          >
            Política de Privacidad
          </button>
          <button
            type="button"
            onClick={onOpenTerminos}
            className="text-[#69736D] hover:text-[#4ADE80] underline underline-offset-2 transition-colors cursor-pointer"
          >
            Términos de Servicio
          </button>
        </div>
      </div>
    </div>
  );
};