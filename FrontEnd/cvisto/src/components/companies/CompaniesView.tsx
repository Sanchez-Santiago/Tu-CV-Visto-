import React, { useState } from "react";
import { MapPin, Plus, Search, Trash2, Layers, CalendarClock } from "lucide-react";
import type { Empresa, EmpresaSinId } from "@/src/schemas/empresa";
import type { Modalidad } from "@/src/schemas/common";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";

interface CompaniesViewProps {
  empresas: Empresa[];
  onCreateEmpresa: (data: EmpresaSinId) => Promise<void>;
  onDeleteEmpresa: (id: string) => void;
  onFilterByCompany?: (empresaNombre: string) => void;
  onComposeToEmpresa?: (empresa: Empresa) => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  empresas,
  onCreateEmpresa,
  onDeleteEmpresa,
  onFilterByCompany,
  onComposeToEmpresa,
}) => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [pais, setPais] = useState("");
  const [provincia, setProvincia] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [modalidad, setModalidad] = useState<Modalidad | "">("");
  const [cadencia, setCadencia] = useState<string>("");
  const [observaciones, setObservaciones] = useState("");

  const filtered = empresas.filter((e) => {
    const termino = search.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(termino) ||
      (e.pais ?? "").toLowerCase().includes(termino) ||
      (e.provincia ?? "").toLowerCase().includes(termino) ||
      (e.ciudad ?? "").toLowerCase().includes(termino)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    await onCreateEmpresa({
      nombre: nombre.trim(),
      pais: pais.trim() || null,
      provincia: provincia.trim() || null,
      ciudad: ciudad.trim() || null,
      modalidad: modalidad || null,
      cadenciaContacto: cadencia ? Number(cadencia) : null,
      observaciones: observaciones.trim() || null,
    });

    setNombre("");
    setPais("");
    setProvincia("");
    setCiudad("");
    setModalidad("");
    setCadencia("");
    setObservaciones("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#F2F5F3] font-['Inter']">
            Empresas
          </h2>
          <p className="text-xs text-[#A7B0AA] mt-0.5">
            Directorio de organizaciones y empleadores en tu radar
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4 text-black" />}
        >
          Nueva empresa
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#69736D]" />
        <input
          type="text"
          placeholder="Buscar empresa por nombre, país, provincia o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#101412] border border-[#232C28] rounded-lg text-sm py-2.5 pl-10 pr-4 text-[#F2F5F3] placeholder:text-[#69736D] focus:outline-none focus:border-[#22C55E]/60 focus:ring-1 focus:ring-[#22C55E]/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const ubicacion = [item.pais, item.provincia, item.ciudad]
            .filter(Boolean)
            .join(" · ") || "Sin ubicación";
          return (
            <div
              key={item.id}
              className="p-5 rounded-xl skeuo-card-interactive flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#101412] border border-[#26312B] flex items-center justify-center font-bold text-sm text-[#F2F5F3] shadow-xs group-hover:border-[#22C55E]/40 group-hover:text-[#22C55E] transition-colors">
                      {item.nombre.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#F2F5F3] group-hover:text-[#4ADE80] transition-colors">
                        {item.nombre}
                      </h3>
                      <p className="text-xs text-[#A7B0AA] capitalize">
                        {item.modalidad ?? "Sin modalidad"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteEmpresa(item.id)}
                    className="text-[#69736D] hover:text-rose-400 p-1 rounded hover:bg-[#2A1517] transition-colors"
                    title="Eliminar empresa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1F2723] space-y-2 text-xs text-[#A7B0AA]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#69736D]" />
                    <span>{ubicacion}</span>
                  </div>

                  {item.cadenciaContacto && (
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5 text-[#69736D]" />
                      <span>Cadencia de contacto cada{" "}
                        <span className="text-[#4ADE80] font-medium">{item.cadenciaContacto} días</span>
                      </span>
                    </div>
                  )}

                  {item.observaciones && (
                    <p className="mt-2 text-xs text-[#69736D] line-clamp-2 italic bg-[#101412]/50 p-2 rounded border border-[#1E2521]">
                      "{item.observaciones}"
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1C2320] flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-[#A7B0AA]">
                  <Layers className="w-3 h-3 text-[#69736D]" />
                  Contactos y postulaciones vinculadas
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  {onComposeToEmpresa && (
                    <button
                      type="button"
                      onClick={() => onComposeToEmpresa(item)}
                      className="text-xs text-[#22C55E] hover:text-[#4ADE80] font-medium border border-[#22C55E]/30 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 rounded-md px-2.5 py-1 transition-colors cursor-pointer"
                      title="Escribir email a un contacto de esta empresa"
                    >
                      Escribir
                    </button>
                  )}
                  {onFilterByCompany && (
                    <button
                      onClick={() => onFilterByCompany(item.nombre)}
                      className="text-xs text-[#A7B0AA] hover:text-[#F2F5F3] font-medium underline cursor-pointer"
                    >
                      Ver procesos
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar nueva empresa"
        description="Agregá una organización a tu base de datos de búsqueda de empleo."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre de la empresa"
            placeholder="Ej: Globant, Evoltis, Mercado Libre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Input
              label="País"
              placeholder="Ej: Argentina"
              value={pais}
              onChange={(e) => setPais(e.target.value)}
            />
            <Input
              label="Provincia"
              placeholder="Ej: CABA"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
            />
            <Input
              label="Ciudad"
              placeholder="Ej: Buenos Aires"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Select
              label="Modalidad (opcional)"
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value as Modalidad | "")}
              options={[
                { value: "", label: "Sin especificar" },
                { value: "presencial", label: "Presencial" },
                { value: "remoto", label: "Remoto" },
                { value: "hibrido", label: "Híbrido" },
                { value: "no_especificado", label: "No especificado" },
              ]}
            />

            <Input
              label="Cadencia de contacto (días)"
              type="number"
              min={1}
              placeholder="Ej: 30"
              value={cadencia}
              onChange={(e) => setCadencia(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#A7B0AA]">
              Observaciones
            </label>
            <textarea
              rows={2}
              placeholder="Comentarios sobre cultura, tech stack o reputación..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full skeuo-input rounded-lg text-sm p-3 focus:outline-none placeholder:text-[#69736D]"
            />
          </div>

          <div className="pt-3 border-t border-[#222A26] flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Guardar empresa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};