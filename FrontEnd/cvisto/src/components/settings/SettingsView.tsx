import React, { useState } from "react";
import {
  User,
  Download,
  Moon,
  Sun,
  Laptop,
  ShieldCheck,
  LogOut,
  Check,
  Plus,
  Pencil,
  Trash2,
  Palette,
  Signature,
  Briefcase,
  FolderKanban,
  Image as ImageIcon,
  Type as TypeIcon,
  Link as LinkIcon,
} from "lucide-react";
import type { Usuario } from "@/src/schemas/usuario";
import type { Experiencia, ExperienciaSinId } from "@/src/schemas/experiencia";
import type { Proyecto, ProyectoSinId } from "@/src/schemas/proyecto";
import type { Firma, FirmaSinId, TipoFirma } from "@/src/schemas/firma";
import type { Categoria } from "@/src/schemas/categoria";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import { Modal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { useExperiencias } from "@/src/hooks/useExperiencias";
import { useProyectos } from "@/src/hooks/useProyectos";
import { useFirmas } from "@/src/hooks/useFirmas";
import { useCategorias } from "@/src/hooks/useCategorias";

export function formatearMesAnio(mes?: string | null): string {
  if (!mes) return "Actualidad";
  const [anio, m] = mes.split("-");
  if (!anio || !m) return mes;
  const nombreMes =
    ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
     "septiembre", "octubre", "noviembre", "diciembre"][Number(m) - 1] ?? m;
  return `${nombreMes} ${anio}`;
}

function rangoMeses(inicio?: string | null, fin?: string | null): string {
  const desde = formatearMesAnio(inicio ?? null);
  const hasta = fin ? formatearMesAnio(fin) : "Actualidad";
  return `${desde} — ${hasta}`;
}

interface SettingsViewProps {
  usuario: Usuario;
  onUpdateUsuario: (data: Partial<Usuario>) => Promise<void>;
  onExportAllData: () => void;
  onResetDemoData: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  usuario,
  onUpdateUsuario,
  onExportAllData,
  onResetDemoData,
  onLogout,
}) => {
  const { success, error } = useToast();
  const [nombre, setNombre] = useState(usuario.nombre);
  const [perfil, setPerfil] = useState(usuario.perfil ?? "");
  const [pais, setPais] = useState(usuario.pais ?? "");
  const [provincia, setProvincia] = useState(usuario.provincia ?? "");
  const [telefono, setTelefono] = useState(usuario.telefono ?? "");
  const [linkedin, setLinkedin] = useState(usuario.linkedin ?? "");
  const [sitioWeb, setSitioWeb] = useState(usuario.sitioWeb ?? "");
  const [cv, setCv] = useState(usuario.cv ?? "");
  const [themePreference, setThemePreference] = useState<"dark" | "light" | "system">("dark");
  const [isSaving, setIsSaving] = useState(false);

  const experiencias = useExperiencias();
  const proyectos = useProyectos();
  const firmas = useFirmas();
  const categorias = useCategorias(
    usuario.id !== undefined ? Number(usuario.id) : 0,
  );

  const [isExperienciaModal, setIsExperienciaModal] = useState(false);
  const [isProyectoModal, setIsProyectoModal] = useState(false);
  const [isFirmaModal, setIsFirmaModal] = useState(false);
  const [editingExperiencia, setEditingExperiencia] = useState<Experiencia | null>(null);
  const [editingProyecto, setEditingProyecto] = useState<Proyecto | null>(null);
  const [editingFirma, setEditingFirma] = useState<Firma | null>(null);
  const [nuevaCategoria, setNuevaCategoria] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateUsuario({
        nombre: nombre.trim(),
        perfil: perfil.trim() || null,
        pais: pais.trim() || null,
        provincia: provincia.trim() || null,
        telefono: telefono.trim() || null,
        linkedin: linkedin.trim() || null,
        sitioWeb: sitioWeb.trim() || null,
        cv: cv.trim() || null,
      });
      success("Perfil actualizado correctamente");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCrearExperiencia = async (data: ExperienciaSinId) => {
    try {
      await experiencias.crear(data);
      success("Experiencia laboral agregada");
    } catch (e) {
      error(e instanceof Error ? e.message : "Error al guardar experiencia");
    }
  };

  const handleActualizarExperiencia = async (
    id: string,
    cambios: Partial<ExperienciaSinId>,
  ) => {
    try {
      await experiencias.actualizar(id, cambios);
      success("Experiencia actualizada");
    } catch (e) {
      error(e instanceof Error ? e.message : "Error al actualizar experiencia");
    }
  };

  const handleEliminarExperiencia = async (id: string) => {
    if (!window.confirm("¿Eliminar esta experiencia laboral?")) return;
    try {
      await experiencias.eliminar(id);
      success("Experiencia eliminada");
    } catch {
      error("Error al eliminar experiencia");
    }
  };

  const handleCrearProyecto = async (data: ProyectoSinId) => {
    try {
      await proyectos.crear(data);
      success("Proyecto agregado");
    } catch (e) {
      error(e instanceof Error ? e.message : "Error al guardar proyecto");
    }
  };

  const handleActualizarProyecto = async (
    id: string,
    cambios: Partial<ProyectoSinId>,
  ) => {
    try {
      await proyectos.actualizar(id, cambios);
      success("Proyecto actualizado");
    } catch (e) {
      error(e instanceof Error ? e.message : "Error al actualizar proyecto");
    }
  };

  const handleEliminarProyecto = async (id: string) => {
    if (!window.confirm("¿Eliminar este proyecto?")) return;
    try {
      await proyectos.eliminar(id);
      success("Proyecto eliminado");
    } catch {
      error("Error al eliminar proyecto");
    }
  };

  const handleCrearFirma = async (data: FirmaSinId, id?: string) => {
    try {
      if (id) {
        await firmas.actualizar(id, data);
        success("Firma actualizada");
      } else {
        await firmas.crear(data);
        success("Firma creada");
      }
    } catch (e) {
      error(e instanceof Error ? e.message : "Error al guardar firma");
    }
  };

  const handleEliminarFirma = async (id: string) => {
    if (!window.confirm("¿Eliminar esta firma?")) return;
    try {
      await firmas.eliminar(id);
      success("Firma eliminada");
    } catch {
      error("Error al eliminar firma");
    }
  };

  const handleCrearCategoria = async () => {
    const nombre = nuevaCategoria.trim();
    if (!nombre) return;
    try {
      await categorias.crear(nombre);
      setNuevaCategoria("");
      success(`Categoría "${nombre}" creada`);
    } catch {
      error("Error al crear categoría");
    }
  };

  const handleAlternarCategoria = async (categoriaId: number, nombre: string) => {
    try {
      const asignada = await categorias.alternar(categoriaId);
      success(
        asignada
          ? `Categoría "${nombre}" agregada a tu perfil`
          : `Categoría "${nombre}" quitada de tu perfil`,
      );
    } catch {
      error("Error al cambiar categoría");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#F2F5F3] font-['Inter']">
          Configuración del Workspace
        </h2>
        <p className="text-xs text-[#A7B0AA] mt-0.5">
          Ajustá tus datos profesionales, firmas, experiencia y preferencias
        </p>
      </div>

      {/* Perfil */}
      <div className="skeuo-surface p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#222A26] mb-5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#16A34A] to-[#4ADE80] flex items-center justify-center font-bold text-sm text-black">
            {nombre.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F2F5F3]">Perfil de Usuario</h3>
            <p className="text-xs text-[#A7B0AA]">
              Datos profesionales que usás en tus postulaciones
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />
            <Input
              label="Email (Google)"
              type="email"
              value={usuario.email}
              disabled
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="País"
              value={pais}
              onChange={(e) => setPais(e.target.value)}
            />
            <Input
              label="Provincia"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
            />
            <Input
              label="Teléfono"
              type="tel"
              placeholder="+54 9 11 1234-5678"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#A7B0AA]">
                LinkedIn
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/usuario"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="w-full skeuo-input rounded-lg text-sm p-3 focus:outline-none placeholder:text-[#69736D]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#A7B0AA]">
                Sitio web / Portafolio
              </label>
              <input
                type="url"
                placeholder="https://tusitio.com"
                value={sitioWeb}
                onChange={(e) => setSitioWeb(e.target.value)}
                className="w-full skeuo-input rounded-lg text-sm p-3 focus:outline-none placeholder:text-[#69736D]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#A7B0AA]">
              Perfil profesional
            </label>
            <textarea
              rows={2}
              placeholder="Breve descripción de tu perfil, stack y área de interés..."
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
              className="w-full skeuo-input rounded-lg text-sm p-3 focus:outline-none placeholder:text-[#69736D]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#A7B0AA]">
              CV / Resumen
            </label>
            <textarea
              rows={4}
              placeholder="Experiencia destacada, logros y skills clave para tus postulaciones..."
              value={cv}
              onChange={(e) => setCv(e.target.value)}
              className="w-full skeuo-input rounded-lg text-sm p-3 focus:outline-none placeholder:text-[#69736D]"
            />
          </div>

          <div className="pt-3 border-t border-[#222A26] flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              leftIcon={<Check className="w-4 h-4 text-black" />}
            >
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>

      {/* Categorías profesionales */}
      <div className="skeuo-surface p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#181D1B] border border-[#222A26] flex items-center justify-center text-[#22C55E]">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F2F5F3]">
              Categorías profesionales
            </h3>
            <p className="text-xs text-[#A7B0AA] mt-0.5">
              Marcá las áreas en las que te especializás
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categorias.todas.map((cat) => {
            const activa = categorias.seleccionadas.some(
              (c) => Number(c.id) === Number(cat.id),
            );
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleAlternarCategoria(Number(cat.id), cat.nombre)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  activa
                    ? "bg-[#22C55E]/15 text-[#4ADE80] border-[#22C55E]/40 shadow-[0_0_10px_rgba(34,197,94,0.15)]"
                    : "bg-[#101412] text-[#A7B0AA] border-[#222A26] hover:text-[#F2F5F3] hover:border-[#22C55E]/30"
                }`}
              >
                {cat.nombre}
              </button>
            );
          })}
          {categorias.todas.length === 0 && (
            <span className="text-xs text-[#69736D]">
              Cargando categorías...
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nueva categoría (ej: Fintech)"
            value={nuevaCategoria}
            onChange={(e) => setNuevaCategoria(e.target.value)}
            className="flex-1 skeuo-input rounded-lg text-sm px-3 py-2.5 focus:outline-none placeholder:text-[#69736D]"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCrearCategoria}
            leftIcon={<Plus className="w-4 h-4 text-[#22C55E]" />}
          >
            Crear
          </Button>
        </div>
      </div>

      {/* Experiencia laboral */}
      <div className="skeuo-surface p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#181D1B] border border-[#222A26] flex items-center justify-center text-[#22C55E]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F2F5F3]">
                Experiencia laboral
              </h3>
              <p className="text-xs text-[#A7B0AA] mt-0.5">
                Tu trayectoria profesional para tus postulaciones
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingExperiencia(null);
              setIsExperienciaModal(true);
            }}
            leftIcon={<Plus className="w-4 h-4 text-black" />}
          >
            Agregar
          </Button>
        </div>

        {experiencias.data.length === 0 ? (
          <p className="text-xs text-[#69736D] py-2">
            Todavía no registraste experiencias laborales.
          </p>
        ) : (
          <div className="space-y-2">
            {experiencias.data.map((exp) => (
              <div
                key={exp.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[#101412] border border-[#222A26]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#F2F5F3]">
                    {exp.puesto}
                  </p>
                  <p className="text-xs text-[#4ADE80]">{exp.empresa}</p>
                  <p className="text-[11px] text-[#69736D] mt-0.5">
                    {rangoMeses(exp.fechaInicio, exp.fechaFin)}
                  </p>
                  {exp.descripcion && (
                    <p className="text-xs text-[#8A968F] mt-1 line-clamp-2">
                      {exp.descripcion}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingExperiencia(exp);
                      setIsExperienciaModal(true);
                    }}
                    className="p-2 text-[#69736D] hover:text-[#4ADE80] rounded-lg hover:bg-[#22C55E]/10 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminarExperiencia(exp.id)}
                    className="p-2 text-[#69736D] hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proyectos */}
      <div className="skeuo-surface p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#181D1B] border border-[#222A26] flex items-center justify-center text-[#22C55E]">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F2F5F3]">Proyectos</h3>
              <p className="text-xs text-[#A7B0AA] mt-0.5">
                Trabajos personales o freelance para mostrar
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingProyecto(null);
              setIsProyectoModal(true);
            }}
            leftIcon={<Plus className="w-4 h-4 text-black" />}
          >
            Agregar
          </Button>
        </div>

        {proyectos.data.length === 0 ? (
          <p className="text-xs text-[#69736D] py-2">
            Todavía no registraste proyectos.
          </p>
        ) : (
          <div className="space-y-2">
            {proyectos.data.map((p) => (
              <div
                key={p.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[#101412] border border-[#222A26]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#F2F5F3]">{p.nombre}</p>
                  {p.descripcion && (
                    <p className="text-xs text-[#8A968F] mt-0.5 line-clamp-2">
                      {p.descripcion}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(p.tecnologias ?? []).map((tec) => (
                      <span
                        key={tec}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#4ADE80] border border-[#22C55E]/20"
                      >
                        {tec}
                      </span>
                    ))}
                  </div>
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-sky-400 underline mt-1 inline-block"
                    >
                      {p.url}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProyecto(p);
                      setIsProyectoModal(true);
                    }}
                    className="p-2 text-[#69736D] hover:text-[#4ADE80] rounded-lg hover:bg-[#22C55E]/10 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminarProyecto(p.id)}
                    className="p-2 text-[#69736D] hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Firmas */}
      <div className="skeuo-surface p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#181D1B] border border-[#222A26] flex items-center justify-center text-[#22C55E]">
              <Signature className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F2F5F3]">Firmas de email</h3>
              <p className="text-xs text-[#A7B0AA] mt-0.5">
                Texto o imagen con enlace para tus correos
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingFirma(null);
              setIsFirmaModal(true);
            }}
            leftIcon={<Plus className="w-4 h-4 text-black" />}
          >
            Nueva firma
          </Button>
        </div>

        {firmas.data.length === 0 ? (
          <p className="text-xs text-[#69736D] py-2">
            Todavía no creaste firmas. Podés usarlas al redactar un email.
          </p>
        ) : (
          <div className="space-y-2">
            {firmas.data.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#101412] border border-[#222A26]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#181D1B] border border-[#222A26] flex items-center justify-center text-[#A7B0AA] shrink-0">
                    {f.tipo === "imagen" ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : (
                      <TypeIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#F2F5F3]">{f.nombre}</p>
                    <p className="text-[11px] text-[#69736D]">
                      {f.tipo === "imagen" ? "Imagen" : "Texto"}
                      {f.enlace && " · con enlace"}
                    </p>
                  </div>
                  {f.tipo === "imagen" && f.imagenBase64 && (
                    <img
                      src={`data:${f.imagenMime ?? "image/png"};base64,${f.imagenBase64}`}
                      alt={f.nombre}
                      className="w-10 h-8 object-contain rounded border border-[#222A26]"
                    />
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFirma(f);
                      setIsFirmaModal(true);
                    }}
                    className="p-2 text-[#69736D] hover:text-[#4ADE80] rounded-lg hover:bg-[#22C55E]/10 transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminarFirma(f.id)}
                    className="p-2 text-[#69736D] hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apariencia */}
      <div className="skeuo-surface p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#F2F5F3]">Apariencia Visual</h3>
          <p className="text-xs text-[#A7B0AA] mt-0.5">
            CVisto está optimizado con skeuomorfismo oscuro y acentos verdes
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setThemePreference("dark")}
            className={`p-3.5 rounded-xl flex flex-col items-center gap-2 border transition-all ${
              themePreference === "dark"
                ? "bg-[#181D1B] border-[#22C55E] text-[#4ADE80] shadow-[0_0_12px_rgba(34,197,94,0.2)]"
                : "bg-[#101412] border-[#222A26] text-[#A7B0AA] hover:text-[#F2F5F3]"
            }`}
          >
            <Moon className="w-5 h-5" />
            <span className="text-xs font-semibold">☾ Oscuro</span>
            <span className="text-[10px] text-[#69736D]">Recomendado</span>
          </button>

          <button
            type="button"
            onClick={() => setThemePreference("light")}
            className={`p-3.5 rounded-xl flex flex-col items-center gap-2 border transition-all ${
              themePreference === "light"
                ? "bg-[#181D1B] border-[#22C55E] text-[#4ADE80]"
                : "bg-[#101412] border-[#222A26] text-[#A7B0AA] hover:text-[#F2F5F3]"
            }`}
          >
            <Sun className="w-5 h-5" />
            <span className="text-xs font-semibold">☀ Claro</span>
            <span className="text-[10px] text-[#69736D]">Adaptable</span>
          </button>

          <button
            type="button"
            onClick={() => setThemePreference("system")}
            className={`p-3.5 rounded-xl flex flex-col items-center gap-2 border transition-all ${
              themePreference === "system"
                ? "bg-[#181D1B] border-[#22C55E] text-[#4ADE80]"
                : "bg-[#101412] border-[#222A26] text-[#A7B0AA] hover:text-[#F2F5F3]"
            }`}
          >
            <Laptop className="w-5 h-5" />
            <span className="text-xs font-semibold">◐ Sistema</span>
            <span className="text-[10px] text-[#69736D]">Automático</span>
          </button>
        </div>
      </div>

      {/* Gestión de Datos & Backup */}
      <div className="skeuo-surface p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#F2F5F3]">Gestión de Datos & Backup</h3>
          <p className="text-xs text-[#A7B0AA] mt-0.5">
            Exportá tus registros en formato JSON
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onExportAllData}
            leftIcon={<Download className="w-4 h-4 text-[#22C55E]" />}
          >
            Exportar JSON completo
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (
                window.confirm(
                  "¿Estás seguro de que deseas cerrar tu sesión? Podrás volver a ingresar con Google."
                )
              ) {
                onLogout();
                success("Sesión cerrada correctamente");
              }
            }}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#101412] border border-[#222A26] flex items-center gap-3 text-xs text-[#A7B0AA]">
        <ShieldCheck className="w-5 h-5 text-[#22C55E] shrink-0" />
        <p>
          <strong className="text-[#F2F5F3]">CVisto Architecture:</strong> Frontend conectado a la API backend (validación Zod de un lado y del otro) con sesión autenticada por Google.
        </p>
      </div>

      <ExperienciaFormModal
        isOpen={isExperienciaModal}
        onClose={() => {
          setIsExperienciaModal(false);
          setEditingExperiencia(null);
        }}
        inicial={editingExperiencia}
        onSubmit={(data) =>
          editingExperiencia
            ? handleActualizarExperiencia(editingExperiencia.id, data)
            : handleCrearExperiencia(data)
        }
      />

      <ProyectoFormModal
        isOpen={isProyectoModal}
        onClose={() => {
          setIsProyectoModal(false);
          setEditingProyecto(null);
        }}
        inicial={editingProyecto}
        onSubmit={(data) =>
          editingProyecto
            ? handleActualizarProyecto(editingProyecto.id, data)
            : handleCrearProyecto(data)
        }
      />

      <FirmaFormModal
        isOpen={isFirmaModal}
        onClose={() => {
          setIsFirmaModal(false);
          setEditingFirma(null);
        }}
        inicial={editingFirma}
        onSubmit={(data) => handleCrearFirma(data, editingFirma?.id)}
      />
    </div>
  );
};

interface ExperienciaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  inicial: Experiencia | null;
  onSubmit: (data: ExperienciaSinId) => Promise<void>;
}

const ExperienciaFormModal: React.FC<ExperienciaFormModalProps> = ({
  isOpen,
  onClose,
  inicial,
  onSubmit,
}) => {
  const [empresa, setEmpresa] = useState("");
  const [puesto, setPuesto] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [trabajoActual, setTrabajoActual] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setEmpresa(inicial?.empresa ?? "");
      setPuesto(inicial?.puesto ?? "");
      setFechaInicio(inicial?.fechaInicio ?? "");
      setFechaFin(inicial?.fechaFin ?? "");
      setTrabajoActual(!inicial?.fechaFin);
      setDescripcion(inicial?.descripcion ?? "");
      setGuardando(false);
    }
  }, [isOpen, inicial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa.trim() || !puesto.trim()) return;
    setGuardando(true);
    try {
      await onSubmit({
        empresa: empresa.trim(),
        puesto: puesto.trim(),
        fechaInicio: fechaInicio || null,
        fechaFin: trabajoActual ? null : fechaFin || null,
        descripcion: descripcion.trim() || null,
      });
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={inicial ? "Editar experiencia" : "Nueva experiencia"}
      description="Registrá un puesto laboral para tu perfil."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Empresa"
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          required
        />
        <Input
          label="Puesto"
          value={puesto}
          onChange={(e) => setPuesto(e.target.value)}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#A7B0AA]">Desde</label>
            <input
              type="month"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full skeuo-input rounded-lg text-sm px-3 py-2.5 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#A7B0AA]">Hasta</label>
            <input
              type="month"
              value={trabajoActual ? "" : fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              disabled={trabajoActual}
              className="w-full skeuo-input rounded-lg text-sm px-3 py-2.5 focus:outline-none disabled:opacity-40"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={trabajoActual}
            onChange={(e) => setTrabajoActual(e.target.checked)}
            className="accent-[#22C55E] w-4 h-4 rounded"
          />
          <span className="text-xs font-medium text-[#F2F5F3]">
            Trabajo actual
          </span>
        </label>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#A7B0AA]">Descripción</label>
          <textarea
            rows={4}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Responsabilidades, logros, stack utilizado..."
            className="w-full skeuo-input rounded-lg text-sm p-3 focus:outline-none placeholder:text-[#69736D]"
          />
        </div>
        <div className="pt-3 border-t border-white/[0.06] flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={guardando}
            leftIcon={<Check className="w-4 h-4 text-black" />}
          >
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
};

interface ProyectoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  inicial: Proyecto | null;
  onSubmit: (data: ProyectoSinId) => Promise<void>;
}

const ProyectoFormModal: React.FC<ProyectoFormModalProps> = ({
  isOpen,
  onClose,
  inicial,
  onSubmit,
}) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tecnologias, setTecnologias] = useState("");
  const [url, setUrl] = useState("");
  const [guardando, setGuardando] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setNombre(inicial?.nombre ?? "");
      setDescripcion(inicial?.descripcion ?? "");
      setTecnologias((inicial?.tecnologias ?? []).join(", "));
      setUrl(inicial?.url ?? "");
      setGuardando(false);
    }
  }, [isOpen, inicial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setGuardando(true);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        tecnologias: tecnologias
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        url: url.trim() || null,
      });
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={inicial ? "Editar proyecto" : "Nuevo proyecto"}
      description="Agregá un proyecto a tu perfil profesional."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#A7B0AA]">Descripción</label>
          <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Qué hace el proyecto, tu rol, resultados..."
            className="w-full skeuo-input rounded-lg text-sm p-3 focus:outline-none placeholder:text-[#69736D]"
          />
        </div>
        <Input
          label="Tecnologías"
          value={tecnologias}
          onChange={(e) => setTecnologias(e.target.value)}
          placeholder="React, Node, SQL... (separadas por coma)"
        />
        <Input
          label="URL"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/usuario/proyecto"
        />
        <div className="pt-3 border-t border-white/[0.06] flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={guardando}
            leftIcon={<Check className="w-4 h-4 text-black" />}
          >
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
};

interface FirmaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  inicial: Firma | null;
  onSubmit: (data: FirmaSinId) => Promise<void>;
}

const FirmaFormModal: React.FC<FirmaFormModalProps> = ({
  isOpen,
  onClose,
  inicial,
  onSubmit,
}) => {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoFirma>("texto");
  const [contenido, setContenido] = useState("");
  const [enlace, setEnlace] = useState("");
  const [imagenMime, setImagenMime] = useState<string | null>(null);
  const [imagenBase64, setImagenBase64] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setNombre(inicial?.nombre ?? "");
      setTipo((inicial?.tipo as TipoFirma) ?? "texto");
      setContenido(inicial?.contenido ?? "");
      setEnlace(inicial?.enlace ?? "");
      setImagenMime(inicial?.imagenMime ?? null);
      setImagenBase64(inicial?.imagenBase64 ?? null);
      setGuardando(false);
    }
  }, [isOpen, inicial]);

  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      window.alert("El archivo debe ser una imagen.");
      e.target.value = "";
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      window.alert("La imagen no puede superar los 2 MB.");
      e.target.value = "";
      return;
    }
    const lector = new FileReader();
    lector.onload = () => {
      const dataUrl = lector.result as string;
      setImagenMime(archivo.type);
      setImagenBase64(dataUrl.split(",")[1] ?? "");
    };
    lector.readAsDataURL(archivo);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    if (tipo === "imagen" && !imagenBase64) {
      window.alert("Subí una imagen para la firma.");
      return;
    }
    setGuardando(true);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        tipo,
        contenido: tipo === "texto" ? contenido.trim() : null,
        imagenMime: tipo === "imagen" ? imagenMime : null,
        imagenBase64: tipo === "imagen" ? imagenBase64 : null,
        enlace: enlace.trim() || null,
      });
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={inicial ? "Editar firma" : "Nueva firma"}
      description="La firma se agrega al final de tus emails."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre de la firma"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Profesional / Académica"
          required
        />

        <Select
          label="Tipo de firma"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoFirma)}
          options={[
            { value: "texto", label: "Solo texto" },
            { value: "imagen", label: "Imagen (con enlace opcional)" },
          ]}
        />

        {tipo === "texto" ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#A7B0AA]">
              Contenido de la firma
            </label>
            <textarea
              rows={3}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder={
                "Nombre\nPuesto — Empresa\nLinkedIn: tu-linkedin\nwww.tusitio.com"
              }
              className="w-full skeuo-input rounded-lg text-sm p-3 focus:outline-none placeholder:text-[#69736D]"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#A7B0AA]">
                Imagen (PNG / JPG, hasta 2 MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImagen}
                className="w-full text-xs text-[#A7B0AA] file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-[#181D1B] file:text-[#F2F5F3] file:cursor-pointer cursor-pointer"
              />
              {imagenBase64 && (
                <div className="p-3 rounded-lg bg-[#101412] border border-[#222A26] flex items-center gap-3">
                  <img
                    src={`data:${imagenMime ?? "image/png"};base64,${imagenBase64}`}
                    alt="Vista previa de la firma"
                    className="max-h-16 object-contain rounded border border-[#222A26]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagenBase64(null);
                      setImagenMime(null);
                    }}
                    className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Quitar imagen
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#A7B0AA]">
                Enlace al hacer clic (opcional)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#69736D]" />
                <input
                  type="url"
                  placeholder="https://tusitio.com"
                  value={enlace}
                  onChange={(e) => setEnlace(e.target.value)}
                  className="w-full skeuo-input rounded-lg text-sm px-10 py-2.5 focus:outline-none placeholder:text-[#69736D]"
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-white/[0.06] flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={guardando}
            leftIcon={<Check className="w-4 h-4 text-black" />}
          >
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
};