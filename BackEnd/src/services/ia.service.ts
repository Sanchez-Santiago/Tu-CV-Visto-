import { env } from '../config/env';
import type { TipoRespuesta } from '../types/common';

const MODELO = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const URL_GEMINI = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`;
const TIMEOUT_MS = 60_000;
const RETRIES = 3;
const ESPERAS_RETRY_MS = [2_000, 5_000, 10_000];

export const TAMANIO_LOTE = 5;
export const MAX_CONTENIDO_POR_EMAIL = 2500;

export interface EmailParaAnalisis {
  id: string;
  asunto: string | null;
  remitente: string;
  destinatario?: string;
  cc?: string | null;
  replyTo?: string | null;
  fecha?: string | null;
  messageId?: string | null;
  inReplyTo?: string | null;
  references?: string | null;
  es_enviado?: boolean;
  contenido: string;
  cuerpoHtml?: string | null;
  enlaces?: string[];
  adjuntos?: string[];
}

export interface ClasificacionIA {
  tipo: TipoRespuesta;
  confianza: number;
  motivo: string;
}

export interface DeteccionPostulacionIA {
  es_postulacion: boolean;
  puesto: string | null;
  empresa?: string | null;
  confianza: number;
  motivo: string;
  es_alerta_empleo?: boolean;
  es_actualizacion?: boolean;
  estado_sugerido?: string | null;
}

export interface GeminiErrorDetalle {
  status: number;
  statusText: string;
  body: string;
  tipoError: 'RATE_LIMIT_429' | 'QUOTA_EXHAUSTED' | 'SERVER_ERROR' | 'CLIENT_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT';
  mensaje: string;
}

const TIPOS_VALIDOS: readonly TipoRespuesta[] = [
  'rechazo',
  'entrevista',
  'oferta',
  'novedad',
  'contacto',
  'otro',
];

export function iaEstaConfigurada(): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

function esTipoValido(valor: unknown): valor is TipoRespuesta {
  return (
    typeof valor === 'string' && (TIPOS_VALIDOS as readonly string[]).includes(valor)
  );
}

// Concurrency gate: asegura que las llamadas a Gemini se ejecuten secuencialmente sin saturar la cuota
let llamadaGeminiEnCurso: Promise<unknown> = Promise.resolve();

async function ejecutarConConcurrenciaControlada<T>(
  operacion: () => Promise<T>,
): Promise<T> {
  const anterior = llamadaGeminiEnCurso;
  let resolverSiguiente: () => void = () => {};
  llamadaGeminiEnCurso = new Promise<void>((r) => {
    resolverSiguiente = r;
  });

  await anterior.catch(() => {});
  try {
    return await operacion();
  } finally {
    resolverSiguiente();
  }
}

function construirBloque(email: EmailParaAnalisis, i: number): string {
  const direccion = email.es_enviado ? `→ ${email.destinatario ?? '?'}` : email.remitente;
  const direccionLabel = email.es_enviado ? 'Destinatario' : 'Remitente';
  const enviadoLabel = email.es_enviado ? ' [ENVIADO POR EL CANDIDATO]' : ' [RECIBIDO]';
  const extraHeaders: string[] = [];
  if (email.cc) extraHeaders.push(`Cc: ${email.cc}`);
  if (email.replyTo) extraHeaders.push(`Reply-To: ${email.replyTo}`);
  if (email.fecha) extraHeaders.push(`Fecha: ${email.fecha}`);
  if (email.inReplyTo) extraHeaders.push(`In-Reply-To: ${email.inReplyTo}`);
  if (email.enlaces && email.enlaces.length > 0) {
    extraHeaders.push(`Enlaces: ${email.enlaces.slice(0, 5).join(', ')}`);
  }
  if (email.adjuntos && email.adjuntos.length > 0) {
    extraHeaders.push(`Adjuntos: ${email.adjuntos.join(', ')}`);
  }

  const cabecerasExtra = extraHeaders.length > 0 ? `\n${extraHeaders.join('\n')}` : '';

  return `[${i}]${enviadoLabel}\nAsunto: ${email.asunto ?? '(sin asunto)'}\n${direccionLabel}: ${direccion}${cabecerasExtra}\nContenido:\n${email.contenido.slice(0, MAX_CONTENIDO_POR_EMAIL)}`;
}

function construirPrompt(emails: EmailParaAnalisis[]): string {
  const bloques = emails.map(construirBloque).join('\n\n');

  return `Clasificá cada correo analizando el contexto completo (remitente, destinatario, asunto, fecha, enlaces, adjuntos y cuerpo).

REGLAS DE CLASIFICACIÓN:
1. Si el correo está marcado como [ENVIADO POR EL CANDIDATO], clasificalo como "contacto" si es comunicación general, o "otro" si es irrelevante.
2. IMPORTANTÍSIMO SOBRE PORTALES DE EMPLEO (Computrabajo, LinkedIn, InfoJobs, Indeed, Bumeran, Glassdoor, etc.):
   - Si es una ALERTA o boletín de nuevas ofertas ("Nuevas ofertas", "Empleos que podrían interesarte", "Trabajos para ti", etc.): clasificalo como "otro".
   - Pero si es un CAMBIO DE ESTADO o NOVEDAD de una candidatura ("Tu candidatura ha sido vista", "La empresa ha revisado tu perfil", "Has avanzado a la siguiente etapa", "Candidatura en evaluación", "Candidatura descartada"):
     * Si comunica entrevista o avance: "entrevista"
     * Si comunica rechazo o descarte: "rechazo"
     * Si comunica revisión de perfil o actualización: "novedad"
3. Si la empresa invita a entrevista o llamada: "entrevista".
4. Si la empresa ofrece el puesto o propuesta económica: "oferta".
5. Si la empresa rechaza o descarta al candidato: "rechazo".
6. Newsletters, publicidad, promociones, facturas o spam: "otro".

Tipos posibles:
- rechazo
- entrevista
- oferta
- novedad
- contacto
- otro

Respondé SOLO JSON estricto, un array de objetos:
[{"index": 0, "tipo": "rechazo", "confianza": 95, "motivo": "Explicación breve"}]

Correos:
${bloques}`;
}

function construirPromptPostulacion(emails: EmailParaAnalisis[]): string {
  const bloques = emails.map(construirBloque).join('\n\n');

  return `Analizá el contexto completo de cada correo para determinar si corresponde a una postulación laboral o proceso de selección.

CRITERIOS IMPORTANTES:
1. EMAILS ENVIADOS [ENVIADO POR EL CANDIDATO]:
   - Analizá conjuntamente: destinatario (rrhh@, talent@, jobs@, recruiting@, etc.), asunto y cuerpo completo.
   - Si el candidato envía su CV, consulta por vacante o se postula a una posición, ES UNA POSTULACIÓN (es_postulacion = true), aunque el asunto sea genérico (ej: "Consulta", "CV Juan", "Contacto"). Extraé la empresa destinataria y el puesto si se deducen del texto.
   - Si el correo enviado no tiene relación laboral (ej: consulta administrativa, compras, personal), es_postulacion = false.

2. EMAILS RECIBIDOS:
   - ALERTA_EMPLEO: Correos automáticos de portales (Computrabajo, LinkedIn, Indeed, etc.) con listas de ofertas recomendadas -> NO es postulación (es_postulacion = false, es_alerta_empleo = true).
   - ACTUALIZACION_POSTULACION: Notificaciones de que una empresa vio el CV, revisó el perfil, avanzó el proceso o rechazó la candidatura -> es_postulacion = true, es_actualizacion = true. Extraé empresa y puesto.
   - Confirmación de aplicación de una empresa o recruiter directo -> es_postulacion = true.

3. EXTRACCIÓN DE EMPRESA Y PUESTO:
   - Si se detecta una postulación o actualización, extraé:
     * puesto: Título del rol o posición (ej: "Backend Developer", "Desarrollador Node.js"). Si no se especifica, devolver null.
     * empresa: Nombre de la empresa a la que se postula o que revisó la candidatura. Si no se puede deducir, devolver null.

Respondé SOLO JSON estricto, un array de objetos:
[
  {
    "index": 0,
    "es_postulacion": true,
    "puesto": "Backend Developer",
    "empresa": "Empresa X",
    "es_alerta_empleo": false,
    "es_actualizacion": false,
    "estado_sugerido": "pendiente",
    "confianza": 95,
    "motivo": "El candidato envía su CV postulándose a Backend Developer"
  }
]

Correos:
${bloques}`;
}

async function ejecutarFetchGemini(prompt: string): Promise<unknown> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada');
  }

  let ultimoError: unknown;

  for (let intento = 0; intento <= RETRIES; intento += 1) {
    if (intento > 0) {
      const baseEspera = ESPERAS_RETRY_MS[intento - 1] ?? 10_000;
      // Agregar jitter aleatorio de 200 a 1000ms
      const espera = baseEspera + Math.floor(Math.random() * 800);
      console.warn(
        `[IA][Gemini] Reintento ${intento}/${RETRIES} tras espera de ${espera}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, espera));
    }

    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), TIMEOUT_MS);

    try {
      const respuesta = await fetch(`${URL_GEMINI}?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0,
          },
        }),
        signal: control.signal,
      });

      if (!respuesta.ok) {
        const bodyError = await respuesta.text().catch(() => '');
        const es429 = respuesta.status === 429;
        const tipo = es429 ? 'RATE_LIMIT_429' : 'SERVER_ERROR';

        console.error(
          `[IA][Gemini Error ${respuesta.status}] ${respuesta.statusText} (${tipo}):\n${bodyError}`,
        );

        const errorConDetalle = new Error(
          `Gemini respondió ${respuesta.status} (${respuesta.statusText}): ${bodyError.slice(0, 300)}`,
        );
        (errorConDetalle as unknown as { status: number }).status = respuesta.status;
        (errorConDetalle as unknown as { statusText: string }).statusText = respuesta.statusText;
        (errorConDetalle as unknown as { body: string }).body = bodyError;

        throw errorConDetalle;
      }

      const cuerpo = (await respuesta.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const texto = cuerpo.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof texto !== 'string' || texto.trim() === '') {
        throw new Error('Gemini devolvió una respuesta vacía');
      }

      const limpio = texto
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      return JSON.parse(limpio);
    } catch (error) {
      ultimoError = error;
      if (!esErrorTransitorio(error)) {
        throw error;
      }
    } finally {
      clearTimeout(temporizador);
    }
  }

  throw ultimoError;
}

async function llamarGemini(prompt: string): Promise<unknown> {
  return ejecutarConConcurrenciaControlada(() => ejecutarFetchGemini(prompt));
}

function esErrorTransitorio(error: unknown): boolean {
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }
  if (error instanceof TypeError) {
    return true;
  }
  const status = (error as unknown as { status?: number })?.status;
  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  const mensaje = error instanceof Error ? error.message : String(error);
  return /Gemini respondió (429|500|502|503|504)/.test(mensaje);
}

export async function clasificarLote(
  emails: EmailParaAnalisis[],
): Promise<(ClasificacionIA | null)[]> {
  if (emails.length === 0) return [];

  try {
    const datos = await llamarGemini(construirPrompt(emails));
    if (!Array.isArray(datos)) {
      throw new Error('Gemini devolvió un formato inválido');
    }

    const porIndice = new Map<number, ClasificacionIA>();
    for (const entrada of datos as Record<string, unknown>[]) {
      const indice = Number(entrada?.index);
      if (!Number.isInteger(indice)) continue;
      const tipo = entrada?.tipo;
      if (!esTipoValido(tipo)) continue;
      porIndice.set(indice, {
        tipo,
        confianza:
          typeof entrada?.confianza === 'number' ? entrada.confianza : 0,
        motivo: typeof entrada?.motivo === 'string' ? entrada.motivo : '',
      });
    }

    return emails.map((_, i) => porIndice.get(i) ?? null);
  } catch (error) {
    console.error('[IA] No se pudo clasificar el lote:', error);
    return emails.map(() => null);
  }
}

export async function clasificarConIA(
  email: EmailParaAnalisis,
): Promise<ClasificacionIA | null> {
  const resultados = await clasificarLote([email]);
  return resultados[0] ?? null;
}

export async function detectarPostulacionesLote(
  emails: EmailParaAnalisis[],
): Promise<(DeteccionPostulacionIA | null)[]> {
  if (emails.length === 0) return [];

  try {
    const datos = await llamarGemini(construirPromptPostulacion(emails));
    if (!Array.isArray(datos)) {
      throw new Error('Gemini devolvió un formato inválido');
    }

    const porIndice = new Map<number, DeteccionPostulacionIA>();
    for (const entrada of datos as Record<string, unknown>[]) {
      const indice = Number(entrada?.index);
      if (!Number.isInteger(indice)) continue;
      if (typeof entrada?.es_postulacion !== 'boolean') continue;
      porIndice.set(indice, {
        es_postulacion: entrada.es_postulacion,
        puesto:
          typeof entrada?.puesto === 'string' && entrada.puesto.trim() !== ''
            ? entrada.puesto.trim()
            : null,
        empresa:
          typeof entrada?.empresa === 'string' && entrada.empresa.trim() !== ''
            ? entrada.empresa.trim()
            : null,
        es_alerta_empleo: Boolean(entrada?.es_alerta_empleo),
        es_actualizacion: Boolean(entrada?.es_actualizacion),
        estado_sugerido:
          typeof entrada?.estado_sugerido === 'string'
            ? entrada.estado_sugerido
            : null,
        confianza:
          typeof entrada?.confianza === 'number' ? entrada.confianza : 0,
        motivo: typeof entrada?.motivo === 'string' ? entrada.motivo : '',
      });
    }

    return emails.map((_, i) => porIndice.get(i) ?? null);
  } catch (error) {
    console.error('[IA] No se pudo detectar postulaciones en el lote:', error);
    return emails.map(() => null);
  }
}
