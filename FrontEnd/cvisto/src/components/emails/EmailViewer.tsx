import React, { useMemo, useState } from "react";
import {
  Mail,
  User,
  Calendar,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Maximize2,
  Reply,
  Forward,
  Briefcase,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  ExternalLink,
} from "lucide-react";
import type { Email } from "@/src/schemas/email";
import type { Firma } from "@/src/schemas/firma";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import {
  esHtml,
  normalizarHtml,
  reemplazarCidPorDataUrl,
  extraerImagenesDeHtml,
  textoSinHtml,
  type ImagenEmailDetectada,
} from "@/src/lib/html";
import { armarPrefijoAsunto } from "@/src/lib/texto";

interface EmailViewerProps {
  email: Email;
  firmas?: Firma[];
  onComposeEmail?: (prefill: {
    destinatario: string;
    asunto: string;
    cuerpo: string;
  }) => void;
  onCrearPostulacion?: (email: Email) => void;
  onClose?: () => void;
  compact?: boolean;
}

const tipoRespuestaBadges: Record<
  string,
  { label: string; className: string }
> = {
  entrevista: {
    label: "Entrevista",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  oferta: {
    label: "Oferta",
    className: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
  rechazo: {
    label: "Rechazo",
    className: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
  novedad: {
    label: "Novedad",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  contacto: {
    label: "Contacto",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
};

const citarMensaje = (e: Email): string => {
  const raw =
    (e.cuerpoHtml && esHtml(e.cuerpoHtml) ? textoSinHtml(e.cuerpoHtml) : null) ||
    (e.contenidoResumen && esHtml(e.contenidoResumen)
      ? textoSinHtml(e.contenidoResumen)
      : e.contenidoResumen) ||
    "";
  const cuerpo = raw.slice(0, 8000);
  const citado = cuerpo
    .split("\n")
    .map((linea) => (linea ? `> ${linea}` : ">"))
    .join("\n");

  return [
    "",
    "───────────── Mensaje original ─────────────",
    `De: ${e.remitente || "-"}`,
    `Para: ${e.destinatario || "-"}`,
    `Asunto: ${e.asunto || "-"}`,
    `Fecha: ${e.fecha || "-"}`,
    "",
    citado,
  ].join("\n");
};

export const EmailViewer: React.FC<EmailViewerProps> = ({
  email,
  firmas = [],
  onComposeEmail,
  onCrearPostulacion,
  onClose,
  compact = false,
}) => {
  const [permitirImagenes, setPermitirImagenes] = useState<boolean>(true);
  const [imagenModal, setImagenModal] = useState<ImagenEmailDetectada | null>(null);

  // Resolver contenido HTML y firmas embebidas con CID
  const contenidoHtml = useMemo(() => {
    if (esHtml(email.cuerpoHtml)) {
      return reemplazarCidPorDataUrl(email.cuerpoHtml ?? "", firmas);
    }
    if (esHtml(email.contenidoResumen)) {
      return reemplazarCidPorDataUrl(email.contenidoResumen ?? "", firmas);
    }
    return "";
  }, [email.cuerpoHtml, email.contenidoResumen, firmas]);

  // Extraer y categorizar imágenes
  const imagenesDetectadas = useMemo(
    () => extraerImagenesDeHtml(contenidoHtml),
    [contenidoHtml],
  );

  const textoPlano = useMemo(() => {
    if (contenidoHtml) return "";
    return (
      email.cuerpoHtml ||
      (email.contenidoResumen && !esHtml(email.contenidoResumen)
        ? email.contenidoResumen
        : "") ||
      "(Sin contenido de texto disponible)"
    );
  }, [contenidoHtml, email.cuerpoHtml, email.contenidoResumen]);

  const badgeRespuesta = email.tipoRespuesta
    ? tipoRespuestaBadges[email.tipoRespuesta]
    : null;

  const remitenteIniciales = useMemo(() => {
    const fuente = email.enviado === 1 ? email.destinatario : email.remitente;
    const nombre = fuente.split("@")[0] || "EM";
    return nombre.slice(0, 2).toUpperCase();
  }, [email.remitente, email.destinatario, email.enviado]);

  const handleResponder = (modo: "responder" | "reenviar") => {
    if (!onComposeEmail) return;
    const destinatario =
      modo === "reenviar"
        ? ""
        : email.enviado === 1
          ? email.destinatario ?? ""
          : email.remitente ?? "";
    const asunto = armarPrefijoAsunto(email.asunto, modo);
    const cuerpo = citarMensaje(email);

    if (onClose) onClose();
    onComposeEmail({
      destinatario,
      asunto,
      cuerpo,
    });
  };

  return (
    <div className={`space-y-4 ${compact ? "text-xs" : "text-sm"}`}>
      {/* Header del email */}
      <div className="p-4 rounded-xl bg-[#141917] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Avatar / Iniciales */}
          <div className="w-10 h-10 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#4ADE80] font-bold flex items-center justify-center shrink-0">
            {remitenteIniciales}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#F2F5F3] text-sm truncate">
                {email.enviado === 1 ? email.destinatario : email.remitente}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  email.enviado === 1
                    ? "bg-[#22C55E]/15 text-[#4ADE80] border-[#22C55E]/30"
                    : "bg-sky-500/15 text-sky-400 border-sky-500/30"
                }`}
              >
                {email.enviado === 1 ? (
                  <>
                    <ArrowUpRight className="w-3 h-3" /> Enviado
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-3 h-3" /> Recibido
                  </>
                )}
              </span>

              {badgeRespuesta && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeRespuesta.className}`}
                >
                  {badgeRespuesta.label}
                </span>
              )}

              {email.tipoSeguimiento && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-[#A7B0AA] border border-white/[0.08]">
                  Seguimiento: {email.tipoSeguimiento}
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-[#A7B0AA]">
              <div>
                <span className="text-[#69736D]">De:</span> {email.remitente}
              </div>
              <div>
                <span className="text-[#69736D]">Para:</span> {email.destinatario}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#69736D]" />
                {email.fecha}
              </div>
            </div>
          </div>
        </div>

        {/* Acciones superiores si no es compacto */}
        {!compact && onComposeEmail && (
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Reply className="w-3.5 h-3.5" />}
              onClick={() => handleResponder("responder")}
            >
              Responder
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Forward className="w-3.5 h-3.5" />}
              onClick={() => handleResponder("reenviar")}
            >
              Reenviar
            </Button>
          </div>
        )}
      </div>

      {/* Banner de detección de imágenes y recursos externos */}
      {imagenesDetectadas.length > 0 && (
        <div className="p-3 rounded-xl bg-[#101412] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#F2F5F3]">
                {imagenesDetectadas.length}{" "}
                {imagenesDetectadas.length === 1
                  ? "imagen detectada"
                  : "imágenes detectadas"}{" "}
                (firmas, logos o recursos)
              </p>
              <p className="text-[11px] text-[#A7B0AA]">
                {permitirImagenes
                  ? "Las imágenes están visibles. Podés hacer clic para abrirlas en vista previa."
                  : "Las imágenes remotas están temporalmente ocultas por seguridad."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={
                permitirImagenes ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )
              }
              onClick={() => setPermitirImagenes(!permitirImagenes)}
            >
              {permitirImagenes ? "Ocultar imágenes" : "Mostrar imágenes"}
            </Button>
          </div>
        </div>
      )}

      {/* Galería de imágenes detectadas (thumbnails con vista modal) */}
      {imagenesDetectadas.length > 0 && permitirImagenes && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {imagenesDetectadas.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setImagenModal(img)}
              className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141917] hover:bg-[#1C221F] border border-white/[0.06] hover:border-[#22C55E]/40 text-[#A7B0AA] hover:text-[#F2F5F3] text-xs transition-all shrink-0 cursor-pointer"
              title={`Ver imagen: ${img.alt || img.tipo}`}
            >
              <ImageIcon className="w-3 h-3 text-[#22C55E]" />
              <span className="capitalize">{img.tipo}</span>
              <Maximize2 className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      )}

      {/* Contenedor del cuerpo del correo: Tarjeta limpia con 24px de padding interno */}
      <div className="rounded-xl bg-white overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)] border border-black/10">
        {contenidoHtml ? (
          <iframe
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            title="Contenido del correo"
            srcDoc={normalizarHtml(contenidoHtml, { permitirImagenes })}
            className="w-full bg-white transition-opacity block"
            style={{
              border: 0,
              height: compact ? "300px" : "min(65vh, 680px)",
              minHeight: compact ? 220 : 380,
            }}
          />
        ) : (
          <div
            className="p-6 text-gray-900 bg-white font-sans text-sm leading-relaxed overflow-y-auto"
            style={{
              maxHeight: compact ? "300px" : "65vh",
              minHeight: compact ? 180 : 280,
            }}
          >
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 break-words m-0">
              {textoPlano}
            </pre>
          </div>
        )}
      </div>

      {/* Barra de acciones inferior */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onComposeEmail && compact && (
            <>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Reply className="w-3.5 h-3.5" />}
                onClick={() => handleResponder("responder")}
              >
                Responder
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Forward className="w-3.5 h-3.5" />}
                onClick={() => handleResponder("reenviar")}
              >
                Reenviar
              </Button>
            </>
          )}
        </div>

        {email.postulacionId === null && onCrearPostulacion && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Briefcase className="w-4 h-4 text-black" />}
            onClick={() => {
              if (onClose) onClose();
              onCrearPostulacion(email);
            }}
          >
            Agregar como postulación
          </Button>
        )}
      </div>

      {/* Modal / Lightbox para ver imágenes individuales */}
      {imagenModal && (
        <Modal
          isOpen={Boolean(imagenModal)}
          onClose={() => setImagenModal(null)}
          title={`Vista previa: ${imagenModal.tipo.toUpperCase()}`}
          description={imagenModal.alt || "Imagen contenida en el correo"}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0E1210] border border-white/[0.08] flex items-center justify-center min-h-[220px] max-h-[60vh] overflow-auto">
              <img
                src={imagenModal.src}
                alt={imagenModal.alt || "Imagen del correo"}
                className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-md"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#A7B0AA]">
              <span className="capitalize">Tipo: {imagenModal.tipo}</span>
              {imagenModal.src.startsWith("http") && (
                <a
                  href={imagenModal.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#22C55E] hover:underline"
                >
                  Abrir enlace directo <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/[0.06]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setImagenModal(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
