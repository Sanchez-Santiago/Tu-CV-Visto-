import React from "react";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import type { Postulacion } from "@/src/schemas/postulacion";
import type { Empresa } from "@/src/schemas/empresa";
import { Badge } from "@/src/components/ui/Badge";
import { nombreEmpresa } from "@/src/lib/nombres";

interface RecentApplicationsProps {
  postulaciones: Postulacion[];
  empresas: Empresa[];
  onSelectApplication: (postulacion: Postulacion) => void;
  onNavigateToApplications: () => void;
}

export const RecentApplications: React.FC<RecentApplicationsProps> = ({
  postulaciones,
  empresas,
  onSelectApplication,
  onNavigateToApplications,
}) => {
  const recent = postulaciones.slice(0, 5);

  return (
    <div className="skeuo-surface p-5 sm:p-6 rounded-[16px]">
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.05]">
        <div>
          <h3 className="text-sm font-semibold text-[#F2F5F3] tracking-tight">
            Últimas postulaciones
          </h3>
          <p className="text-xs text-[#A7B0AA] mt-0.5">
            Registro cronológico de tus aplicaciones más recientes
          </p>
        </div>
        <button
          onClick={onNavigateToApplications}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#22C55E] hover:text-[#4ADE80] transition-colors cursor-pointer"
        >
          Ver todas ({postulaciones.length}) <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/[0.04] text-[#69736D] uppercase text-[11px] font-medium tracking-wider">
              <th className="py-3 px-3">Empresa</th>
              <th className="py-3 px-3">Puesto</th>
              <th className="py-3 px-3">Modalidad</th>
              <th className="py-3 px-3">Estado</th>
              <th className="py-3 px-3">Fecha</th>
              <th className="py-3 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {recent.map((item) => {
              const empresa = nombreEmpresa(empresas, item.empresaId);
              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectApplication(item)}
                  className="hover:bg-[#171C19] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[8px] bg-[#121614] border border-white/[0.08] flex items-center justify-center text-xs font-semibold text-[#F2F5F3] group-hover:border-[#22C55E]/30 group-hover:text-[#22C55E] transition-colors">
                        {empresa.charAt(0)}
                      </div>
                      <span className="font-medium text-[#F2F5F3] group-hover:text-[#22C55E] transition-colors block">
                        {empresa}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-[#A7B0AA] font-normal">
                    {item.puesto}
                  </td>

                  <td className="py-3 px-3">
                    <span className="capitalize text-[#A7B0AA] flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-[#69736D]" />
                      {item.modalidad ?? "No especificada"}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <Badge estado={item.estado} size="sm" />
                  </td>

                  <td className="py-3 px-3 text-[#A7B0AA]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[#69736D]" />
                      {item.fechaPostulacion ?? "—"}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span className="text-[#69736D] group-hover:text-[#22C55E] transition-colors inline-flex items-center gap-1 text-[11px] font-medium">
                      Detalles <ArrowRight className="w-3 h-3" />
                    </span>
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