export interface VistaMeta {
  title: string;
  subtitle?: string;
}

export const VIEW_META: Record<string, VistaMeta> = {
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
  privacidad: {
    title: "Política de Privacidad",
    subtitle: "Cómo tratamos tus datos personales en CVisto",
  },
  terminos: {
    title: "Términos de Servicio",
    subtitle: "Condiciones de uso de CVisto",
  },
  "not-found": {
    title: "Página no encontrada",
    subtitle: "La ruta que buscás no existe",
  },
};