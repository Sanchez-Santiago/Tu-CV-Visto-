import React from "react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/src/components/ui/Logo";
import { Button } from "@/src/components/ui/Button";

interface LegalPageProps {
  titulo: string;
  subtitulo: string;
  vigencia: string;
  indice?: { id: string; label: string }[];
  onBack: () => void;
  children: React.ReactNode;
}

export const LegalPage: React.FC<LegalPageProps> = ({
  titulo,
  subtitulo,
  vigencia,
  indice,
  onBack,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#080A09] text-[#F2F5F3] flex justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <Logo size="md" />
          <Button variant="ghost" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Volver
          </Button>
        </div>

        <div className="skeuo-surface p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{titulo}</h1>
          <p className="text-sm text-[#A7B0AA] mt-2">{subtitulo}</p>
          <p className="text-xs text-[#69736D] mt-1">{vigencia}</p>

          {indice && indice.length > 0 && (
            <nav className="mt-6 p-4 rounded-xl bg-[#101412] border border-[#222A26]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#69736D] mb-2">
                Índice
              </p>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                {indice.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-xs text-[#A7B0AA] hover:text-[#4ADE80] transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className="mt-6 space-y-7">{children}</div>
        </div>

        <p className="text-center text-[11px] text-[#69736D] mt-6">
          CVisto — Tu búsqueda laboral, organizada.
        </p>
      </div>
    </div>
  );
};

export const SeccionLegal: React.FC<{
  id: string;
  titulo: string;
  children: React.ReactNode;
}> = ({ id, titulo, children }) => {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-base font-semibold text-[#F2F5F3] mb-2">{titulo}</h2>
      <div className="text-sm text-[#D1D9D4] leading-relaxed space-y-2 [&_a]:text-[#4ADE80] [&_a]:underline [&_a]:underline-offset-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-[#F2F5F3]">
        {children}
      </div>
    </section>
  );
};
