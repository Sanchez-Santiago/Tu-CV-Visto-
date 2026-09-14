import React, { useEffect, useState } from "react";
import { Mail, Plus, Trash2, Send, Clock, CheckCircle2, Briefcase, Reply, Forward, ChevronLeft, ChevronRight } from "lucide-react";
import type { Email, EmailSinId } from "@/src/schemas/email";
import type { Postulacion } from "@/src/schemas/postulacion";
import type { Empresa } from "@/src/schemas/empresa";
import type { TipoEmail } from "@/src/schemas/common";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { SearchInput } from "@/src/components/ui/SearchInput";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { nombreEmpresa } from "@/src/lib/nombres";
import { armarPrefijoAsunto, textoSinHtml } from "@/src/lib/texto";
import {
  ESTADO_LABELS,
  ESTADO_COLORS,
  TIPO_EMAIL_LABELS,
} from "@/src/lib/estados";
import { postulacionVista } from "@/src/lib/postulaciones";
import { fechaDia } from "@/src/lib/fechas";

interface EmailsViewProps {
  emails: Email[];
  postulaciones: Postulacion[];
  empresas: Empresa[];
  onCreateEmail: (data: EmailSinId) => Promise<void>;
  onDeleteEmail: (id: string) => void;
  onCrearPostulacionDesdeEmail: (email: Email) => void;
  onComposeEmail?: (prefill: {
    destinatario: string;
    asunto: string;
    cuerpo: string;
  }) => void;
}

const PAGINA_SIZE = 50;

const esHtml = (contenido: string | null | undefined): boolean => {
  const texto = (contenido ?? "").trim();
  if (!texto) return false;
  return /<\s*(?:!DOCTYPE|html|head|body|div|table|tr|td|p\b|span|a\b|img|style|strong|b\b|br\b|ul|ol|li|h[1-6])\b[\s\S]*>/i.test(
    texto,
  );
};

const normalizarHtml = (contenido: string): string => {
  const texto = (contenido ?? "").trim();
  if (!texto) return "";
  if (/\s*<!DOCTYPE\b/i.test(texto) || /\s*<html\b/i.test(texto)) {
    return texto;
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.45}</style></head><body>${texto}</body></html>`;
};

const cuerpoPlano = (e: Email): string => {
  if (e.cuerpoHtml && esHtml(e.cuerpoHtml)) return textoSinHtml(e.cuerpoHtml);
  if (e.contenidoResumen && esHtml(e.contenidoResumen))
    return textoSinHtml(e.contenidoResumen);
  return e.contenidoResumen ?? "";
};

const citarMensaje = (e: Email): string => {
  const cuerpo = cuerpoPlano(e).slice(0, 8000);
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

export const EmailsView: React.FC<EmailsViewProps> = ({
  emails,
  postulaciones,
  empresas,
  onCreateEmail,
  onDeleteEmail,
  onCrearPostulacionDesdeEmail,
  onComposeEmail,
}) => {
  const [search, setSearch] = useState("");
  const [direccion, setDireccion] = useState<"todos" | "recibidos" | "enviados">("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [pagina, setPagina] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  useEffect(() => {
    setPagina(1);
  }, [search, direccion, desde, hasta]);

  const [postulacionId, setPostulacionId] = useState<string>("");
  const [tipo, setTipo] = useState<TipoEmail>("seguimiento");
  const [asunto, setAsunto] = useState("");
  const [remitente, setRemitente] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [enviado, setEnviado] = useState<0 | 1>(1);
  const [contenidoResumen, setContenidoResumen] = useState("");

  const postInfo = (e: Email) =>
    postulacionVista(e.postulacionId, postulaciones, empresas);

  const filtered = emails.filter((e) => {
    if (direccion === "recibidos" && e.enviado !== 0) return false;
    if (direccion === "enviados" && e.enviado !== 1) return false;
    const dia = fechaDia(e.fecha);
    if (desde && dia < desde) return false;
    if (hasta && dia > hasta) return false;
    const { empresa: empleo, postulacion: p } = postInfo(e);
    const termino = search.toLowerCase();
    return (
      (e.asunto ?? "").toLowerCase().includes(termino) ||
      empleo.toLowerCase().includes(termino) ||
      (p?.puesto ?? "").toLowerCase().includes(termino) ||
      e.remitente.toLowerCase().includes(termino) ||
      e.destinatario.toLowerCase().includes(termino)
    );
  });

  const sorted = [...filtered].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const totalPaginas = Math.max(1, Math.ceil(sorted.length / PAGINA_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * PAGINA_SIZE;
  const visibles = sorted.slice(inicio, inicio + PAGINA_SIZE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postulacionId || !remitente.trim() || !destinatario.trim()) return;

    await onCreateEmail({
      postulacionId: Number(postulacionId),
      gmailMessageId: null,
      tipo,
      tipoSeguimiento: null,
      asunto: asunto.trim() || null,
      remitente: remitente.trim(),
      destinatario: destinatario.trim(),
      fecha,
      enviado,
      contenidoResumen: contenidoResumen.trim() || null,
    });

    setPostulacionId("");
    setAsunto("");
    setRemitente("");
    setDestinatario("");
    setContenidoResumen("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Emails"
        subtitle="Historial de correos enviados y recibidos por postulación"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4 text-black" />}
          >
            Registrar email
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por asunto, empresa, puesto o dirección..."
          className="flex-1"
        />

        <div className="flex items-center gap-1 rounded-lg bg-[#101412] border border-[#232C28] p-1 shrink-0">
          {(
            [
              { valor: "todos", etiqueta: "Todos" },
              { valor: "recibidos", etiqueta: "Recibidos" },
              { valor: "enviados", etiqueta: "Enviados" },
            ] as const
          ).map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => setDireccion(opcion.valor)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                direccion === opcion.valor
                  ? "bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/30"
                  : "text-[#A7B0AA] hover:text-[#F2F5F3] border border-transparent"
              }`}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-[#A7B0AA]">
          <span>Desde</span>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="bg-[#101412] border border-[#232C28] rounded-lg px-3 py-1.5 text-xs text-[#F2F5F3] focus:outline-none focus:border-[#22C55E]/60"
          />
          <span>Hasta</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="bg-[#101412] border border-[#232C28] rounded-lg px-3 py-1.5 text-xs text-[#F2F5F3] focus:outline-none focus:border-[#22C55E]/60"
          />
          {(desde || hasta) && (
            <button
              type="button"
              onClick={() => {
                setDesde("");
                setHasta("");
              }}
              className="text-[#22C55E] hover:text-[#4ADE80] underline cursor-pointer"
            >
              Limpiar fechas
            </button>
          )}
        </div>
        <span className="text-xs text-[#69736D] sm:ml-auto">
          {sorted.length > 0
            ? `Mostrando ${inicio + 1}–${inicio + visibles.length} de ${sorted.length} correos`
            : "Sin correos en el rango"}
        </span>
      </div>

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <EmptyState
            icon={<Mail className="w-10 h-10 mx-auto text-[#69736D]" />}
            title="No hay emails registrados"
            description='Usá el botón "Actualizar" para sincronizar tu bandeja de Gmail, o registrá manualmente los correos por postulación.'
            compact
          />
        ) : (
          visibles.map((item) => {
            const { empresa: empleo, postulacion: p } = postInfo(item);
            const enviadoOk = item.enviado === 1;
            const esPostulado = item.postulacionId !== null && p !== undefined;
            const accento =
              esPostulado && p ? ESTADO_COLORS[p.estado] ?? "#22C55E" : null;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl skeuo-card-interactive flex items-start gap-4 cursor-pointer ${
                  esPostulado ? "bg-[#101613]" : ""
                }`}
                style={accento ? { boxShadow: `inset 4px 0 0 ${accento}` } : undefined}
                onClick={() => setSelectedEmail(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSelectedEmail(item);
                }}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                    esPostulado && accento
                      ? "bg-[#181D1B] text-[#4ADE80]"
                      : enviadoOk
                        ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
                        : "bg-[#181D1B] border-[#26312B] text-[#A7B0AA]"
                  }`}
                  style={
                    esPostulado && accento
                      ? { borderColor: accento, color: accento }
                      : undefined
                  }
                >
                  {esPostulado ? (
                    <Briefcase className="w-4 h-4" />
                  ) : enviadoOk ? (
                    <Send className="w-4 h-4" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className={`text-sm truncate ${esPostulado ? "font-bold text-[#F2F5F3]" : "font-semibold text-[#F2F5F3]"}`}>
                      {item.asunto || "(Sin asunto)"}
                    </h4>
                    <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-white/[0.04] text-[#A7B0AA] border border-white/[0.05]">
                      {TIPO_EMAIL_LABELS[item.tipo]}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                        enviadoOk
                          ? "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30"
                          : item.tipo === "respuesta"
                            ? "text-sky-400 bg-sky-500/10 border-sky-500/30"
                            : "text-amber-400 bg-amber-500/10 border-amber-500/30"
                      }`}
                    >
                      {enviadoOk ? "Enviado" : item.tipo === "respuesta" ? "Recibido" : "Borrador"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#A7B0AA] mt-1">
                    {esPostulado && p && accento ? (
                      <>
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-black"
                          style={{ background: accento }}
                        >
                          <Briefcase className="w-3 h-3" />
                          Postulado
                        </span>
                        <span className="font-bold text-sm text-[#4ADE80]">
                          {empleo}
                        </span>
                        <span className="font-medium text-sm text-[#F2F5F3]">
                          {p.puesto}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{
                            color: accento,
                            borderColor: `${accento}55`,
                            background: `${accento}1A`,
                          }}
                        >
                          {ESTADO_LABELS[p.estado] ?? p.estado}
                        </span>
                      </>
                    ) : (
                      <>
                        {item.postulacionId === null ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase px-2 py-0.5 rounded border text-stone-400 bg-stone-500/10 border-stone-500/30">
                            Sin asociar
                          </span>
                        ) : (
                          <span className="font-semibold text-[#A7B0AA]">{empleo}</span>
                        )}
                        {p && <span>•</span>}
                        {p && <span>{p.puesto}</span>}
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#69736D]" />
                      {item.fecha}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-[11px] text-[#69736D] mt-1">
                    <span>
                      <span className="text-[#A7B0AA]">De:</span> {item.remitente}
                    </span>
                    <span>
                      <span className="text-[#A7B0AA]">Para:</span> {item.destinatario}
                    </span>
                  </div>

                  {item.contenidoResumen && (
                    <p className="text-xs text-[#8A968F] mt-2 italic line-clamp-2">
                      "{esHtml(item.contenidoResumen) ? textoSinHtml(item.contenidoResumen) : item.contenidoResumen}"
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEmail(item.id);
                  }}
                  className="p-2 text-[#69736D] hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                  title="Eliminar email"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-xs text-[#69736D]">
            Página {paginaActual} de {totalPaginas}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={paginaActual <= 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-[#232C28] text-[#A7B0AA] hover:text-[#F2F5F3] hover:border-[#22C55E]/40 disabled:opacity-40 disabled:hover:text-[#A7B0AA] disabled:hover:border-[#232C28] disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </button>
            <button
              type="button"
              disabled={paginaActual >= totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-[#232C28] text-[#A7B0AA] hover:text-[#F2F5F3] hover:border-[#22C55E]/40 disabled:opacity-40 disabled:hover:text-[#A7B0AA] disabled:hover:border-[#232C28] disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Siguiente
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar email"
        description="Agregá un correo enviado o recibido vinculado a una postulación."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Postulación vinculada"
            value={postulacionId}
            onChange={(e) => setPostulacionId(e.target.value)}
            required
            options={[
              { value: "", label: "Seleccionar postulación..." },
              ...postulaciones.map((p) => ({
                value: p.id,
                label: `${nombreEmpresa(empresas, p.empresaId)} — ${p.puesto}`,
              })),
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Tipo de email"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoEmail)}
              options={[
                { value: "postulacion", label: "Postulación" },
                { value: "seguimiento", label: "Seguimiento" },
                { value: "respuesta", label: "Respuesta" },
                { value: "otro", label: "Otro" },
              ]}
            />

            <Input
              label="Fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Remitente"
              placeholder="turemail@gmail.com"
              type="email"
              value={remitente}
              onChange={(e) => setRemitente(e.target.value)}
              required
            />
            <Input
              label="Destinatario"
              placeholder="reclutador@empresa.com"
              type="email"
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
              required
            />
          </div>

          <Input
            label="Asunto"
            placeholder="Asunto del correo..."
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enviado === 1}
              onChange={(e) => setEnviado(e.target.checked ? 1 : 0)}
              className="accent-[#22C55E] w-4 h-4 rounded"
            />
            <span className="text-xs font-medium text-[#F2F5F3]">
              Fue enviado (si está desmarcado se registra como recibido/borrador)
            </span>
          </label>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#A7B0AA]">
              Resumen del contenido
            </label>
            <textarea
              rows={2}
              placeholder="Resumen breve del contenido..."
              value={contenidoResumen}
              onChange={(e) => setContenidoResumen(e.target.value)}
              className="w-full skeuo-input rounded-[10px] text-xs p-3 focus:outline-none placeholder:text-[#69736D]"
            />
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<CheckCircle2 className="w-4 h-4 text-black" />}
            >
              Guardar email
            </Button>
          </div>
        </form>
      </Modal>

      {/* Email reader modal */}
      <Modal
        isOpen={Boolean(selectedEmail)}
        onClose={() => setSelectedEmail(null)}
        title={selectedEmail?.asunto || "(Sin asunto)"}
        description={selectedEmail ? `Email ${selectedEmail.enviado === 1 ? "enviado" : "recibido"}` : undefined}
        maxWidth="4xl"
      >
        {selectedEmail && (() => {
          const contenidoHtml = esHtml(selectedEmail.cuerpoHtml)
            ? (selectedEmail.cuerpoHtml ?? "")
            : esHtml(selectedEmail.contenidoResumen)
              ? (selectedEmail.contenidoResumen ?? "")
              : "";
          const textoPlano = !contenidoHtml
            ? (selectedEmail.cuerpoHtml ||
              (selectedEmail.contenidoResumen &&
                !esHtml(selectedEmail.contenidoResumen)
                ? selectedEmail.contenidoResumen
                : "") ||
              "(Sin contenido)")
            : "";
          const escribir = (modo: "responder" | "reenviar") => {
            if (!selectedEmail || !onComposeEmail) return;
            const prefill = {
              destinatario:
                modo === "reenviar"
                  ? ""
                  : selectedEmail.enviado === 1
                    ? (selectedEmail.destinatario ?? "")
                    : (selectedEmail.remitente ?? ""),
              asunto: armarPrefijoAsunto(selectedEmail.asunto, modo),
              cuerpo: citarMensaje(selectedEmail),
            };
            setSelectedEmail(null);
            onComposeEmail(prefill);
          };

          return (
            <div className="space-y-4">
              <div className="space-y-1 text-xs text-[#A7B0AA]">
                <p>
                  <span className="text-[#F2F5F3] font-semibold">De:</span>{" "}
                  {selectedEmail.remitente}
                </p>
                <p>
                  <span className="text-[#F2F5F3] font-semibold">Para:</span>{" "}
                  {selectedEmail.destinatario}
                </p>
                <p>
                  <span className="text-[#F2F5F3] font-semibold">Fecha:</span>{" "}
                  {selectedEmail.fecha}
                </p>
              </div>

              {contenidoHtml ? (
                <div className="rounded-[12px] bg-white overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.08)]">
                  <iframe
                    sandbox=""
                    title="Contenido del email"
                    srcDoc={normalizarHtml(contenidoHtml)}
                    className="w-full"
                    style={{
                      border: 0,
                      background: "#fff",
                      height: "min(65vh, 720px)",
                      minHeight: 420,
                    }}
                  />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 p-4 rounded-[12px] bg-white max-h-[65vh] min-h-[280px] overflow-y-auto">
                  {textoPlano}
                </pre>
              )}

              <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  {onComposeEmail && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Reply className="w-4 h-4" />}
                        onClick={() => escribir("responder")}
                      >
                        Responder
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Forward className="w-4 h-4" />}
                        onClick={() => escribir("reenviar")}
                      >
                        Reenviar
                      </Button>
                    </>
                  )}
                </div>

                {selectedEmail.postulacionId === null && (
                  <div className="ml-auto">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Briefcase className="w-4 h-4 text-black" />}
                      onClick={() => {
                        const email = selectedEmail;
                        setSelectedEmail(null);
                        onCrearPostulacionDesdeEmail(email);
                      }}
                    >
                      Agregar como postulación
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};