import type { TipoRespuesta } from '../types/common';

export type { TipoRespuesta };

const FRASES_RECHAZO = [
  'no preseleccionado',
  'no preseleccionada',
  'no estamos avanzando',
  'no estaremos avanzando',
  'no continuar',
  'no seguiremos',
  'no seguir profundizando',
  'no vamos a avanzar',
  'hemos decidido no',
  'decidimos no',
  'gracias por tu interés',
  'gracias por tu interes',
  'gracias por postularte',
  'gracias por tu postulación',
  'gracias por tu postulacion',
  'fuera del proceso',
  'queda en nuestro cv',
  'otras candidaturas',
  'perfil no se ajusta',
  'no se ajusta',
  'no ajusta al perfil',
  'proceso ha sido cerrado',
  'rechaz',
  'rechazar',
  'descartad',
  'descartado',
  'descartada',
  'not selected',
  'not selecting',
  'unfortunately',
  "won't be moving",
  'not to move forward',
  'no longer considering',
  'other candidates',
  'not successful',
] as const;

const FRASES_ENTREVISTA = [
  'entrevista',
  'te invitamos',
  'gustaría conocerte',
  'gustaria conocerte',
  'queremos conocer',
  'avanzamos a la siguiente',
  'avanzar al siguiente',
  'siguiente etapa',
  'siguiente paso',
  'pasar a la siguiente',
  'agendar una entrevista',
  'programar una entrevista',
  'interview',
  'next step',
  'next stage',
  'would like to meet',
  'moving forward',
  'moving you forward',
  'invite you',
] as const;

const FRASES_NOVEDAD = [
  'novedad',
  'novedades',
  'actualización',
  'actualizacion',
  'progreso',
  'news',
  'status',
] as const;

/** Dominios/patrones de portales de alertas de empleo. Si el remitente contiene
 *  alguno de estos, el email se clasifica directamente como 'otro' para evitar
 *  falsos positivos (e.g. "Nueva oferta laboral en LinkedIn"). */
const REMITENTES_PORTALES = [
  'jobalert', 'job-alert', 'job_alert',
  'alertas@', 'alertas.',
  'noreply@linkedin', 'jobs-noreply@', 'jobalerts@',
  'computrabajo', 'bumeran', 'zonajobs', 'multitrabajos',
  'indeed', 'glassdoor', 'infojobs', 'catho',
  'talent.com', 'jobs.lever', 'greenhouse.io',
  'workday', 'smartrecruiters', 'icims',
  'alert@', 'alerts@', 'no-reply@jobs', 'noreply@jobs',
] as const;

const ASUNTOS_ALERTA_EMPLEO = [
  'nueva oferta laboral',
  'nuevas ofertas',
  'ofertas que te pueden interesar',
  'trabajos para ti',
  'jobs for you',
  'job alert',
  'job matches',
  'new jobs',
  'recomendaciones de empleo',
] as const;

function normalizar(texto: string): string {
  return (
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  );
}

export function extraerEmailDireccion(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  );
  if (match) return match[0];
  const limpio = header.trim();
  return limpio.includes('@') ? limpio : null;
}

const TLDs = new Set(
  [
    'com', 'com.ar', 'com.mx', 'com.co', 'com.br', 'com.pe', 'com.uy',
    'com.ve', 'com.ec', 'com.py', 'com.do', 'co', 'net', 'org', 'io',
    'dev', 'app', 'es', 'mx', 'ar', 'cl', 'co', 'br', 'uy', 'pe', 've', 'ec',
    'info', 'biz', 'jobs', 'edu', 'gob', 'gov',
  ],
);

export function dominioSinTld(email: string): string {
  const direccion = extraerEmailDireccion(email) ?? '';
  const arroba = direccion.lastIndexOf('@');
  if (arroba === -1) return '';
  let dominio = direccion.slice(arroba + 1).toLowerCase();
  for (const tld of TLDs) {
    if (dominio.endsWith(`.${tld}`)) {
      dominio = dominio.slice(0, -(tld.length + 1));
      break;
    }
  }
  return dominio.replace(/[^a-z0-9]/g, '');
}

function palabrasEmpresa(nombre: string): string {
  return normalizar(nombre).replace(/[^a-z0-9]/g, '');
}

const FRASES_ACTUALIZACION_PORTAL = [
  'tu candidatura ha sido vista',
  'tu candidatura fue vista',
  'candidatura vista',
  'cv visto',
  'ha visto tu cv',
  'ha visto tu candidatura',
  'ha revisado tu perfil',
  'revisaron tu perfil',
  'tu perfil fue revisado',
  'candidatura continua en el proceso',
  'candidatura continua en evaluacion',
  'candidatura esta en proceso',
  'has avanzado a la siguiente etapa',
  'avanzaste a la siguiente etapa',
  'avanzaste en el proceso',
  'has avanzado en el proceso',
  'siguiente etapa del proceso',
  'actualizado el estado de tu candidatura',
  'actualizo el estado de tu candidatura',
  'nuevo estado de tu candidatura',
  'estado de tu postulacion',
  'tu candidatura ha sido rechazada',
  'tu candidatura ha sido descartada',
  'candidatura descartada',
  'no ha sido seleccionada',
  'application viewed',
  'viewed your application',
  'resume viewed',
  'moving forward with your application',
  'status of your application',
  'application status',
  'application updated',
] as const;

export function esPortalDeEmpleo(remitente: string | null): boolean {
  const rem = normalizar(remitente ?? '');
  return REMITENTES_PORTALES.some((patron) => rem.includes(patron));
}

export function esActualizacionDeCandidatura(
  remitente: string | null,
  asunto: string | null,
  cuerpo?: string | null,
): boolean {
  const texto = normalizar(`${asunto ?? ''} ${cuerpo ?? ''}`);
  return FRASES_ACTUALIZACION_PORTAL.some((frase) =>
    texto.includes(normalizar(frase)),
  );
}

export function esAlertaDeEmpleo(
  remitente: string | null,
  asunto: string | null,
  cuerpo?: string | null,
): boolean {
  // Si es actualización de candidatura, NUNCA es una simple alerta
  if (esActualizacionDeCandidatura(remitente, asunto, cuerpo)) {
    return false;
  }

  const asu = normalizar(asunto ?? '');
  for (const frase of ASUNTOS_ALERTA_EMPLEO) {
    if (asu.includes(normalizar(frase))) return true;
  }

  const rem = normalizar(remitente ?? '');
  if (
    rem.includes('jobalert') ||
    rem.includes('job-alert') ||
    rem.includes('alertas@') ||
    rem.includes('jobalerts@') ||
    rem.includes('noreply@jobs')
  ) {
    return true;
  }

  return false;
}

export function clasificarRespuesta(input: {
  asunto: string | null;
  remitente: string | null;
  cuerpo: string;
}): TipoRespuesta {
  // Si es una actualización de estado de portal (e.g. Computrabajo "tu candidatura fue vista")
  if (
    esActualizacionDeCandidatura(input.remitente, input.asunto, input.cuerpo)
  ) {
    const texto = normalizar(`${input.asunto ?? ''} ${input.cuerpo}`);
    for (const frase of FRASES_RECHAZO) {
      if (texto.includes(normalizar(frase))) return 'rechazo';
    }
    for (const frase of FRASES_ENTREVISTA) {
      if (texto.includes(normalizar(frase))) return 'entrevista';
    }
    return 'novedad';
  }

  // Si es una alerta automática de empleo (nuevas ofertas de trabajo recomendadas) -> ignorar
  if (esAlertaDeEmpleo(input.remitente, input.asunto, input.cuerpo)) {
    return 'otro';
  }

  const texto = normalizar(
    `${input.asunto ?? ''} ${input.remitente ?? ''} ${input.cuerpo}`,
  );

  if (texto.length === 0) return 'otro';

  for (const frase of FRASES_RECHAZO) {
    if (texto.includes(normalizar(frase))) return 'rechazo';
  }

  for (const frase of FRASES_ENTREVISTA) {
    if (texto.includes(normalizar(frase))) return 'entrevista';
  }

  for (const frase of FRASES_NOVEDAD) {
    if (texto.includes(normalizar(frase))) return 'novedad';
  }

  return 'contacto';
}

export interface PostulacionLigera {
  id: number;
  puesto: string;
  empresa_nombre: string;
}

export interface EmailEnviadoLigero {
  postulacion_id: number;
  destinatario: string;
  gmail_message_id?: string | null;
}

export function matchearPostulacion(input: {
  remitente: string | null;
  asunto: string | null;
  cuerpo?: string | null;
  postulaciones: PostulacionLigera[];
  emailsEnviados: EmailEnviadoLigero[];
  inReplyTo?: string | null;
  references?: string | null;
}): number | null {
  // 1. Coincidencia por In-Reply-To o References con messageId de emails enviados
  if (input.inReplyTo || input.references) {
    const refs = `${input.inReplyTo ?? ''} ${input.references ?? ''}`.toLowerCase();
    for (const email of input.emailsEnviados) {
      if (
        email.gmail_message_id &&
        refs.includes(email.gmail_message_id.toLowerCase())
      ) {
        return email.postulacion_id;
      }
    }
  }

  // 2. Coincidencia directa por email del destinatario del envío
  const remitente = normalizar(
    extraerEmailDireccion(input.remitente ?? '') ?? '',
  );

  if (remitente && !esPortalDeEmpleo(input.remitente)) {
    for (const email of input.emailsEnviados) {
      if (normalizar(email.destinatario) === remitente) {
        return email.postulacion_id;
      }
    }
  }

  const asunto = normalizar(input.asunto ?? '');
  const cuerpo = normalizar(input.cuerpo ?? '');
  if (!asunto && !remitente && !cuerpo) return null;

  const dominio = dominioSinTld(input.remitente ?? '');
  let mejor: number | null = null;
  let mayorCoincidencia = 0;

  for (const postulacion of input.postulaciones) {
    const puesto = normalizar(postulacion.puesto);
    const empresa = normalizar(postulacion.empresa_nombre);
    let coincidencia = 0;

    if (puesto.length > 2 && asunto.includes(puesto)) coincidencia += 4;
    if (empresa.length > 2 && asunto.includes(empresa)) coincidencia += 3;

    // Coincidencia en el cuerpo del mensaje
    if (empresa.length > 2 && cuerpo.includes(empresa)) coincidencia += 2;
    if (puesto.length > 3 && cuerpo.includes(puesto)) coincidencia += 2;

    if (dominio && !esPortalDeEmpleo(input.remitente)) {
      const claveEmpresa = palabrasEmpresa(postulacion.empresa_nombre);
      if (
        claveEmpresa.length > 3 &&
        (dominio.includes(claveEmpresa) || claveEmpresa.includes(dominio))
      ) {
        coincidencia += 3;
      }
    }

    if (coincidencia > mayorCoincidencia) {
      mayorCoincidencia = coincidencia;
      mejor = postulacion.id;
    }
  }

  return mayorCoincidencia >= 2 ? mejor : null;
}