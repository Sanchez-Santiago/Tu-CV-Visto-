import React, { useState } from "react";
import { MailPlus } from "lucide-react";
import { Sidebar, NavView } from "@/src/components/layout/Sidebar";
import { Header } from "@/src/components/layout/Header";
import { ToastProvider, useToast } from "@/src/components/ui/Toast";
import { LoginView } from "@/src/components/auth/LoginView";

// Data hooks
import { useAuth } from "@/src/hooks/useAuth";
import { usePostulaciones } from "@/src/hooks/usePostulaciones";
import { useEmpresas } from "@/src/hooks/useEmpresas";
import { useContactos } from "@/src/hooks/useContactos";
import { useSeguimientos } from "@/src/hooks/useSeguimientos";
import { useEmails } from "@/src/hooks/useEmails";
import { useFirmas } from "@/src/hooks/useFirmas";
import { useEstrategia } from "@/src/hooks/useEstrategia";
import { useAutoSync } from "@/src/hooks/useAutoSync";

// Action hooks
import { useApplicationModals } from "@/src/hooks/useApplicationModals";
import { useSeguimientosActions } from "@/src/hooks/useSeguimientosActions";
import { useCompose } from "@/src/hooks/useCompose";
import { useEmpresasActions } from "@/src/hooks/useEmpresasActions";
import { useContactosActions } from "@/src/hooks/useContactosActions";
import { useEmailsActions } from "@/src/hooks/useEmailsActions";
import { useEstrategiaActions } from "@/src/hooks/useEstrategiaActions";
import { useTheme } from "@/src/hooks/useTheme";

import type { Usuario } from "@/src/types/schemas";

// Views
import { DashboardView } from "@/src/components/dashboard/DashboardView";
import { ApplicationsView } from "@/src/components/applications/ApplicationsView";
import { CompaniesView } from "@/src/components/companies/CompaniesView";
import { ContactsView } from "@/src/components/contacts/ContactsView";
import { FollowupsView } from "@/src/components/followups/FollowupsView";
import { EmailsView } from "@/src/components/emails/EmailsView";
import { EstrategiaView } from "@/src/components/estrategia/EstrategiaView";
import { AnalyticsView } from "@/src/components/analytics/AnalyticsView";
import { SettingsView } from "@/src/components/settings/SettingsView";

// Modals
import { ApplicationFormModal } from "@/src/components/applications/ApplicationFormModal";
import { ApplicationDetailModal } from "@/src/components/applications/ApplicationDetailModal";
import { FollowupFormModal } from "@/src/components/followups/FollowupFormModal";
import { ComposeEmailModal } from "@/src/components/compose/ComposeEmailModal";

import { VIEW_META } from "@/src/lib/navegacion";
import { capturarTokenOAuth } from "@/src/lib/auth";
import { exportarJson } from "@/src/lib/exportar";
import type { EstadoPostulacion, TipoSeguimiento } from "@/src/schemas/common";

function AppContent() {
  useTheme();
  const { success, error } = useToast();

  const auth = useAuth();
  const postulaciones = usePostulaciones();
  const empresas = useEmpresas();
  const contactos = useContactos();
  const seguimientos = useSeguimientos();
  const emails = useEmails();
  const firmas = useFirmas();
  const estrategia = useEstrategia();

  // Navigation & UI state
  const [currentView, setCurrentView] = useState<NavView>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  // Action hooks
  const apps = useApplicationModals({
    crearPostulacion: postulaciones.crear,
    actualizarPostulacion: postulaciones.actualizar,
    eliminarPostulacion: postulaciones.eliminar,
    cambiarEstadoPostulacion: postulaciones.cambiarEstado,
    actualizarEmailPostulacion: emails.actualizar,
    empresas: empresas.data,
  });
  const seguimientosActions = useSeguimientosActions({
    crear: seguimientos.crear,
    eliminar: seguimientos.eliminar,
    alternarEnviado: seguimientos.alternarEnviado,
    refrescar: seguimientos.refrescar,
    registrarSeguimiento: postulaciones.registrarSeguimiento,
  });
  const compose = useCompose({
    contactos: contactos.data,
    refrescarEmails: emails.refrescar,
  });
  const empresasActions = useEmpresasActions({
    crear: empresas.crear,
    eliminar: empresas.eliminar,
  });
  const contactosActions = useContactosActions({
    crear: contactos.crear,
    eliminar: contactos.eliminar,
  });
  const emailsActions = useEmailsActions({
    crear: emails.crear,
    eliminar: emails.eliminar,
  });
  const estrategiaActions = useEstrategiaActions({
    sincronizar: estrategia.sincronizar,
    analizar: estrategia.analizar,
    renovar: estrategia.renovar,
    refrescarPostulaciones: postulaciones.refrescar,
    refrescarEmails: emails.refrescar,
    refrescarSeguimientos: seguimientos.refrescar,
    refrescarEmpresas: empresas.refrescar,
    refrescarContactos: contactos.refrescar,
    refrescarFirmas: firmas.refrescar,
  });
  const autoSync = useAutoSync({
    habilitado: !auth.cargando && !auth.necesitaLogin,
    sincronizar: estrategiaActions.sincronizar,
  });

  // Acciones en lote para Postulaciones (usan las APIs individuales).
  const bulkEliminarPostulaciones = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => postulaciones.eliminar(id)));
      if (
        apps.selectedApplication &&
        ids.includes(apps.selectedApplication.id)
      ) {
        apps.setSelectedApplication(null);
      }
      success(`${ids.length} postulación(es) eliminada(s)`);
    } catch {
      error("No se pudieron eliminar todas las postulaciones");
    }
  };

  const bulkCambiarEstado = async (
    ids: string[],
    estado: EstadoPostulacion,
  ) => {
    try {
      await Promise.all(
        ids.map((id) => postulaciones.cambiarEstado(id, estado)),
      );
      success(`${ids.length} postulación(es) → "${estado.replace("_", " ")}"`);
    } catch {
      error("No se pudo actualizar el estado de todas");
    }
  };

  const bulkProgramarSeguimientos = async (
    ids: string[],
    datos: {
      fechaProgramada: string;
      tipoSeguimiento: TipoSeguimiento;
      observaciones?: string | null;
    },
  ) => {
    try {
      await Promise.all(
        ids.map((id) =>
          seguimientos.crear({
            postulacionId: Number(id),
            fechaProgramada: datos.fechaProgramada,
            tipoSeguimiento: datos.tipoSeguimiento,
            enviado: 0,
            requiereAprobacion: 1,
            fechaEnvio: null,
            observaciones: datos.observaciones ?? null,
          }),
        ),
      );
      success(`${ids.length} seguimiento(s) programado(s)`);
    } catch {
      error("No se pudieron programar todos los seguimientos");
    }
  };

  // Guard: handle OAuth callback landing — read token from URL fragment
  // Aplica en cualquier ruta por si el redirect cae en "/" u otro path.
  capturarTokenOAuth();

  if (auth.cargando) {
    return (
      <div className="min-h-screen bg-[#080A09] text-[#F2F5F3] flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#22C55E] border-t-transparent animate-spin mb-3" />
        <p className="text-xs text-[#A7B0AA] font-mono tracking-wider">
          CARGANDO CVISTO WORKSPACE...
        </p>
      </div>
    );
  }

  if (auth.necesitaLogin) {
    return <LoginView onLogin={auth.iniciarLogin} />;
  }

  const usuario = auth.usuario as Usuario;

  const handleUpdateUsuario = async (data: Partial<Usuario>) => {
    try {
      await auth.actualizarUsuario(data);
    } catch (err) {
      error("Error al actualizar usuario");
    }
  };

  const handleLogout = async () => {
    await auth.cerrarSesion();
    window.location.assign("/");
  };

  // Handler: Export data
  const handleExportAllData = () => {
    const data = {
      usuario,
      postulaciones: postulaciones.data,
      empresas: empresas.data,
      contactos: contactos.data,
      seguimientos: seguimientos.data,
      exportDate: new Date().toISOString(),
      app: "CVisto Digital Workspace",
    };
    exportarJson("cvisto-backup", data);
    success("Backup descargado en formato JSON");
  };

  const pendingTasks = seguimientos.data.filter((s) => s.enviado === 0).length;
  const postulacionesCount = postulaciones.data.filter(
    (p) => p.estado !== "rechazado" && p.estado !== "cancelado"
  ).length;

  return (
    <div className="min-h-screen bg-[#080A09] text-[#F2F5F3] flex">
      {/* Permanent Desktop Sidebar / Off-canvas Mobile Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setIsMobileMenuOpen(false);
        }}
        usuario={usuario}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        pendingFollowupsCount={pendingTasks}
        postulacionesCount={postulacionesCount}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          title={VIEW_META[currentView].title}
          subtitle={VIEW_META[currentView].subtitle}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNewApplicationModal={apps.abrirNuevo}
          searchQuery={globalSearch}
          onSearchChange={(q) => {
            setGlobalSearch(q);
            if (currentView !== "postulaciones" && q.trim().length > 0) {
              setCurrentView("postulaciones");
            }
          }}
          urgentFollowupsCount={pendingTasks}
          onQuickNavigateFollowups={() => setCurrentView("seguimientos")}
          onActualizar={estrategiaActions.actualizarGlobal}
          actualizando={estrategiaActions.actualizando}
          onAnalizarIA={estrategiaActions.analizar}
          analizandoIA={estrategiaActions.analizandoIA}
          ultimaSincronizacion={autoSync.ultimaSincronizacion}
          sincronizandoAuto={autoSync.sincronizandoAuto}
        />

        {/* Scrollable Body */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {currentView === "dashboard" && (
            <DashboardView
              usuario={usuario}
              postulaciones={postulaciones.data}
              emails={emails.data}
              seguimientos={seguimientos.data}
              empresas={empresas.data}
              onToggleEnviado={seguimientosActions.alternar}
              onSelectApplication={apps.setSelectedApplication}
              onNavigate={(view) => setCurrentView(view)}
              onOpenNewApplicationModal={apps.abrirNuevo}
              onOpenNewFollowupModal={seguimientosActions.abrirNuevaTarea}
            />
          )}

          {currentView === "postulaciones" && (
            <ApplicationsView
              postulaciones={postulaciones.data}
              empresas={empresas.data}
              emails={emails.data}
              firmas={firmas.data}
              onSelectApplication={apps.setSelectedApplication}
              onEditApplication={apps.abrirEdicion}
              onDeleteApplication={apps.eliminar}
              onQuickStatusChange={apps.cambiarEstado}
              onBulkDelete={bulkEliminarPostulaciones}
              onBulkStatusChange={bulkCambiarEstado}
              onBulkProgramar={bulkProgramarSeguimientos}
              onOpenNewModal={apps.abrirNuevo}
              searchQuery={globalSearch}
              onSearchChange={setGlobalSearch}
              onComposeEmail={compose.abrirComposeConPrefill}
            />
          )}

          {currentView === "empresas" && (
            <CompaniesView
              empresas={empresas.data}
              onCreateEmpresa={empresasActions.crear}
              onDeleteEmpresa={empresasActions.eliminar}
              onFilterByCompany={(emp) => {
                setGlobalSearch(emp);
                setCurrentView("postulaciones");
              }}
              onComposeToEmpresa={compose.abrirComposeParaEmpresa}
            />
          )}

          {currentView === "contactos" && (
            <ContactsView
              contactos={contactos.data}
              empresas={empresas.data}
              emails={emails.data}
              firmas={firmas.data}
              onCreateContacto={contactosActions.crear}
              onDeleteContacto={contactosActions.eliminar}
              onComposeTo={compose.abrirComposeParaContacto}
              onComposeEmail={compose.abrirComposeConPrefill}
            />
          )}

          {currentView === "seguimientos" && (
            <FollowupsView
              seguimientos={seguimientos.data}
              postulaciones={postulaciones.data}
              empresas={empresas.data}
              emails={emails.data}
              firmas={firmas.data}
              onToggleEnviado={seguimientosActions.alternar}
              onDeleteFollowup={seguimientosActions.eliminar}
              onOpenNewTaskModal={seguimientosActions.abrirNuevaTarea}
              onComposeEmail={compose.abrirComposeConPrefill}
            />
          )}

          {currentView === "emails" && (
            <EmailsView
              emails={emails.data}
              postulaciones={postulaciones.data}
              empresas={empresas.data}
              onCreateEmail={emailsActions.crear}
              onDeleteEmail={emailsActions.eliminar}
              onCrearPostulacionDesdeEmail={apps.crearDesdeEmail}
              onComposeEmail={compose.abrirComposeConPrefill}
            />
          )}

          {currentView === "estrategia" && (
            <EstrategiaView
              renovaciones={estrategia.renovaciones}
              estadisticas={estrategia.estadisticas}
              cargando={estrategia.cargando}
              error={estrategia.error}
              emails={emails.data}
              firmas={firmas.data}
              onSincronizar={estrategiaActions.sincronizar}
              onAnalizar={estrategiaActions.analizar}
              onRenovar={estrategiaActions.renovar}
              onNavigate={setCurrentView}
              onComposeEmail={compose.abrirComposeConPrefill}
            />
          )}

          {currentView === "estadisticas" && (
            <AnalyticsView
              postulaciones={postulaciones.data}
              emails={emails.data}
              estadisticas={estrategia.estadisticas}
            />
          )}

          {currentView === "configuracion" && (
            <SettingsView
              usuario={usuario}
              onUpdateUsuario={handleUpdateUsuario}
              onExportAllData={handleExportAllData}
              onResetDemoData={() => {}}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Application Form Modal (Create / Edit) */}
      <ApplicationFormModal
        isOpen={apps.isAppFormOpen}
        onClose={apps.cerrarForm}
        onSubmit={apps.guardar}
        initialData={apps.editingApplication}
        empresas={empresas.data}
        prefill={apps.appFormPrefill}
      />

      {/* Application Details Dossier Modal */}
      <ApplicationDetailModal
        isOpen={Boolean(apps.selectedApplication)}
        onClose={() => apps.setSelectedApplication(null)}
        postulacion={apps.selectedApplication}
        onUpdateStatus={apps.cambiarEstado}
        onEdit={apps.abrirEdicion}
        onDelete={apps.eliminar}
        onAddFollowup={seguimientosActions.abrirTareaParaPostulacion}
        onRegisterInteraction={seguimientosActions.registrar}
        empresas={empresas.data}
        linkedFollowups={
          apps.selectedApplication
            ? seguimientos.data.filter(
                (s) => Number(s.postulacionId) === Number(apps.selectedApplication.id)
              )
            : []
        }
        linkedEmails={
          apps.selectedApplication
            ? emails.data.filter(
                (e) =>
                  e.postulacionId !== null &&
                  Number(e.postulacionId) === Number(apps.selectedApplication.id)
              )
            : []
        }
        firmas={firmas.data}
        onComposeEmail={compose.abrirComposeConPrefill}
      />

      {/* Followup Task Modal */}
      <FollowupFormModal
        isOpen={seguimientosActions.isFollowupModalOpen}
        onClose={seguimientosActions.cerrarModal}
        onSubmit={seguimientosActions.crear}
        prefilledPostulacionId={seguimientosActions.followupPrefillPostulacionId}
        postulaciones={postulaciones.data}
        empresas={empresas.data}
      />

      {/* Compose Email Modal */}
      <ComposeEmailModal
        isOpen={compose.isComposeOpen}
        onClose={compose.cerrarCompose}
        prefill={compose.composePrefill}
        contactos={contactos.data}
        firmas={firmas.data}
        onEnviado={compose.enviarCorreo}
      />

      {/* Floating compose button */}
      <button
        type="button"
        onClick={compose.abrirComposeVacio}
        title="Redactar email"
        aria-label="Redactar email"
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-[#22C55E] to-[#16A34A] text-black shadow-[0_6px_18px_rgba(34,197,94,0.45)] hover:shadow-[0_8px_24px_rgba(34,197,94,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
      >
        <MailPlus className="w-6 h-6" />
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}