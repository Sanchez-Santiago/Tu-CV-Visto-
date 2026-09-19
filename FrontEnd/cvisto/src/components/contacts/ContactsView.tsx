import React, { useState } from "react";
import { Users2, Mail, Plus, Trash2 } from "lucide-react";
import type { Contacto, ContactoSinId } from "@/src/schemas/contacto";
import type { Empresa } from "@/src/schemas/empresa";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { SectionHeader } from "@/src/components/ui/SectionHeader";
import { SearchInput } from "@/src/components/ui/SearchInput";
import { LinkedEmailsModal } from "@/src/components/emails/LinkedEmailsModal";
import type { Email } from "@/src/schemas/email";
import type { Firma } from "@/src/schemas/firma";

interface ContactsViewProps {
  contactos: Contacto[];
  empresas: Empresa[];
  emails?: Email[];
  firmas?: Firma[];
  onCreateContacto: (data: ContactoSinId) => Promise<void>;
  onDeleteContacto: (id: string) => void;
  onComposeTo?: (email: string) => void;
  onComposeEmail?: (prefill: {
    destinatario: string;
    asunto: string;
    cuerpo: string;
  }) => void;
}

const sinEmpresa = { value: "", label: "Seleccionar empresa..." };

export const ContactsView: React.FC<ContactsViewProps> = ({
  contactos,
  empresas,
  emails = [],
  firmas = [],
  onCreateContacto,
  onDeleteContacto,
  onComposeTo,
  onComposeEmail,
}) => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkedEmailsContacto, setLinkedEmailsContacto] = useState<Contacto | null>(null);

  const [empresaId, setEmpresaId] = useState<string>("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const nombreEmpresa = (id: number): string => {
    const e = empresas.find((emp) => Number(emp.id) === Number(id));
    return e?.nombre ?? "(Sin empresa)";
  };

  const filtered = contactos.filter((c) => {
    const termino = search.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(termino) ||
      c.email.toLowerCase().includes(termino) ||
      (c.cargo ?? "").toLowerCase().includes(termino) ||
      nombreEmpresa(c.empresaId).toLowerCase().includes(termino)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !empresaId || !email.trim()) return;

    await onCreateContacto({
      empresaId: Number(empresaId),
      nombre: nombre.trim(),
      email: email.trim(),
      cargo: cargo.trim() || null,
      observaciones: observaciones.trim() || null,
    });

    setEmpresaId("");
    setNombre("");
    setEmail("");
    setCargo("");
    setObservaciones("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Contactos"
        subtitle="Reclutadores, managers y referentes de tus procesos de selección"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4 text-black" />}
          >
            Nuevo contacto
          </Button>
        }
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nombre, email o cargo..."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-xl skeuo-card-interactive flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1E2622] to-[#25322B] border border-[#2D3C34] flex items-center justify-center font-bold text-xs text-[#4ADE80] shadow-xs">
                    {item.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F2F5F3] group-hover:text-[#4ADE80] transition-colors">
                      {item.nombre}
                    </h3>
                    {item.cargo && (
                      <p className="text-xs text-[#A7B0AA]">{item.cargo}</p>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#22C55E] font-medium mt-0.5">
                      <Users2 className="w-3 h-3" /> {nombreEmpresa(item.empresaId)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteContacto(item.id)}
                  className="text-[#69736D] hover:text-rose-400 p-1 rounded hover:bg-[#2A1517] transition-colors"
                  title="Eliminar contacto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1F2723] space-y-2 text-xs text-[#A7B0AA]">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#69736D] shrink-0" />
                  <a
                    href={`mailto:${item.email}`}
                    className="text-[#F2F5F3] hover:text-[#22C55E] truncate"
                  >
                    {item.email}
                  </a>
                  <div className="ml-auto flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setLinkedEmailsContacto(item)}
                      className="text-[11px] font-medium text-[#A7B0AA] hover:text-[#F2F5F3] bg-[#181D1B] hover:bg-[#202723] border border-white/[0.08] rounded-md px-2 py-1 transition-colors cursor-pointer flex items-center gap-1"
                      title="Ver correos vinculados a este contacto"
                    >
                      <Mail className="w-3 h-3 text-[#22C55E]" />
                      <span>Ver emails</span>
                    </button>
                    {onComposeTo && (
                      <button
                        type="button"
                        onClick={() => onComposeTo(item.email)}
                        className="text-[11px] font-medium text-[#22C55E] hover:text-[#4ADE80] bg-[#22C55E]/10 hover:bg-[#22C55E]/20 border border-[#22C55E]/30 rounded-md px-2 py-1 transition-colors cursor-pointer"
                        title="Escribir email"
                      >
                        Escribir
                      </button>
                    )}
                  </div>
                </div>

                {item.observaciones && (
                  <p className="mt-2 text-xs text-[#69736D] line-clamp-2 italic bg-[#101412]/50 p-2 rounded border border-[#1E2521]">
                    "{item.observaciones}"
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo contacto profesional"
        description="Agregá los datos del reclutador o líder técnico con quien estás en contacto."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Empresa"
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            options={[sinEmpresa, ...empresas.map((e) => ({ value: e.id, label: e.nombre }))]}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Nombre completo"
              placeholder="Ej: Mariana Gómez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />

            <Input
              label="Cargo"
              placeholder="Ej: Lead Tech Recruiter"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
            />
          </div>

          <Input
            label="Email"
            placeholder="reclutador@empresa.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#A7B0AA]">
              Observaciones
            </label>
            <textarea
              rows={2}
              placeholder="Comentarios sobre trato, fecha de contacto o preferencias..."
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
              Guardar contacto
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de emails vinculados al contacto */}
      <LinkedEmailsModal
        isOpen={Boolean(linkedEmailsContacto)}
        onClose={() => setLinkedEmailsContacto(null)}
        title={
          linkedEmailsContacto
            ? `${linkedEmailsContacto.nombre} (${linkedEmailsContacto.email})`
            : ""
        }
        subtitle={
          linkedEmailsContacto
            ? `Correos intercambiados con este contacto en ${nombreEmpresa(
                linkedEmailsContacto.empresaId,
              )}`
            : undefined
        }
        emails={
          linkedEmailsContacto
            ? emails.filter(
                (e) =>
                  e.remitente
                    ?.toLowerCase()
                    .includes(linkedEmailsContacto.email.toLowerCase()) ||
                  e.destinatario
                    ?.toLowerCase()
                    .includes(linkedEmailsContacto.email.toLowerCase()),
              )
            : []
        }
        onComposeEmail={
          onComposeTo
            ? (prefill) =>
                onComposeTo(
                  prefill.destinatario || linkedEmailsContacto?.email || "",
                )
            : onComposeEmail
        }
        firmas={firmas}
      />
    </div>
  );
};