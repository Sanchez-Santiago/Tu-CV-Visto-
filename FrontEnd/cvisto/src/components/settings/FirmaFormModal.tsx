import React, { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";
import type { Firma, FirmaSinId, TipoFirma } from "@/src/schemas/firma";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { Modal } from "@/src/components/ui/Modal";
import { archivoABase64, dataUrlDeImagen } from "@/src/lib/archivos";

interface FirmaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  inicial: Firma | null;
  onSubmit: (data: FirmaSinId) => Promise<void>;
}

export const FirmaFormModal: React.FC<FirmaFormModalProps> = ({
  isOpen,
  onClose,
  inicial,
  onSubmit,
}) => {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoFirma>("texto");
  const [contenido, setContenido] = useState("");
  const [enlace, setEnlace] = useState("");
  const [imagenMime, setImagenMime] = useState<string | null>(null);
  const [imagenBase64, setImagenBase64] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setNombre(inicial?.nombre ?? "");
      setTipo((inicial?.tipo as TipoFirma) ?? "texto");
      setContenido(inicial?.contenido ?? "");
      setEnlace(inicial?.enlace ?? "");
      setImagenMime(inicial?.imagenMime ?? null);
      setImagenBase64(inicial?.imagenBase64 ?? null);
      setGuardando(false);
    }
  }, [isOpen, inicial]);

  const handleImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      window.alert("El archivo debe ser una imagen.");
      e.target.value = "";
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      window.alert("La imagen no puede superar los 2 MB.");
      e.target.value = "";
      return;
    }
    try {
      const leido = await archivoABase64(archivo, "firma");
      setImagenMime(leido.contentType);
      setImagenBase64(leido.base64);
    } catch {
      window.alert("No se pudo leer la imagen.");
    }
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    if (tipo === "imagen" && !imagenBase64) {
      window.alert("Subí una imagen para la firma.");
      return;
    }
    setGuardando(true);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        tipo,
        contenido: tipo === "texto" ? contenido.trim() : null,
        imagenMime: tipo === "imagen" ? imagenMime : null,
        imagenBase64: tipo === "imagen" ? imagenBase64 : null,
        enlace: enlace.trim() || null,
      });
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={inicial ? "Editar firma" : "Nueva firma"}
      description="La firma se agrega al final de tus emails."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre de la firma"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Profesional / Académica"
          required
        />

        <Select
          label="Tipo de firma"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoFirma)}
          options={[
            { value: "texto", label: "Solo texto" },
            { value: "imagen", label: "Imagen (con enlace opcional)" },
          ]}
        />

        {tipo === "texto" ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#A7B0AA]">
              Contenido de la firma
            </label>
            <textarea
              rows={3}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder={
                "Nombre\nPuesto — Empresa\nLinkedIn: tu-linkedin\nwww.tusitio.com"
              }
              className="w-full skeuo-input rounded-lg text-sm p-3 focus:outline-none placeholder:text-[#69736D]"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#A7B0AA]">
                Imagen (PNG / JPG, hasta 2 MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImagen}
                className="w-full text-xs text-[#A7B0AA] file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-[#181D1B] file:text-[#F2F5F3] file:cursor-pointer cursor-pointer"
              />
              {imagenBase64 && (
                <div className="p-3 rounded-lg bg-[#101412] border border-[#222A26] flex items-center gap-3">
                  <img
                    src={dataUrlDeImagen(imagenMime, imagenBase64)}
                    alt="Vista previa de la firma"
                    className="max-h-16 object-contain rounded border border-[#222A26]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagenBase64(null);
                      setImagenMime(null);
                    }}
                    className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Quitar imagen
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#A7B0AA]">
                Enlace al hacer clic (opcional)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#69736D]" />
                <input
                  type="url"
                  placeholder="https://tusitio.com"
                  value={enlace}
                  onChange={(e) => setEnlace(e.target.value)}
                  className="w-full skeuo-input rounded-lg text-sm px-10 py-2.5 focus:outline-none placeholder:text-[#69736D]"
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-white/[0.06] flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={guardando}
            leftIcon={<Check className="w-4 h-4 text-black" />}
          >
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
};