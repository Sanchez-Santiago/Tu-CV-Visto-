import React, { useState } from "react";
import {
  Mail,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  ChevronUp,
  Reply,
  Calendar,
  User,
  Sparkles,
} from "lucide-react";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import type { Email } from "@/src/schemas/email";
import type { Firma } from "@/src/schemas/firma";
import {
  esHtml,
  normalizarHtml,
  reemplazarCidPorDataUrl,
  textoSinHtml,
} from "@/src/lib/html";

interface LinkedEmailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  emails: Email[];
  firmas?: Firma[];
  onComposeEmail?: (prefill: {
    destinatario: string;
    asunto: string;
    cuerpo: string;
  }) => void;
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

export const LinkedEmailsModal: React.FC<LinkedEmailsModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  emails,
  firmas = [],
  onComposeEmail,
}) => {
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedEmailId((prev) => (prev === id ? null : id));
  };

  const handleResponder = (email: Email) => {
    if (!onComposeEmail) return;
    const destinatario =
      email.enviado === 1 ? email.destinatario : email.remitente;
    const asunto = email.asunto?.toLowerCase().startsWith("re:")
      ? email.asunto
      : `Re: ${email.asunto ?? ""}`;
    const cuerpo = `\n\n--- El ${email.fecha}, ${email.remitente} escribió: ---\n> ${textoSinHtml(
      email.cuerpoHtml || email.contenidoResumen || "",
    ).slice(0, 500)}`;

    onComposeEmail({
      destinatario,
      asunto,
      cuerpo,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={subtitle}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#22C55E]" />
            <span className="text-xs font-semibold text-[#F2F5F3]">
              Historial de correos vinculados
            </span>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#181D1B] border border-white/[0.08] text-[#A7B0AA]">
            {emails.length} {emails.length === 1 ? "correo" : "correos"}
          </span>
        </div>

        {emails.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-[#101412] border border-[#222A26]">
            <div className="w-12 h-12 rounded-2xl bg-[#181D1B] border border-white/[0.06] flex items-center justify-center mb-3">
              <Mail className="w-6 h-6 text-[#69736D]" />
            </div>
            <h4 className="text-sm font-semibold text-[#F2F5F3]">
              Sin correos registrados
            </h4>
            <p className="text-xs text-[#A7B0AA] max-w-sm mt-1 mb-4">
              Aún no hay correos asociados a esta postulación o contacto. Podés
              enviar uno nuevo o sincronizar tu cuenta de Gmail.
            </p>
            {onComposeEmail && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onComposeEmail({
                    destinatario: "",
                    asunto: title,
                    cuerpo: "",
                  });
                  onClose();
                }}
              >
                Escribir correo ahora
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {emails.map((email) => {
              const isExpanded = expandedEmailId === email.id;
              const badge = email.tipoRespuesta
                ? tipoRespuestaBadges[email.tipoRespuesta]
                : null;
              const contenidoHtml = esHtml(email.cuerpoHtml)
                ? email.cuerpoHtml ?? ""
                : esHtml(email.contenidoResumen)
                  ? email.contenidoResumen ?? ""
                  : "";
              const textoPlano = !contenidoHtml
                ? email.cuerpoHtml ||
                  email.contenidoResumen ||
                  "(Sin contenido de texto disponible)"
                : "";

              return (
                <div
                  key={email.id}
                  className="rounded-xl border border-white/[0.06] bg-[#121614] overflow-hidden transition-all shadow-xs"
                >
                  {/* Encabezado del email */}
                  <div
                    onClick={() => toggleExpand(email.id)}
                    className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-[#181D1B] transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          email.enviado === 1
                            ? "bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/30"
                            : "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                        }`}
                        title={email.enviado === 1 ? "Enviado por vos" : "Recibido"}
                      >
                        {email.enviado === 1 ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-[#F2F5F3] truncate">
                            {email.asunto || "(Sin asunto)"}
                          </h4>
                          {badge && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[#A7B0AA] mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-[#69736D]" />
                            {email.enviado === 1
                              ? `Para: ${email.destinatario}`
                              : `De: ${email.remitente}`}
                          </span>
                          <span className="flex items-center gap-1 text-[#69736D]">
                            <Calendar className="w-3 h-3" />
                            {email.fecha}
                          </span>
                        </div>

                        {!isExpanded && email.contenidoResumen && (
                          <p className="text-xs text-[#69736D] mt-1.5 line-clamp-1">
                            {textoSinHtml(email.contenidoResumen)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResponder(email);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#A7B0AA] hover:text-[#22C55E] transition-colors"
                        title="Responder"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 text-[#69736D] hover:text-[#F2F5F3]"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Cuerpo expandible del email */}
                  {isExpanded && (
                    <div className="p-4 pt-2 border-t border-white/[0.06] bg-[#0E1210] space-y-3">
                      <div className="text-[11px] text-[#A7B0AA] space-y-0.5 bg-[#121614] p-2.5 rounded-lg border border-white/[0.04]">
                        <p>
                          <span className="text-[#F2F5F3] font-semibold">De:</span>{" "}
                          {email.remitente}
                        </p>
                        <p>
                          <span className="text-[#F2F5F3] font-semibold">Para:</span>{" "}
                          {email.destinatario}
                        </p>
                        <p>
                          <span className="text-[#F2F5F3] font-semibold">Fecha:</span>{" "}
                          {email.fecha}
                        </p>
                        {email.tipoSeguimiento && (
                          <p>
                            <span className="text-[#F2F5F3] font-semibold">
                              Tipo seguimiento:
                            </span>{" "}
                            {email.tipoSeguimiento}
                          </p>
                        )}
                      </div>

                      {contenidoHtml ? (
                        <div className="rounded-lg bg-white overflow-hidden shadow-inner">
                          <iframe
                            sandbox="allow-popups allow-popups-to-escape-sandbox"
                            title="Contenido del correo"
                            srcDoc={normalizarHtml(
                              reemplazarCidPorDataUrl(contenidoHtml, firmas),
                            )}
                            className="w-full"
                            style={{
                              border: 0,
                              background: "#fff",
                              height: "280px",
                            }}
                          />
                        </div>
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans text-xs text-gray-800 p-3.5 rounded-lg bg-white max-h-[280px] overflow-y-auto">
                          {textoPlano}
                        </pre>
                      )}

                      <div className="flex justify-end pt-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleResponder(email)}
                          leftIcon={<Reply className="w-3.5 h-3.5" />}
                        >
                          Responder correo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
