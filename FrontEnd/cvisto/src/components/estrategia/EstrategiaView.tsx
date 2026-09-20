import React, { useState } from "react";
import {
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  Target,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Inbox,
  Sparkles,
  Mail,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import type { NavView } from "@/src/components/layout/Sidebar";
import { useFirmas } from "@/src/hooks/useFirmas";
import { LinkedEmailsModal } from "@/src/components/emails/LinkedEmailsModal";
import type { Email } from "@/src/schemas/email";
import type { Firma } from "@/src/schemas/firma";
import type {
  ResumenSincronizacion,
  ResumenAnalisisIA,
  TipoRespuestaDetectada,
} from "@/src/lib/api/client";

interface EstrategiaViewProps {
  renovaciones: import("@/src/lib/api/client").RenovacionCandidata[];
  estadisticas: import("@/src/lib/api/client").EstadisticasEstrategia | null;
  cargando: boolean;
  error: string | null;
  emails?: Email[];
  firmas?: Firma[];
  onSincronizar: (dias: number) => Promise<ResumenSincronizacion>;
  onAnalizar: () => Promise<ResumenAnalisisIA>;
  onRenovar: (
    items: { postulacion_id: number; asunto?: string; cuerpo?: string }[],
    firmas?: number[],
  ) => Promise<unknown>;
  onNavigate: (view: NavView) => void;
  onComposeEmail?: (prefill: {
    destinatario: string;
    asunto: string;
    cuerpo: string;
  }) => void;
}

const tipoRespuestaLabels: Record<TipoRespuestaDetectada, string> = {
  rechazo: "Rechazo",
  entrevista: "Entrevista",
  oferta: "Oferta",
  novedad: "Novedad",
  contacto: "Contacto",
  otro: "Otro",
};

const tipoSugeridoLabels: Record<string, string> = {
  consulta: "Consulta",
  novedad: "Novedad",
  recordatorio: "Recordatorio",
  nuevo_proyecto: "Nuevo proyecto",
  disponibilidad: "Disponibilidad",
};

export const EstrategiaView: React.FC<EstrategiaViewProps> = ({
  renovaciones,
  estadisticas,
  cargando,
  error,
  emails = [],
  firmas: firmasProp,
  onSincronizar,
  onAnalizar,
  onRenovar,
  onNavigate,
  onComposeEmail,
}) => {
  const [sincronizando, setSincronizando] = useState(false);
  const [analizandoIA, setAnalizandoIA] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resumen, setResumen] = useState<ResumenSincronizacion | null>(null);
  const [resumenIA, setResumenIA] = useState<ResumenAnalisisIA | null>(null);
  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "err";
    texto: string;
  } | null>(null);

  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [mailsPostulacion, setMailsPostulacion] = useState<{
    postulacion_id: number;
    empresa: string;
    puesto: string;
  } | null>(null);
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());
  const [ediciones, setEdiciones] = useState<
    Record<number, { asunto: string; cuerpo: string }>
  >({});

  const firmas = useFirmas();
  const [incluirFirma, setIncluirFirma] = useState<boolean>(true);
  const [firmaSeleccionadaId, setFirmaSeleccionadaId] = useState<string>("");

  React.useEffect(() => {
    if (!firmaSeleccionadaId && firmas.data.length > 0) {
      setFirmaSeleccionadaId(String(firmas.data[0].id));
    }
  }, [firmas.data, firmaSeleccionadaId]);

  const toggleSeleccion = (id: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpandido = (id: number) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSincronizar = async () => {
    setSincronizando(true);
    setMensaje(null);
    try {
      const r = await onSincronizar(14);
      setResumen(r);
      setMensaje({
        tipo: "ok",
        texto: `Datos actualizados: ${r.importados} mails nuevos, ${r.yaExistentes} ya registrados, ${r.sinMatch} sin postulación asociada y ${r.estados_actualizados} estado(s) actualizado(s).`,
      });
    } catch (e) {
      setMensaje({ tipo: "err", texto: mensajeError(e) });
    } finally {
      setSincronizando(false);
    }
  };

  const handleAnalizar = async () => {
    setAnalizandoIA(true);
    setMensaje(null);
    try {
      const r = await onAnalizar();
      setResumenIA(r);
      setMensaje({
        tipo: r.estados_actualizados > 0 ? "ok" : "ok",
        texto:
          r.estados_actualizados > 0
            ? `IA: ${r.rechazos} rechazo(s), ${r.entrevistas} entrevista(s) y ${r.ofertas} oferta(s). ${r.estados_actualizados} estado(s) actualizado(s).`
            : r.analizados > 0
              ? `IA: ${r.analizados} email(s) clasificado(s), sin cambios de estado.`
              : "IA: sin emails pendientes de clasificar.",
      });
    } catch (e) {
      setMensaje({ tipo: "err", texto: mensajeError(e) });
    } finally {
      setAnalizandoIA(false);
    }
  };

  const handleRenovar = async () => {
    setEnviando(true);
    setMensaje(null);
    try {
      const items = renovaciones
        .filter((r) => seleccionados.has(r.postulacion_id))
        .map((r) => {
          const edicion = ediciones[r.postulacion_id];
          return {
            postulacion_id: r.postulacion_id,
            asunto: edicion?.asunto.trim() || undefined,
            cuerpo: edicion?.cuerpo.trim() || undefined,
          };
        });
      if (items.length === 0) {
        setMensaje({ tipo: "err", texto: "Seleccioná al menos una renovación." });
        return;
      }
      const firmasIds =
        incluirFirma && firmaSeleccionadaId
          ? [Number(firmaSeleccionadaId)]
          : undefined;
      const resultado = await onRenovar(items, firmasIds);
      const enviados =
        typeof resultado === "object" && resultado !== null
          ? Number((resultado as { enviados?: number }).enviados ?? 1)
          : items.length;
      setSeleccionados(new Set());
      setMensaje({ tipo: "ok", texto: `${enviados} seguimiento(s) enviado(s) correctamente.` });
    } catch (e) {
      setMensaje({ tipo: "err", texto: mensajeError(e) });
    } finally {
      setEnviando(false);
    }
  };

  const maxMensual = Math.max(1, ...(estadisticas?.mails_por_mes.map((m) => m.enviados + m.recibidos) ?? [0]));

  return (
    <div className="space-y-6">
      {/* Actions + message */}
      {mensaje && (
        <div
          className={`flex items-start gap-3 rounded-xl p-4 border ${
            mensaje.tipo === "ok"
              ? "bg-[#22C55E]/[0.06] border-[#22C55E]/25"
              : "bg-rose-500/[0.06] border-rose-500/25"
          }`}
        >
          {mensaje.tipo === "ok" ? (
            <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <p className="text-xs text-[#D6DCD8] leading-relaxed">{mensaje.texto}</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl p-4 border border-rose-500/25 bg-rose-500/[0.06]">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <p className="text-xs text-[#D6DCD8]">{error}</p>
        </div>
      )}

      {/* Sincronizar Gmail */}
      <div className="skeuo-surface p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#F2F5F3] flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#22C55E]" /> Sincronización con Gmail
            </h3>
            <p className="text-xs text-[#A7B0AA] mt-0.5">
              Busca respuestas a tus postulaciones en la bandeja de entrada y las clasifica automáticamente.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            isLoading={sincronizando}
            onClick={handleSincronizar}
            leftIcon={<RefreshCw className="w-4 h-4 text-black" />}
          >
            {sincronizando ? "Actualizando..." : "Actualizar"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            isLoading={analizandoIA}
            onClick={handleAnalizar}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Analizar con IA
          </Button>
        </div>

        {resumen && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Kpi label="Mails importados" value={resumen.importados} />
            <Kpi label="Ya registrados" value={resumen.yaExistentes} />
            <Kpi label="Sin asociar" value={resumen.sinMatch} warn={resumen.sinMatch > 0} />
            <Kpi label="Estados actualizados" value={resumen.estados_actualizados} highlight={resumen.estados_actualizados > 0} />
            <div className="skeuo-surface p-3 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A7B0AA]">
                Clasificación
              </span>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                {(Object.entries(resumen.resumen) as [TipoRespuestaDetectada, number][]).map(
                  ([tipo, cantidad]) =>
                    cantidad > 0 ? (
                      <span
                        key={tipo}
                        className={`font-semibold ${
                          tipo === "rechazo"
                            ? "text-rose-400"
                            : tipo === "entrevista"
                              ? "text-[#22C55E]"
                              : tipo === "oferta"
                                ? "text-violet-300"
                                : "text-[#D6DCD8]"
                        }`}
                      >
                        {tipoRespuestaLabels[tipo]}: {cantidad}
                      </span>
                    ) : null,
                )}
              </div>
            </div>
          </div>
        )}

        {resumen && resumen.detalle.length > 0 && (
          <div className="space-y-2">
            {resumen.detalle.slice(0, 8).map((d) => (
              <div
                key={`${d.postulacion_id}-${d.tipo_respuesta}-${d.fecha}`}
                className="flex items-start gap-3 text-xs rounded-lg p-2.5 bg-[#101412] border border-[#232C28]"
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 ${
                    d.tipo_respuesta === "rechazo"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      : d.tipo_respuesta === "entrevista"
                        ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30"
                        : d.tipo_respuesta === "oferta"
                          ? "bg-violet-500/10 text-violet-300 border border-violet-500/30"
                          : "bg-white/[0.04] text-[#A7B0AA] border border-white/[0.06]"
                  }`}
                >
                  {tipoRespuestaLabels[d.tipo_respuesta]}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-[#F2F5F3]">
                    {d.empresa}
                    <span className="text-[#69736D] font-normal"> • {d.fecha}</span>
                  </p>
                  <p className="text-[#A7B0AA] line-clamp-1">{d.snippet}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Renovaciones */}
      <div className="skeuo-surface p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#F2F5F3] flex items-center gap-2">
              <Target className="w-4 h-4 text-[#22C55E]" /> Renovaciones sugeridas
            </h3>
            <p className="text-xs text-[#A7B0AA] mt-0.5">
              Postulaciones vencidas que esperan respuesta. Editá la vista previa y enviá en lote.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            isLoading={enviando}
            disabled={seleccionados.size === 0}
            onClick={handleRenovar}
            leftIcon={<Send className="w-4 h-4 text-black" />}
          >
            Enviar {seleccionados.size > 0 ? `${seleccionados.size} seleccionada(s)` : "seleccionadas"}
          </Button>
        </div>

        {/* Selector de firma para envíos en lote */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#101412] border border-[#222A26]">
          {firmas.data.length > 0 ? (
            <>
              <label className="flex items-center gap-2 text-xs text-[#A7B0AA] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={incluirFirma}
                  onChange={(e) => setIncluirFirma(e.target.checked)}
                  className="rounded accent-[#22C55E]"
                />
                Incluir firma
              </label>
              {incluirFirma && (
                <select
                  value={firmaSeleccionadaId}
                  onChange={(e) => setFirmaSeleccionadaId(e.target.value)}
                  className="text-xs bg-[#141817] border border-[#222A26] text-[#F2F5F3] rounded-lg px-2 py-1 focus:outline-none focus:border-[#22C55E]"
                >
                  {firmas.data.map((f) => (
                    <option key={f.id} value={String(f.id)}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
              )}
            </>
          ) : (
            <p className="text-xs text-[#69736D]">
              No tenés firmas guardadas.{" "}
              <button
                type="button"
                onClick={() => onNavigate("configuracion")}
                className="text-[#22C55E] hover:text-[#4ADE80] font-medium underline-offset-2 hover:underline cursor-pointer"
              >
                Creá una firma en Ajustes
              </button>{" "}
              para incluirla en los envíos.
            </p>
          )}
        </div>

        {cargando ? (
          <p className="text-xs text-[#69736D] animate-pulse">Cargando renovaciones...</p>
        ) : renovaciones.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-[#69736D]" />
            <p className="text-sm font-semibold text-[#F2F5F3]">Sin renovaciones pendientes</p>
            <p className="text-xs text-[#A7B0AA]">
              Todas tus postulaciones activas están dentro del plazo de contacto.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {renovaciones.map((r) => {
              const expandido = expandidos.has(r.postulacion_id);
              const edicion = ediciones[r.postulacion_id] ?? {
                asunto: r.asunto_sugerido,
                cuerpo: r.cuerpo_sugerido,
              };
              const sinDestino = !r.destinatario;
              return (
                <div
                  key={r.postulacion_id}
                  className={`rounded-xl border transition-colors ${
                    sinDestino
                      ? "border-amber-500/25 bg-amber-500/[0.03]"
                      : "border-[#232C28] bg-[#101412]"
                  }`}
                >
                  <div className="flex items-start gap-3 p-3.5">
                    <input
                      type="checkbox"
                      checked={seleccionados.has(r.postulacion_id)}
                      onChange={() => toggleSeleccion(r.postulacion_id)}
                      disabled={sinDestino}
                      className="accent-[#22C55E] w-4 h-4 mt-1 rounded cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#F2F5F3]">{r.empresa}</h4>
                        <span className="text-xs text-[#69736D]">—</span>
                        <span className="text-xs text-[#A7B0AA]">{r.puesto}</span>
                        <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/25">
                          {tipoSugeridoLabels[r.tipo_sugerido] ?? r.tipo_sugerido}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#69736D] mt-1">
                        <span>
                          Sin contacto: <strong className="text-amber-400">{r.dias_desde_ultimo_contacto} días</strong>
                        </span>
                        <span>Mails enviados: {r.cantidad_mails_enviados}</span>
                        {r.destinatario && <span className="text-[#8A968F]">Destino: {r.destinatario}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setMailsPostulacion({
                          postulacion_id: r.postulacion_id,
                          empresa: r.empresa,
                          puesto: r.puesto,
                        })
                      }
                      className="p-1.5 text-[#69736D] hover:text-[#22C55E] rounded-lg hover:bg-[#181D1B] transition-colors cursor-pointer"
                      title="Ver emails vinculados"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleExpandido(r.postulacion_id)}
                      className="p-1.5 text-[#69736D] hover:text-[#F2F5F3] rounded-lg hover:bg-[#181D1B] transition-colors cursor-pointer"
                      title={expandido ? "Contraer vista previa" : "Editar vista previa"}
                    >
                      {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {sinDestino && (
                    <p className="px-3.5 pb-3 text-[11px] text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Sin destinatario: registrá un email enviado o un contacto RRHH.
                    </p>
                  )}

                  {expandido && (
                    <div className="px-3.5 pb-4 space-y-3 border-t border-white/[0.04] pt-3">
                      <div>
                        <label className="text-[11px] font-medium text-[#A7B0AA]">Asunto</label>
                        <input
                          type="text"
                          value={edicion.asunto}
                          onChange={(e) =>
                            setEdiciones((prev) => ({
                              ...prev,
                              [r.postulacion_id]: { ...edicion, asunto: e.target.value },
                            }))
                          }
                          className="w-full mt-1 skeuo-input rounded-[10px] text-xs p-2.5 focus:outline-none placeholder:text-[#69736D]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[#A7B0AA]">Cuerpo</label>
                        <textarea
                          rows={6}
                          value={edicion.cuerpo}
                          onChange={(e) =>
                            setEdiciones((prev) => ({
                              ...prev,
                              [r.postulacion_id]: { ...edicion, cuerpo: e.target.value },
                            }))
                          }
                          className="w-full mt-1 skeuo-input rounded-[10px] text-xs p-3 focus:outline-none placeholder:text-[#69736D] resize-y leading-relaxed"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Estadísticas rápidas */}
      {estadisticas && (
        <div className="skeuo-surface p-5 space-y-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#22C55E]" />
            <h3 className="text-sm font-semibold text-[#F2F5F3]">Reporte de actividad</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi label="Mails enviados" value={estadisticas.mails_enviados} />
            <Kpi label="Mails recibidos" value={estadisticas.mails_recibidos} />
            <Kpi label="Respondidas" value={`${estadisticas.respondidas}/${estadisticas.total_postulaciones}`} />
            <Kpi label="Tasa de respuesta" value={`${estadisticas.tasa_respuesta}%`} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi
              label="Positivas (entrevista+)"
              value={estadisticas.positivas}
              color="text-[#22C55E]"
            />
            <Kpi label="Rechazadas" value={estadisticas.rechazadas} color="text-rose-400" />
            <Kpi label="Enviados por mes" value="Ver abajo" />
            <Kpi label="Envios por puesto" value="Ver abajo" />
          </div>

          {estadisticas.mails_por_mes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#A7B0AA] uppercase tracking-wider">
                Mails por mes
              </h4>
              <div className="space-y-2">
                {estadisticas.mails_por_mes.map((m) => (
                  <div key={m.mes} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#D6DCD8] font-medium">{m.mes}</span>
                      <span className="text-[#69736D]">
                        {m.enviados} env. / {m.recibidos} rec.
                      </span>
                    </div>
                    <div className="flex gap-1 h-2.5 rounded-full bg-[#101412] overflow-hidden border border-[#232C28]">
                      <div
                        className="bg-[#22C55E]"
                        style={{ width: `${(m.enviados / maxMensual) * 100}%` }}
                      />
                      <div
                        className="bg-sky-400"
                        style={{ width: `${(m.recibidos / maxMensual) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {estadisticas.mails_por_puesto.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#A7B0AA] uppercase tracking-wider">
                Esfuerzo por puesto
              </h4>
              <div className="space-y-1.5">
                {estadisticas.mails_por_puesto.slice(0, 6).map((p) => (
                  <div key={p.puesto} className="flex items-center justify-between text-xs">
                    <span className="text-[#D6DCD8] truncate pr-3">{p.puesto}</span>
                    <span className="text-[#69736D] shrink-0">
                      {p.mails_enviados} mails • {p.respondidas}/{p.postulaciones} respondidas
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resultado del análisis con IA */}
      <Modal
        isOpen={resumenIA !== null}
        onClose={() => setResumenIA(null)}
        title="Análisis con IA"
        description="Clasificación de emails de respuesta, creación de postulaciones detectadas y estados actualizados."
        maxWidth="2xl"
      >
        {resumenIA && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <Kpi label="Analizados" value={resumenIA.analizados} />
              <Kpi label="Rechazos" value={resumenIA.rechazos} color="text-rose-400" />
              <Kpi
                label="Entrevistas"
                value={resumenIA.entrevistas}
                color="text-[#22C55E]"
              />
              <Kpi label="Ofertas" value={resumenIA.ofertas} color="text-violet-300" />
              <Kpi
                label="Estados cambiados"
                value={resumenIA.estados_actualizados}
                highlight={resumenIA.estados_actualizados > 0}
              />
              <Kpi
                label="Postulaciones creadas"
                value={resumenIA.postulaciones_creadas}
                highlight={resumenIA.postulaciones_creadas > 0}
              />
              <Kpi
                label="Vinculadas"
                value={resumenIA.postulaciones_vinculadas}
                highlight={resumenIA.postulaciones_vinculadas > 0}
              />
            </div>

            {resumenIA.detalle.length === 0 ? (
              <p className="text-xs text-[#69736D] py-2">
                No hay correos pendientes de clasificar.
              </p>
            ) : (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#A7B0AA] uppercase tracking-wider">
                  Detalle ({resumenIA.detalle.length})
                </h4>
                <div className="max-h-72 overflow-y-auto space-y-2">
                  {resumenIA.detalle.map((d) => (
                    <div
                      key={d.email_id}
                      className="flex items-start gap-3 text-xs rounded-lg p-2.5 bg-[#101412] border border-[#232C28]"
                    >
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 ${
                          d.tipo_respuesta === "rechazo"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            : d.tipo_respuesta === "entrevista"
                              ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30"
                              : d.tipo_respuesta === "oferta"
                                ? "bg-violet-500/10 text-violet-300 border border-violet-500/30"
                                : "bg-white/[0.04] text-[#A7B0AA] border border-white/[0.06]"
                        }`}
                      >
                        {tipoRespuestaLabels[d.tipo_respuesta]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#F2F5F3]">
                          {d.empresa}
                          {d.puesto ? (
                            <span className="text-[#A7B0AA] font-normal">
                              {" · "}
                              {d.puesto}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[#A7B0AA] line-clamp-1">{d.snippet}</p>
                        {d.postulacion_creada && d.estado_nuevo ? (
                          <p className="text-[11px] text-[#22C55E] mt-0.5">
                            Postulación creada (estado: {d.estado_nuevo})
                          </p>
                        ) : d.vinculado_a_existente ? (
                          <p className="text-[11px] text-[#EAB308] mt-0.5">
                            Vinculada a una postulación existente
                          </p>
                        ) : d.estado_nuevo ? (
                          <p className="text-[11px] text-[#22C55E] mt-0.5">
                            Estado: {d.estado_anterior} → {d.estado_nuevo}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-[10px] uppercase text-[#69736D] shrink-0">
                        {d.fuente === "ia" ? "IA" : "Keywords"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de emails vinculados a la renovación */}
      <LinkedEmailsModal
        isOpen={Boolean(mailsPostulacion)}
        onClose={() => setMailsPostulacion(null)}
        title={
          mailsPostulacion
            ? `${mailsPostulacion.puesto} — ${mailsPostulacion.empresa}`
            : ""
        }
        subtitle="Correos asociados a este proceso de postulación"
        firmas={firmasProp ?? []}
        emails={
          mailsPostulacion
            ? emails.filter(
                (e) =>
                  e.postulacionId !== null &&
                  Number(e.postulacionId) === Number(mailsPostulacion.postulacion_id),
              )
            : []
        }
        onComposeEmail={onComposeEmail}
      />
    </div>
  );
};

function mensajeError(e: unknown): string {
  return e instanceof Error ? e.message : "Error desconocido";
}

function Kpi({
  label,
  value,
  warn,
  color,
  highlight,
}: {
  label: string;
  value: number | string;
  warn?: boolean;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div className="skeuo-surface p-3 space-y-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A7B0AA]">
        {label}
      </span>
      <p
        className={`text-xl font-bold font-['Inter'] ${
          color ?? (warn ? "text-amber-400" : highlight ? "text-sky-400" : "text-[#4ADE80]")
        }`}
      >
        {value}
      </p>
    </div>
  );
}