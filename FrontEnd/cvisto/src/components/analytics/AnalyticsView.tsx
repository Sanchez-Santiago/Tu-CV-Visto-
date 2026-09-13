import React from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Award, 
  Zap, 
  CheckCircle2, 
  Layers, 
  MapPin,
  Sparkles
} from "lucide-react";
import type { Postulacion } from "@/src/schemas/postulacion";
import type { Email } from "@/src/schemas/email";
import type { EstadisticasEstrategia } from "@/src/lib/api/client";

interface AnalyticsViewProps {
  postulaciones: Postulacion[];
  emails?: Email[];
  estadisticas?: EstadisticasEstrategia | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  postulaciones,
  emails = [],
  estadisticas = null,
}) => {
  const total = postulaciones.length || 1;
  const enProceso = postulaciones.filter(
    (p) => p.estado === "en_proceso" || p.estado === "entrevista" || p.estado === "oferta" || p.estado === "aceptado"
  ).length;
  const entrevistas = postulaciones.filter(
    (p) => p.estado === "entrevista" || p.estado === "oferta" || p.estado === "aceptado"
  ).length;
  const ofertas = postulaciones.filter(
    (p) => p.estado === "oferta" || p.estado === "aceptado"
  ).length;
  const aceptados = postulaciones.filter((p) => p.estado === "aceptado").length;

  const respondidas = estadisticas?.respondidas ?? postulaciones.filter((p) => p.respondio === 1).length;
  const tasaRespuesta = estadisticas?.tasa_respuesta ?? Math.round((respondidas / total) * 100);
  const tasaEntrevista = Math.round((entrevistas / total) * 100);
  const tasaOferta = Math.round((ofertas / total) * 100);

  // Tiempo promedio de respuesta: días entre el primer email enviado y la primera respuesta
  function tiempoPromedioRespuesta(): string {
    const porPostulacion = new Map<number, { envio: string | null; respuesta: string | null }>();
    for (const email of emails) {
      const dato = porPostulacion.get(email.postulacionId) ?? { envio: null, respuesta: null };
      if (email.enviado === 1 && (!dato.envio || email.fecha < dato.envio)) {
        dato.envio = email.fecha;
      }
      if (email.tipo === "respuesta" && email.enviado === 0 && (!dato.respuesta || email.fecha < dato.respuesta)) {
        dato.respuesta = email.fecha;
      }
      porPostulacion.set(email.postulacionId, dato);
    }
    let acumulado = 0;
    let casos = 0;
    for (const dato of porPostulacion.values()) {
      if (dato.envio && dato.respuesta) {
        const dias = (new Date(dato.respuesta).getTime() - new Date(dato.envio).getTime()) / 86_400_000;
        if (dias >= 0) {
          acumulado += dias;
          casos += 1;
        }
      }
    }
    if (casos === 0) return "—";
    return `${(acumulado / casos).toFixed(1)} días`;
  }

  const tiempoRespuesta = tiempoPromedioRespuesta();
  const mailsEnviados = emails.filter((e) => e.enviado === 1).length;
  const mailsRecibidos = emails.filter((e) => e.tipo === "respuesta" || e.enviado === 0).length;

  // Modality stats
  const remotos = postulaciones.filter((p) => p.modalidad === "remoto").length;
  const hibridos = postulaciones.filter((p) => p.modalidad === "hibrido").length;
  const presenciales = postulaciones.filter((p) => p.modalidad === "presencial").length;

  const funnelSteps = [
    { label: "Postulaciones Totales", count: total, pct: 100, color: "bg-[#22C55E]" },
    { label: "Primer Contacto / En Proceso", count: enProceso, pct: tasaRespuesta, color: "bg-sky-400" },
    { label: "Entrevistas Técnicas / HR", count: entrevistas, pct: tasaEntrevista, color: "bg-emerald-400" },
    { label: "Ofertas Formales Recibidas", count: ofertas, pct: tasaOferta, color: "bg-teal-300" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#F2F5F3] font-['Inter']">
          Estadísticas & Conversión
        </h2>
        <p className="text-xs text-[#A7B0AA] mt-0.5">
          Análisis cuantitativo de efectividad en tu búsqueda laboral
        </p>
      </div>

      {/* Top High-level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="skeuo-surface p-4.5 space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A7B0AA]">
            Tasa de Respuesta
          </span>
          <p className="text-2xl font-bold text-[#4ADE80] font-['Inter']">
            {tasaRespuesta}%
          </p>
          <span className="text-[11px] text-[#69736D]">
            {respondidas} de {postulaciones.length} postulaciones respondidas
          </span>
        </div>

        <div className="skeuo-surface p-4.5 space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A7B0AA]">
            Pase a Entrevistas
          </span>
          <p className="text-2xl font-bold text-[#22C55E] font-['Inter']">
            {tasaEntrevista}%
          </p>
          <span className="text-[11px] text-[#69736D]">
            {entrevistas} procesos activos con entrevista
          </span>
        </div>

        <div className="skeuo-surface p-4.5 space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A7B0AA]">
            Tiempo Prom. Respuesta
          </span>
          <p className="text-2xl font-bold text-sky-400 font-['Inter']">
            {tiempoRespuesta}
          </p>
          <span className="text-[11px] text-[#69736D]">
            Desde envío hasta primera respuesta
          </span>
        </div>

        <div className="skeuo-surface p-4.5 space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A7B0AA]">
            Ratio Oferta / Entrevista
          </span>
          <p className="text-2xl font-bold text-emerald-300 font-['Inter']">
            {entrevistas > 0 ? Math.round((ofertas / entrevistas) * 100) : 0}%
          </p>
          <span className="text-[11px] text-[#69736D]">
            {mailsEnviados} mails enviados • {mailsRecibidos} recibidos
          </span>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="skeuo-surface p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#222A26]">
          <div>
            <h3 className="text-sm font-semibold text-[#F2F5F3]">
              Embudo de Conversión (Hiring Funnel)
            </h3>
            <p className="text-xs text-[#A7B0AA] mt-0.5">
              Visualización de caída y avance entre cada fase del proceso
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full border border-[#22C55E]/20">
            <Sparkles className="w-3 h-3" /> Saludable
          </span>
        </div>

        <div className="space-y-4">
          {funnelSteps.map((step, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#F2F5F3]">{step.label}</span>
                <span className="text-[#A7B0AA]">
                  <strong className="text-[#F2F5F3]">{step.count}</strong> ({step.pct}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#101412] overflow-hidden p-0.5 border border-[#232C28]">
                <div
                  className={`h-full rounded-full ${step.color} transition-all duration-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]`}
                  style={{ width: `${Math.max(step.pct, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown: Modality Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="skeuo-surface p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#F2F5F3] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#22C55E]" /> Distribución por Modalidad
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#A7B0AA]">Remoto:</span>
              <span className="font-bold text-[#22C55E]">
                {remotos} ({Math.round((remotos / total) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#101412] overflow-hidden">
              <div
                className="h-full bg-[#22C55E]"
                style={{ width: `${(remotos / total) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#A7B0AA]">Híbrido:</span>
              <span className="font-bold text-sky-400">
                {hibridos} ({Math.round((hibridos / total) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#101412] overflow-hidden">
              <div
                className="h-full bg-sky-400"
                style={{ width: `${(hibridos / total) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#A7B0AA]">Presencial:</span>
              <span className="font-bold text-zinc-400">
                {presenciales} ({Math.round((presenciales / total) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#101412] overflow-hidden">
              <div
                className="h-full bg-zinc-600"
                style={{ width: `${(presenciales / total) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Insight Box */}
        <div className="skeuo-surface p-5 flex flex-col justify-between space-y-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#22C55E]">
              <Zap className="w-3.5 h-3.5" /> Consejo Táctico
            </span>
            <h4 className="text-sm font-bold text-[#F2F5F3] mt-1">
              Optimización para rol de IT Support Analyst
            </h4>
            <p className="text-xs text-[#A7B0AA] mt-2 leading-relaxed">
              Tu tasa de pase a entrevista técnica es sólida (superior al promedio de 18% en IT). 
              Asegurate de enviar el email de agradecimiento post-entrevista dentro de las primeras 24 horas para mantener tu perfil en el top of mind del panel evaluador.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#101412] border border-[#232C28] text-xs text-[#69736D]">
            Basado en tus {total} postulaciones y {entrevistas} entrevistas registradas en CVisto.
          </div>
        </div>
      </div>
    </div>
  );
};
