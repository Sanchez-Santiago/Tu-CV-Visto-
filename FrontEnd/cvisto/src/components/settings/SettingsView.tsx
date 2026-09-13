import React, { useState } from "react";
import { User, Download, Moon, Sun, Laptop, ShieldCheck, LogOut, Check } from "lucide-react";
import type { Usuario } from "@/src/schemas/usuario";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { useToast } from "@/src/components/ui/Toast";

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
  const { success } = useToast();
  const [nombre, setNombre] = useState(usuario.nombre);
  const [perfil, setPerfil] = useState(usuario.perfil ?? "");
  const [pais, setPais] = useState(usuario.pais ?? "");
  const [provincia, setProvincia] = useState(usuario.provincia ?? "");
  const [themePreference, setThemePreference] = useState<"dark" | "light" | "system">("dark");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onUpdateUsuario({
      nombre: nombre.trim(),
      perfil: perfil.trim() || null,
      pais: pais.trim() || null,
      provincia: provincia.trim() || null,
    });
    setIsSaving(false);
    success("Perfil actualizado correctamente");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#F2F5F3] font-['Inter']">
          Configuración del Workspace
        </h2>
        <p className="text-xs text-[#A7B0AA] mt-0.5">
          Ajustá tus datos profesionales, tema visual y gestión de datos
        </p>
      </div>

      <div className="skeuo-surface p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#222A26] mb-5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#16A34A] to-[#4ADE80] flex items-center justify-center font-bold text-sm text-black">
            {nombre.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F2F5F3]">Perfil de Usuario</h3>
            <p className="text-xs text-[#A7B0AA]">
              Datos de tu cuenta de Google y preferencias de perfil
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </div>
  );
};