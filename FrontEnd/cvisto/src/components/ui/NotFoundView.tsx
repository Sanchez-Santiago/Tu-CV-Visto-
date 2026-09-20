import React from "react";
import { FileQuestion } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

export const NotFoundView: React.FC<{ onVolver: () => void }> = ({
  onVolver,
}) => {
  return (
    <div className="min-h-screen bg-[#080A09] text-[#F2F5F3] flex items-center justify-center p-4">
      <div className="w-full max-w-md skeuo-surface p-8 flex flex-col items-center text-center">
        <FileQuestion className="w-12 h-12 text-[#69736D] mb-4" />
        <p className="text-5xl font-bold tracking-tight text-[#F2F5F3]">404</p>
        <h1 className="text-lg font-semibold mt-2">Página no encontrada</h1>
        <p className="text-sm text-[#A7B0AA] mt-2 leading-relaxed">
          La ruta que buscás no existe o fue movida. Volvé al dashboard para
          seguir con tu búsqueda laboral.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={onVolver}
          className="mt-6"
        >
          Volver al dashboard
        </Button>
      </div>
    </div>
  );
};
