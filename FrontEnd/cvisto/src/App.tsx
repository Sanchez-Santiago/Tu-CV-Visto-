import React, { useState, useCallback } from "react";
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
import { useEstrategia } from "@/src/hooks/useEstrategia";

import type {
  Postulacion,
  Usuario,
  EstadoPostulacion,
} from "@/src/types/schemas";

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

import type { DatosRegistroContacto } from "@/src/components/applications/RegisterInteractionModal";
import type {
  PostulacionSinId,
} from "@/src/schemas/postulacion";
import type { EmpresaSinId } from "@/src/schemas/empresa";
import type { Empresa } from "@/src/schemas/empresa";
import type { ContactoSinId } from "@/src/schemas/contacto";
import type { SeguimientoSinId } from "@/src/schemas/seguimiento";
import type { Email, EmailSinId } from "@/src/schemas/email";
import { nombreEmpresa, empresaIdDesdeDominio } from "@/src/lib/nombres";
import { gmailApi, type AdjuntoEnviar } from "@/src/lib/api/client";

function AppContent() {
  const { success, error } = useToast();

  const auth = useAuth();
  const postulaciones = usePostulaciones();
  const empresas = useEmpresas();
  const contactos = useContactos();
  const seguimientos = useSeguimientos();
  const emails = useEmails();
  const estrategia = useEstrategia();

  // Navigation & UI state
  const [currentView, setCurrentView] = useState<NavView>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [actualizandoGlobal, setActualizandoGlobal] = useState(false);

  // Modal states
  const [isAppFormOpen, setIsAppFormOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Postulacion | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Postulacion | null>(null);
  const [appFormPrefill, setAppFormPrefill] = useState<{
    empresaId?: number;
    fechaPostulacion?: string;
    fuente?: string;
  } | null>(null);
  const [appFormPrefillEmail, setAppFormPrefillEmail] = useState<Email | null>(null);

  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [followupPrefillPostulacionId, setFollowupPrefillPostulacionId] = useState("");

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composePrefill, setComposePrefill] = useState<{
    destinatario: string;
    asunto: string;
    cuerpo: string;
  }>({ destinatario: "", asunto: "", cuerpo: "" });

  const handleComposeAlContacto = useCallback((email: string) => {
    setComposePrefill({ destinatario: email, asunto: "", cuerpo: "" });
    setIsComposeOpen(true);
  }, []);

  const handleComposeALaEmpresa = useCallback(
    (empresa: Empresa) => {
      const primerContacto = contactos.data.find(
        (c) => Number(c.empresaId) === Number(empresa.id) && Boolean(c.email),
      );
      if (primerContacto) {
        setComposePrefill({ destinatario: primerContacto.email, asunto: "", cuerpo: "" });
      } else {
        setComposePrefill({ destinatario: "", asunto: "", cuerpo: "" });
        error(`La empresa "${empresa.nombre}" no tiene contactos con email`);
      }
      setIsComposeOpen(true);
    },
    [contactos.data, error],
  );

  // Guard: handle /auth/callback landing — read token from URL fragment
  if (typeof window !== "undefined" && window.location.pathname === "/auth/callback") {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("token");
    if (token) {
      sessionStorage.setItem("cvisto_token", token);
      console.info("[auth] token capturado del callback OAuth");
    } else {
      console.warn("[auth] /auth/callback sin token en el fragmento");
    }
    window.history.replaceState({}, "", "/");
  }

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

  // Handlers: mutations delegate to hooks
  const handleSaveApplication = async (data: PostulacionSinId) => {
    try {
      if (editingApplication) {
        const updated = await postulaciones.actualizar(editingApplication.id, data);
        if (selectedApplication?.id === updated.id) {
          setSelectedApplication(updated);
        }
        success(
          `Postulación a ${nombreEmpresa(empresas.data, updated.empresaId)} actualizada`
        );
      } else {
        const created = await postulaciones.crear(data);
        if (appFormPrefillEmail) {
          await emails.actualizar(appFormPrefillEmail.id, {
            postulacionId: Number(created.id),
          });
          setAppFormPrefillEmail(null);
          setAppFormPrefill(null);
          success(
            `Postulación a ${nombreEmpresa(empresas.data, created.empresaId)} registrada y email vinculado`
          );
        } else {
          success(
            `Postulación a ${nombreEmpresa(empresas.data, created.empresaId)} registrada exitosamente`
          );
        }
      }
    } catch (err) {
      error("No se pudo guardar la postulación");
      throw err;
    }
  };

  const handleCrearPostulacionDesdeEmail = (email: Email) => {
    setEditingApplication(null);
    setAppFormPrefillEmail(email);
    setAppFormPrefill({
      empresaId: empresaIdDesdeDominio(empresas.data, email.remitente),
      fechaPostulacion: email.fecha.slice(0, 10),
      fuente: "Email",
    });
    setIsAppFormOpen(true);
  };

  const handleQuickStatusChange = async (id: string, newEstado: EstadoPostulacion) => {
    try {
      const updated = await postulaciones.cambiarEstado(id, newEstado);
      if (selectedApplication?.id === id) {
        setSelectedApplication(updated);
      }
      success(`Estado actualizado a "${newEstado.replace("_", " ")}"`);
    } catch (err) {
      error("Error al cambiar de estado");
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      await postulaciones.eliminar(id);
      if (selectedApplication?.id === id) {
        setSelectedApplication(null);
      }
      success("Postulación eliminada del workspace");
    } catch (err) {
      error("No se pudo eliminar la postulación");
    }
  };

  const handleToggleEnviado = async (id: string) => {
    try {
      const updated = await seguimientos.alternarEnviado(id);
      success(
        updated.enviado === 1 ? "Tarea marcada como enviada" : "Tarea reactivada"
      );
    } catch (err) {
      error("Error al actualizar la tarea");
    }
  };

  const handleCreateFollowup = async (data: SeguimientoSinId) => {
    try {
      await seguimientos.crear(data);
      success("Nuevo seguimiento programado");
    } catch (err) {
      error("Error al crear seguimiento");
    }
  };

  const handleDeleteFollowup = async (id: string) => {
    try {
      await seguimientos.eliminar(id);
      success("Seguimiento eliminado");
    } catch (err) {
      error("Error al eliminar seguimiento");
    }
  };

  const handleCreateEmpresa = async (data: EmpresaSinId) => {
    try {
      const created = await empresas.crear(data);
      success(`Empresa ${created.nombre} agregada`);
    } catch (err) {
      error("Error al guardar empresa");
    }
  };

  const handleDeleteEmpresa = async (id: string) => {
    try {
      await empresas.eliminar(id);
      success("Empresa eliminada");
    } catch (err) {
      error("Error al eliminar empresa");
    }
  };

  const handleCreateContacto = async (data: ContactoSinId) => {
    try {
      const created = await contactos.crear(data);
      success(`Contacto ${created.nombre} guardado`);
    } catch (err) {
      error("Error al guardar contacto");
    }
  };

  const handleDeleteContacto = async (id: string) => {
    try {
      await contactos.eliminar(id);
      success("Contacto eliminado");
    } catch (err) {
      error("Error al eliminar contacto");
    }
  };

  const handleCreateEmail = async (data: EmailSinId) => {
    try {
      await emails.crear(data);
      success("Email registrado");
    } catch (err) {
      error("Error al registrar email");
    }
  };

  const handleDeleteEmail = async (id: string) => {
    try {
      await emails.eliminar(id);
      success("Email eliminado");
    } catch (err) {
      error("Error al eliminar email");
    }
  };

  const handleEnviarCorreo = async (input: {
    destinatario: string;
    asunto: string;
    cuerpo: string;
    cc?: string;
    adjuntos?: AdjuntoEnviar[];
  }) => {
    try {
      await gmailApi.enviar({
        destinatario: input.destinatario,
        asunto: input.asunto,
        cuerpo: input.cuerpo,
        cc: input.cc,
        adjuntos: input.adjuntos,
        tipo: "seguimiento",
      });
      await emails.refrescar();
      success(`Email enviado a ${input.destinatario}`);
    } catch (err) {
      error(err instanceof Error ? err.message : "Error al enviar el email");
      throw err;
    }
  };

  const handleComposeEmailPrefill = (prefill: {
    destinatario: string;
    asunto: string;
    cuerpo: string;
  }) => {
    setComposePrefill(prefill);
    setIsComposeOpen(true);
  };

  const handleSincronizarEstrategia = async (dias: number) => {
    const resumen = await estrategia.sincronizar(dias);
    await Promise.all([
      postulaciones.refrescar(),
      emails.refrescar(),
      seguimientos.refrescar(),
    ]);
    return resumen;
  };

  const handleRenovarEstrategia = async (
    items: { postulacion_id: number; asunto?: string; cuerpo?: string }[],
  ) => {
    return estrategia.renovar(items);
  };

  const handleConfirmarRechazoEstrategia = async (postulacionId: number) => {
    await estrategia.confirmarRechazo(postulacionId);
  };

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
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cvisto-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success("Backup descargado en formato JSON");
  };

  // Open task prefilled for a postulation
  const handleAddFollowupForApp = (postulacionId: string) => {
    setFollowupPrefillPostulacionId(postulacionId);
    setIsFollowupModalOpen(true);
  };

  // Handler: Register strategic follow-up on a postulation
  const handleRegisterSeguimiento = async (
    postulacionId: string,
    datos: DatosRegistroContacto,
    diasCadenciaSugerida?: number
  ) => {
    try {
      await postulaciones.registrarSeguimiento(
        postulacionId,
        datos,
        diasCadenciaSugerida
      );
      await seguimientos.refrescar();
      success("Contacto registrado y próximo contacto agendado");
    } catch (err) {
      error("Error al registrar el contacto");
      throw err;
    }
  };

  const handleActualizarGlobal = async () => {
    if (actualizandoGlobal) return;
    setActualizandoGlobal(true);
    try {
      const r = await handleSincronizarEstrategia(60);
      success(
        r.importados > 0 || r.estados_actualizados > 0
          ? `Actualizado: ${r.importados} mails nuevos, ${r.estados_actualizados} estado(s) actualizado(s)`
          : "Datos al día: sin cambios",
      );
    } catch (e) {
      error(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setActualizandoGlobal(false);
    }
  };

  // View Titles
  const viewMeta: Record<NavView, { title: string; subtitle?: string }> = {
    dashboard: {
      title: "Dashboard",
      subtitle: "Vista general de postulaciones, métricas y agenda de hoy",
    },
    postulaciones: {
      title: "Postulaciones",
      subtitle: "Gestión de vacantes, empresas y entrevistas",
    },
    empresas: {
      title: "Empresas",
      subtitle: "Directorio de organizaciones y reclutadores",
    },
    contactos: {
      title: "Contactos",
      subtitle: "Red de reclutadores, hiring managers y referentes",
    },
    seguimientos: {
      title: "Seguimientos & Agenda",
      subtitle: "Próximos pasos, entrevistas técnicas y tareas",
    },
    emails: {
      title: "Emails",
      subtitle: "Historial de correos vinculados a tus postulaciones",
    },
    estrategia: {
      title: "Estrategia & Seguimiento Automático",
      subtitle: "Sincronizá Gmail, detectá respuestas y renová contactos en lote",
    },
    estadisticas: {
      title: "Estadísticas & Conversión",
      subtitle: "Métricas de efectividad y embudo de selección",
    },
    configuracion: {
      title: "Configuración",
      subtitle: "Ajustes de perfil, preferencias y copias de seguridad",
    },
  };

  const pendingTasks = seguimientos.data.filter((s) => s.enviado === 0).length;
  const activeApps = postulaciones.data.filter(
    (p) => p.estado === "pendiente" || p.estado === "en_proceso" || p.estado === "entrevista"
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
        activeAppsCount={activeApps}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          title={viewMeta[currentView].title}
          subtitle={viewMeta[currentView].subtitle}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNewApplicationModal={() => {
            setEditingApplication(null);
            setIsAppFormOpen(true);
          }}
          searchQuery={globalSearch}
          onSearchChange={(q) => {
            setGlobalSearch(q);
            if (currentView !== "postulaciones" && q.trim().length > 0) {
              setCurrentView("postulaciones");
            }
          }}
          urgentFollowupsCount={pendingTasks}
          onQuickNavigateFollowups={() => setCurrentView("seguimientos")}
          onActualizar={handleActualizarGlobal}
          actualizando={actualizandoGlobal}
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
              onToggleEnviado={handleToggleEnviado}
              onSelectApplication={(p) => setSelectedApplication(p)}
              onNavigate={(view) => setCurrentView(view)}
              onOpenNewApplicationModal={() => {
                setEditingApplication(null);
                setIsAppFormOpen(true);
              }}
              onOpenNewFollowupModal={() => {
                setFollowupPrefillPostulacionId("");
                setIsFollowupModalOpen(true);
              }}
            />
          )}

          {currentView === "postulaciones" && (
            <ApplicationsView
              postulaciones={postulaciones.data}
              empresas={empresas.data}
              onSelectApplication={(p) => setSelectedApplication(p)}
              onEditApplication={(p) => {
                setEditingApplication(p);
                setIsAppFormOpen(true);
              }}
              onDeleteApplication={handleDeleteApplication}
              onQuickStatusChange={handleQuickStatusChange}
              onOpenNewModal={() => {
                setEditingApplication(null);
                setIsAppFormOpen(true);
              }}
              searchQuery={globalSearch}
              onSearchChange={setGlobalSearch}
            />
          )}

          {currentView === "empresas" && (
            <CompaniesView
              empresas={empresas.data}
              onCreateEmpresa={handleCreateEmpresa}
              onDeleteEmpresa={handleDeleteEmpresa}
              onFilterByCompany={(emp) => {
                setGlobalSearch(emp);
                setCurrentView("postulaciones");
              }}
              onComposeToEmpresa={handleComposeALaEmpresa}
            />
          )}

          {currentView === "contactos" && (
            <ContactsView
              contactos={contactos.data}
              empresas={empresas.data}
              onCreateContacto={handleCreateContacto}
              onDeleteContacto={handleDeleteContacto}
              onComposeTo={handleComposeAlContacto}
            />
          )}

          {currentView === "seguimientos" && (
            <FollowupsView
              seguimientos={seguimientos.data}
              postulaciones={postulaciones.data}
              empresas={empresas.data}
              onToggleEnviado={handleToggleEnviado}
              onDeleteFollowup={handleDeleteFollowup}
              onOpenNewTaskModal={() => {
                setFollowupPrefillPostulacionId("");
                setIsFollowupModalOpen(true);
              }}
            />
          )}

          {currentView === "emails" && (
            <EmailsView
              emails={emails.data}
              postulaciones={postulaciones.data}
              empresas={empresas.data}
              onCreateEmail={handleCreateEmail}
              onDeleteEmail={handleDeleteEmail}
              onCrearPostulacionDesdeEmail={handleCrearPostulacionDesdeEmail}
              onComposeEmail={handleComposeEmailPrefill}
            />
          )}

          {currentView === "estrategia" && (
            <EstrategiaView
              renovaciones={estrategia.renovaciones}
              revisiones={estrategia.revisiones}
              estadisticas={estrategia.estadisticas}
              cargando={estrategia.cargando}
              error={estrategia.error}
              onSincronizar={handleSincronizarEstrategia}
              onRenovar={handleRenovarEstrategia}
              onConfirmarRechazo={handleConfirmarRechazoEstrategia}
              onNavigate={setCurrentView}
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
        isOpen={isAppFormOpen}
        onClose={() => {
          setIsAppFormOpen(false);
          setEditingApplication(null);
          setAppFormPrefill(null);
          setAppFormPrefillEmail(null);
        }}
        onSubmit={handleSaveApplication}
        initialData={editingApplication}
        empresas={empresas.data}
        prefill={appFormPrefill}
      />

      {/* Application Details Dossier Modal */}
      <ApplicationDetailModal
        isOpen={Boolean(selectedApplication)}
        onClose={() => setSelectedApplication(null)}
        postulacion={selectedApplication}
        onUpdateStatus={handleQuickStatusChange}
        onEdit={(p) => {
          setEditingApplication(p);
          setIsAppFormOpen(true);
        }}
        onDelete={handleDeleteApplication}
        onAddFollowup={handleAddFollowupForApp}
        onRegisterInteraction={handleRegisterSeguimiento}
        empresas={empresas.data}
        linkedFollowups={
          selectedApplication
            ? seguimientos.data.filter(
                (s) => Number(s.postulacionId) === Number(selectedApplication.id)
              )
            : []
        }
      />

      {/* Followup Task Modal */}
      <FollowupFormModal
        isOpen={isFollowupModalOpen}
        onClose={() => {
          setIsFollowupModalOpen(false);
          setFollowupPrefillPostulacionId("");
        }}
        onSubmit={handleCreateFollowup}
        prefilledPostulacionId={followupPrefillPostulacionId}
        postulaciones={postulaciones.data}
        empresas={empresas.data}
      />

      {/* Compose Email Modal */}
      <ComposeEmailModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        prefill={composePrefill}
        contactos={contactos.data}
        onEnviado={handleEnviarCorreo}
      />

      {/* Floating compose button */}
      <button
        type="button"
        onClick={() => {
          setComposePrefill({ destinatario: "", asunto: "", cuerpo: "" });
          setIsComposeOpen(true);
        }}
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
