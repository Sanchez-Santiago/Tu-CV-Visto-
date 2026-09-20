import React from "react";
import { MapPin, Calendar, Edit, Trash2, Mail } from "lucide-react";
import type { Postulacion } from "@/src/schemas/postulacion";
import type { Empresa } from "@/src/schemas/empresa";
import type { EstadoPostulacion } from "@/src/schemas/common";
import { nombreEmpresa } from "@/src/lib/nombres";
import { OPCIONES_ESTADO } from "@/src/lib/estados";

interface ApplicationTableProps {
  postulaciones: Postulacion[];
  empresas: Empresa[];
  onSelect: (p: Postulacion) => void;
  onEdit: (p: Postulacion) => void;
  onDelete: (id: string) => void;
  onQuickStatusChange: (id: string, newEstado: EstadoPostulacion) => void;
  onViewEmails?: (p: Postulacion) => void;
  seleccionados?: Set<string>;
  onToggleSeleccion?: (id: string) => void;
  onToggleTodos?: () => void;
}

export const ApplicationTable: React.FC<ApplicationTableProps> = ({
  postulaciones,
  empresas,
  onSelect,
  onEdit,
  onDelete,
  onQuickStatusChange,
  onViewEmails,
  seleccionados,
  onToggleSeleccion,
  onToggleTodos,
}) => {
  const mostrarSeleccion = Boolean(onToggleSeleccion);
  const todosMarcados =
    mostrarSeleccion &&
    postulaciones.length > 0 &&
    postulaciones.every((p) => seleccionados?.has(p.id));
  return (
    <div className="skeuo-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#222A26] bg-[#101412] text-[#69736D] uppercase text-[11px] font-semibold tracking-wider">
              {mostrarSeleccion && (
                <th className="py-3 pl-4 pr-1 w-10">
                  <input
                    type="checkbox"
                    checked={Boolean(todosMarcados)}
                    onChange={() => onToggleTodos?.()}
                    className="w-3.5 h-3.5 rounded accent-[#22C55E] cursor-pointer"
                    title="Seleccionar visibles"
                  />
                </th>
              )}
              <th className="py-3 px-4">Empresa</th>
              <th className="py-3 px-4">Puesto</th>
              <th className="py-3 px-4">Modalidad</th>
              <th className="py-3 px-4">Interés</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Fecha Aplicada</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1B221E]">
            {postulaciones.map((p) => {
              const empresa = nombreEmpresa(empresas, p.empresaId);
              return (
                <tr
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="hover:bg-[#181D1B] transition-colors cursor-pointer group"
                >
                  {mostrarSeleccion && (
                    <td
                      className="py-3.5 pl-4 pr-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(seleccionados?.has(p.id))}
                        onChange={() => onToggleSeleccion?.(p.id)}
                        className="w-3.5 h-3.5 rounded accent-[#22C55E] cursor-pointer"
                        title="Seleccionar postulación"
                      />
                    </td>
                  )}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#101412] border border-[#26312B] flex items-center justify-center font-bold text-xs text-[#F2F5F3] group-hover:border-[#22C55E]/40 group-hover:text-[#22C55E] transition-colors shadow-xs">
                        {empresa.charAt(0)}
                      </div>
                      <span className="font-semibold text-[#F2F5F3] group-hover:text-[#4ADE80] transition-colors">
                        {empresa}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-[#F2F5F3]">
                    {p.puesto}
                  </td>

                  <td className="py-3.5 px-4 capitalize text-[#A7B0AA]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#69736D]" />
                      {p.modalidad ?? "no especificada"}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 capitalize text-[#D1D9D4]">
                    {p.interes}
                  </td>

                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={p.estado}
                      onChange={(e) =>
                        onQuickStatusChange(p.id, e.target.value as EstadoPostulacion)
                      }
                      className="bg-[#101412] text-xs text-[#F2F5F3] border border-[#2A3530] rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#22C55E] cursor-pointer"
                    >
                      {OPCIONES_ESTADO.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="py-3.5 px-4 text-[#A7B0AA]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#69736D]" />
                      {p.fechaPostulacion ?? "—"}
                    </span>
                  </td>

                  <td
                    className="py-3.5 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {onViewEmails && (
                        <button
                          type="button"
                          onClick={() => onViewEmails(p)}
                          className="p-1.5 rounded hover:bg-[#1C2320] text-[#69736D] hover:text-[#22C55E] transition-colors"
                          title="Ver emails vinculados"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="p-1.5 rounded hover:bg-[#1C2320] text-[#69736D] hover:text-[#F2F5F3] transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        className="p-1.5 rounded hover:bg-[#2A1517] text-[#69736D] hover:text-rose-400 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};