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
  Palette,
} from "lucide-react";
import type { Usuario } from "@/src/schemas/usuario";
import type { Experiencia, ExperienciaSinId } from "@/src/schemas/experiencia";
import type { Proyecto, ProyectoSinId } from "@/src/schemas/proyecto";
import type { Firma, FirmaSinId } from "@/src/schemas/firma";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { useToast } from "@/src/components/ui/Toast";
import { useExperiencias } from "@/src/hooks/useExperiencias";
import { useProyectos } from "@/src/hooks/useProyectos";
import { useFirmas } from "@/src/hooks/useFirmas";
import { useCategorias } from "@/src/hooks/useCategorias";
import { ExperienciaFormModal } from "./ExperienciaFormModal";
import { ProyectoFormModal } from "./ProyectoFormModal";
import { FirmaFormModal } from "./FirmaFormModal";
import { ExperienciaSection } from "./ExperienciaSection";
import { ProyectosSection } from "./ProyectosSection";
import { FirmasSection } from "./FirmasSection";

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
      <ExperienciaSection
        data={experiencias.data}
        onAgregar={() => {
          setEditingExperiencia(null);
          setIsExperienciaModal(true);
        }}
        onEditar={(exp) => {
          setEditingExperiencia(exp);
          setIsExperienciaModal(true);
        }}
        onEliminar={handleEliminarExperiencia}
      />

      {/* Proyectos */}
      <ProyectosSection
        data={proyectos.data}
        onAgregar={() => {
          setEditingProyecto(null);
          setIsProyectoModal(true);
        }}
        onEditar={(p) => {
          setEditingProyecto(p);
          setIsProyectoModal(true);
        }}
        onEliminar={handleEliminarProyecto}
      />

      {/* Firmas */}
      <FirmasSection
        data={firmas.data}
        onAgregar={() => {
          setEditingFirma(null);
          setIsFirmaModal(true);
        }}
        onEditar={(f) => {
          setEditingFirma(f);
          setIsFirmaModal(true);
        }}
        onEliminar={handleEliminarFirma}
      />

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
