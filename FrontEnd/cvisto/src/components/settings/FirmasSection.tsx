import React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Signature,
  Image as ImageIcon,
  Type as TypeIcon,
} from "lucide-react";
import type { Firma } from "@/src/schemas/firma";
import { Button } from "@/src/components/ui/Button";
import { dataUrlDeImagen } from "@/src/lib/archivos";

interface FirmasSectionProps {
  data: Firma[];
  onAgregar: () => void;
  onEditar: (firma: Firma) => void;
  onEliminar: (id: string) => void;
}

export const FirmasSection: React.FC<FirmasSectionProps> = ({
  data,
  onAgregar,
  onEditar,
  onEliminar,
}) => (
  <div className="skeuo-surface p-6 space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#181D1B] border border-[#222A26] flex items-center justify-center text-[#22C55E]">
          <Signature className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#F2F5F3]">Firmas de email</h3>
          <p className="text-xs text-[#A7B0AA] mt-0.5">
            Texto o imagen con enlace para tus correos
          </p>
        </div>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={onAgregar}
        leftIcon={<Plus className="w-4 h-4 text-black" />}
      >
        Nueva firma
      </Button>
    </div>

    {data.length === 0 ? (
      <p className="text-xs text-[#69736D] py-2">
        Todavía no creaste firmas. Podés usarlas al redactar un email.
      </p>
    ) : (
      <div className="space-y-2">
        {data.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#101412] border border-[#222A26]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#181D1B] border border-[#222A26] flex items-center justify-center text-[#A7B0AA] shrink-0">
                {f.tipo === "imagen" ? (
                  <ImageIcon className="w-4 h-4" />
                ) : (
                  <TypeIcon className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F2F5F3]">{f.nombre}</p>
                <p className="text-[11px] text-[#69736D]">
                  {f.tipo === "imagen" ? "Imagen" : "Texto"}
                  {f.enlace && " · con enlace"}
                </p>
              </div>
              {f.tipo === "imagen" && f.imagenBase64 && (
                <img
                  src={dataUrlDeImagen(f.imagenMime, f.imagenBase64)}
                  alt={f.nombre}
                  className="w-10 h-8 object-contain rounded border border-[#222A26]"
                />
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEditar(f)}
                className="p-2 text-[#69736D] hover:text-[#4ADE80] rounded-lg hover:bg-[#22C55E]/10 transition-colors cursor-pointer"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onEliminar(f.id)}
                className="p-2 text-[#69736D] hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);