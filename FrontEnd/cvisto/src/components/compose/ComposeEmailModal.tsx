import React, { useEffect, useRef, useState } from "react";
import { Send, Loader2, Paperclip, X, FileText } from "lucide-react";
import type { Contacto } from "@/src/schemas/contacto";
import type { AdjuntoEnviar } from "@/src/lib/api/client";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { Input } from "@/src/components/ui/Input";

const MAX_BYTES = 18 * 1024 * 1024;

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefill?: { destinatario: string; asunto: string; cuerpo: string };
  contactos?: Contacto[];
  onEnviado: (input: {
    destinatario: string;
    asunto: string;
    cuerpo: string;
    cc?: string;
    adjuntos?: AdjuntoEnviar[];
  }) => Promise<void>;
}

interface AdjuntoLocal {
  id: string;
  nombre: string;
  contentType: string;
  base64: string;
  size: number;
}

export const ComposeEmailModal: React.FC<ComposeEmailModalProps> = ({
  isOpen,
  onClose,
  prefill,
  contactos = [],
  onEnviado,
}) => {
  const [destinatario, setDestinatario] = useState("");
  const [cc, setCc] = useState("");
  const [asunto, setAsunto] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [adjuntosLocales, setAdjuntosLocales] = useState<AdjuntoLocal[]>([]);
  const archivoRef = useRef<HTMLInputElement>(null);
  const idCounter = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setDestinatario(prefill?.destinatario ?? "");
      setCc("");
      setAsunto(prefill?.asunto ?? "");
      setCuerpo(prefill?.cuerpo ?? "");
      setAdjuntosLocales([]);
      setEnviando(false);
    }
  }, [isOpen, prefill?.destinatario, prefill?.asunto, prefill?.cuerpo]);

  const sugerencias = (() => {
    if (!destinatario.trim()) return [];
    const query = destinatario.trim().toLowerCase();
    const vistos = new Set<string>();
    return contactos
      .filter((c) => {
        if (!c.email || vistos.has(c.email.toLowerCase())) return false;
        vistos.add(c.email.toLowerCase());
        return c.email.toLowerCase().includes(query);
      })
      .slice(0, 6);
  })();

  const seleccionarContacto = (email: string) => {
    setDestinatario(email);
  };

  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let totalPrevio = adjuntosLocales.reduce((acc, a) => acc + a.size, 0);

    for (let i = 0; i < files.length; i++) {
      const archivo = files[i]!;
      totalPrevio += archivo.size;
      if (totalPrevio > MAX_BYTES) {
        window.alert("Los archivos exceden el límite de 18 MB en total.");
        break;
      }
      const lector = new FileReader();
      lector.onload = () => {
        const dataUrl = lector.result as string;
        const base64 = dataUrl.split(",")[1] ?? "";
        idCounter.current += 1;
        setAdjuntosLocales((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${idCounter.current}`,
            nombre: archivo.name || `adjunto-${idCounter.current}`,
            contentType: archivo.type || "application/octet-stream",
            base64,
            size: archivo.size,
          },
        ]);
      };
      lector.readAsDataURL(archivo);
    }

    e.target.value = "";
  };

  const eliminarAdjunto = (id: string) => {
    setAdjuntosLocales((prev) => prev.filter((a) => a.id !== id));
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinatario.trim() || !cuerpo.trim() || enviando) return;

    setEnviando(true);
    try {
      await onEnviado({
        destinatario: destinatario.trim(),
        asunto: asunto.trim(),
        cuerpo,
        cc: cc.trim() || undefined,
        adjuntos: adjuntosLocales.length
          ? adjuntosLocales.map((a) => ({
              nombre: a.nombre,
              mimeType: a.contentType,
              contenidoBase64: a.base64,
            }))
          : undefined,
      });
      onClose();
    } catch {
      // el error ya fue mostrado por el handler; la modal queda abierta
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!enviando) onClose();
      }}
      title="Redactar email"
      description="Se envía desde tu cuenta de Gmail y queda registrado en el historial."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            label="Para"
            placeholder="reclutador@empresa.com"
            type="email"
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
            required
          />
          {sugerencias.length > 0 && (
            <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#101412] border border-[#232C28] rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
              {sugerencias.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => seleccionarContacto(c.email)}
                    className="w-full text-left px-3 py-2 hover:bg-[#181D1B] text-xs cursor-pointer"
                  >
                    <span className="text-[#F2F5F3] font-medium">{c.email}</span>
                    {c.nombre && (
                      <span className="text-[#69736D] ml-2">({c.nombre})</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Input
          label="CC (opcional)"
          placeholder="otro@empresa.com"
          type="email"
          value={cc}
          onChange={(e) => setCc(e.target.value)}
        />

        <Input
          label="Asunto"
          placeholder="Asunto del correo..."
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#A7B0AA]">Mensaje</label>
          <textarea
            rows={9}
            placeholder="Escribí tu mensaje..."
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            required
            className="w-full bg-[#101412] border border-[#232C28] rounded-[10px] text-sm p-3 focus:outline-none focus:border-[#22C55E]/60 focus:ring-1 focus:ring-[#22C55E]/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] placeholder:text-[#69736D] resize-y"
          />
        </div>

        {adjuntosLocales.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {adjuntosLocales.map((adj) => (
              <span
                key={adj.id}
                className="inline-flex items-center gap-2 bg-[#181D1B] border border-[#232C28] rounded-lg px-3 py-2 text-xs text-[#F2F5F3]"
              >
                {adj.contentType.startsWith("image/") ? (
                  <img
                    src={`data:${adj.contentType};base64,${adj.base64}`}
                    alt={adj.nombre}
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : (
                  <FileText className="w-4 h-4 text-[#69736D]" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="truncate max-w-[140px]">{adj.nombre}</span>
                  <span className="text-[10px] text-[#69736D]">
                    {formatBytes(adj.size)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => eliminarAdjunto(adj.id)}
                  className="text-[#69736D] hover:text-rose-400 ml-1 cursor-pointer"
                  title="Quitar adjunto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-white/[0.06] flex justify-between items-center gap-2">
          <input
            ref={archivoRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
            className="hidden"
            onChange={handleArchivo}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => archivoRef.current?.click()}
            disabled={enviando}
            leftIcon={<Paperclip className="w-4 h-4" />}
          >
            Adjuntar archivo
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={enviando}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={enviando}
              leftIcon={
                enviando ? (
                  <Loader2 className="w-4 h-4 text-black animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-black" />
                )
              }
            >
              {enviando ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};