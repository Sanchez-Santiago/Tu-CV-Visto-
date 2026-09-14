import React, { useMemo, useState } from "react";
import { Sparkles, Calendar, Inbox } from "lucide-react";
import type { Postulacion } from "@/src/schemas/postulacion";
import type { Email } from "@/src/schemas/email";
import { aFechaLocalISO, aMesLocalISO } from "@/src/lib/fechas";

interface ActivityChartProps {
  postulaciones: Postulacion[];
  emails: Email[];
}

interface DataPoint {
  label: string;
  date: string;
  a: number;
  b: number;
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const buildWeeklyData = (
  postulaciones: Postulacion[],
  emails: Email[],
): DataPoint[] => {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(aFechaLocalISO(d));
  }
  const daySet = new Set(days);

  const porDia = (k: string) => (!!k && daySet.has(k) ? k.slice(0, 10) : "");

  const acc = days.reduce((m, d) => {
    m.set(d, { a: 0, b: 0 });
    return m;
  }, new Map<string, { a: number; b: number }>());

  for (const p of postulaciones) {
    const k = porDia(p.fechaPostulacion ?? "");
    if (k) acc.get(k)!.a += 1;
  }
  for (const e of emails) {
    if (e.enviado !== 0 || e.tipo !== "respuesta" || e.postulacionId === null)
      continue;
    const k = porDia(e.fecha.slice(0, 10));
    if (k) acc.get(k)!.b += 1;
  }

  return days.map((d) => {
    const v = acc.get(d)!;
    const date = new Date(`${d}T12:00:00`);
    return {
      label: WEEKDAYS[date.getDay()],
      date: `${date.getDate()} ${MONTHS[date.getMonth()]}`,
      a: v.a,
      b: v.b,
    };
  });
};

const buildMonthlyData = (
  postulaciones: Postulacion[],
  emails: Email[],
): DataPoint[] => {
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(aMesLocalISO(d));
  }
  const monthSet = new Set(months);

  const acc = months.reduce((m, k) => {
    m.set(k, { a: 0, b: 0 });
    return m;
  }, new Map<string, { a: number; b: number }>());

  for (const p of postulaciones) {
    const k = (p.fechaPostulacion ?? "").slice(0, 7);
    if (k && monthSet.has(k)) acc.get(k)!.a += 1;
  }
  for (const e of emails ?? []) {
    if (e.enviado !== 1 || e.postulacionId === null) continue;
    const k = (e.fecha ?? "").slice(0, 7);
    if (k && monthSet.has(k)) acc.get(k)!.b += 1;
  }

  return months.map((k) => {
    const v = acc.get(k)!;
    const [year, month] = k.split("-").map(Number);
    return {
      label: MONTHS[month - 1],
      date: `${MONTHS[month - 1]} ${year}`,
      a: v.a,
      b: v.b,
    };
  });
};

export const ActivityChart: React.FC<ActivityChartProps> = ({
  postulaciones,
  emails,
}) => {
  const [activeRange, setActiveRange] = useState<"semanal" | "mensual">("semanal");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = useMemo(
    () =>
      activeRange === "semanal"
        ? buildWeeklyData(postulaciones, emails)
        : buildMonthlyData(postulaciones, emails),
    [activeRange, postulaciones, emails],
  );

  const total = data.reduce((s, d) => s + d.a + d.b, 0);
  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.a, d.b)), 1);

  const height = 140;
  const width = 460;

  const points = data.map((d, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * (width - 40) + 20;
    const yA = height - (d.a / maxVal) * (height - 30) - 15;
    const yB = height - (d.b / maxVal) * (height - 30) - 15;
    return { x, yA, yB, ...d };
  });

  const buildPath = (
    getY: (p: (typeof points)[number]) => number,
  ) =>
    points.reduce((acc, curr, index) => {
      if (index === 0) return `M ${curr.x} ${getY(curr)}`;
      const prev = points[index - 1];
      const cx = prev.x + (curr.x - prev.x) / 2;
      return `${acc} C ${cx} ${getY(prev)}, ${cx} ${getY(curr)}, ${curr.x} ${getY(curr)}`;
    }, "");

  const pathA = buildPath((p) => p.yA);
  const pathB = buildPath((p) => p.yB);
  const areaD = `${pathA} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const bLabel = activeRange === "semanal" ? "respuestas recibidas" : "mails enviados";

  return (
    <div className="skeuo-surface p-5 sm:p-6 rounded-[16px] flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#F2F5F3]">
              Curva de Actividad
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold tracking-wider text-[#22C55E] bg-[#22C55E]/[0.08] px-2 py-0.5 rounded-full border border-[#22C55E]/20">
              <Sparkles className="w-2.5 h-2.5" /> Ritmo Óptimo
            </span>
          </div>
          <p className="text-xs text-[#A7B0AA] mt-0.5">
            {activeRange === "semanal"
              ? "Postulaciones y respuestas recibidas en los últimos 7 días"
              : "Postulaciones y mails enviados en los últimos 6 meses"}
          </p>
        </div>

        <div className="flex items-center bg-[#0C0F0E] p-0.5 rounded-[10px] border border-white/[0.06]">
          <button
            onClick={() => setActiveRange("semanal")}
            className={`px-2.5 py-1 text-xs rounded-[8px] font-medium transition-all ${
              activeRange === "semanal"
                ? "bg-[#181D1B] text-[#F2F5F3] shadow-xs"
                : "text-[#69736D] hover:text-[#A7B0AA]"
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setActiveRange("mensual")}
            className={`px-2.5 py-1 text-xs rounded-[8px] font-medium transition-all ${
              activeRange === "mensual"
                ? "bg-[#181D1B] text-[#F2F5F3] shadow-xs"
                : "text-[#69736D] hover:text-[#A7B0AA]"
            }`}
          >
            Mensual
          </button>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="relative mt-4 w-full h-[150px] overflow-hidden">
        {total === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
            <Inbox className="w-6 h-6 text-[#69736D]" />
            <p className="text-xs text-[#A7B0AA]">
              Sin actividad en este período
            </p>
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line
                x1="20"
                y1={height - 15}
                x2={width - 20}
                y2={height - 15}
                stroke="rgba(255, 255, 255, 0.04)"
                strokeDasharray="4 4"
              />
              <line
                x1="20"
                y1={(height - 15) / 2}
                x2={width - 20}
                y2={(height - 15) / 2}
                stroke="rgba(255, 255, 255, 0.04)"
                strokeDasharray="4 4"
              />

              {/* Area fill (postulaciones) */}
              <path d={areaD} fill="url(#activityGradient)" />

              {/* Curva entrevistas/mails (violeta) */}
              <path
                d={pathB}
                fill="none"
                stroke="#A78BFA"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="5 4"
              />

              {/* Curva postulaciones (verde) */}
              <path
                d={pathA}
                fill="none"
                stroke="#22C55E"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Interactive Data Nodes */}
              {points.map((p, idx) => {
                const isHovered = hoveredIndex === idx;
                const activePoint = isHovered || (hoveredIndex == null && idx === points.length - 1);
                return (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                  >
                    <circle
                      cx={p.x}
                      cy={p.yA}
                      r={activePoint ? 6 : 4}
                      fill="#121614"
                      stroke="#22C55E"
                      strokeWidth={activePoint ? 2.5 : 1.5}
                      className="transition-all duration-150"
                    />
                    {p.b > 0 && (
                      <circle
                        cx={p.x}
                        cy={p.yB}
                        r={activePoint ? 5 : 3}
                        fill="#121614"
                        stroke="#A78BFA"
                        strokeWidth={activePoint ? 2 : 1.2}
                        className="transition-all duration-150"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover info tooltip */}
            {hoveredIndex !== null && (
              <div className="absolute top-1 right-2 flex items-center gap-3 bg-[#171C19] border border-white/[0.08] px-3 py-1.5 rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.5)] text-xs">
                <span className="text-[#A7B0AA] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#22C55E]" />
                  {data[hoveredIndex].date} ({data[hoveredIndex].label}):
                </span>
                <span className="font-semibold text-[#F2F5F3]">
                  {data[hoveredIndex].a} postulaciones
                </span>
                <span className="flex items-center gap-1 text-[#A78BFA] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
                  {data[hoveredIndex].b} {bLabel}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Labels row */}
      <div className="flex justify-between px-2 pt-2 border-t border-white/[0.05] text-xs text-[#69736D]">
        {data.map((d, i) => (
          <span
            key={i}
            className={`font-medium ${
              hoveredIndex === i ? "text-[#22C55E]" : ""
            }`}
          >
            {d.label}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-3 text-[10px] text-[#69736D]">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" /> Postulaciones
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#A78BFA]" />
          {activeRange === "semanal" ? "Respuestas recibidas" : "Mails enviados"}
        </span>
      </div>
    </div>
  );
};