import { env } from '../config/env';
import type { TipoRespuesta } from '../types/common';

const MODELO = 'gemini-3.6-flash';
const URL_GEMINI = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`;
const TIMEOUT_MS = 60_000;
const RETRIES = 2;
const ESPERAS_RETRY_MS = [2_000, 5_000];

export const TAMANIO_LOTE = 5;
export const MAX_CONTENIDO_POR_EMAIL = 1500;

export interface EmailParaAnalisis {
  id: string;
  asunto: string | null;
  remitente: string;
  destinatario?: string;
  es_enviado?: boolean;
  contenido: string;
}

export interface ClasificacionIA {
  tipo: TipoRespuesta;
  confianza: number;
  motivo: string;
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

function construirBloque(email: EmailParaAnalisis, i: number): string {
  const direccion = email.es_enviado ? `→ ${email.destinatario ?? '?'}` : email.remitente;
  const direccionLabel = email.es_enviado ? 'Destinatario' : 'Remitente';
  const enviadoLabel = email.es_enviado ? ' [ENVIADO POR EL CANDIDATO]' : '';
  return `[${i}]${enviadoLabel}\nAsunto: ${email.asunto ?? '(sin asunto)'}\n${direccionLabel}: ${direccion}\nContenido:\n${email.contenido.slice(0, MAX_CONTENIDO_POR_EMAIL)}`;
}

function construirPrompt(emails: EmailParaAnalisis[]): string {
  const bloques = emails.map(construirBloque).join('\n\n');

  return `Clasificá cada correo relacionado a una búsqueda laboral del candidato.

REGLAS IMPORTANTES:
1. Si el correo está marcado como [ENVIADO POR EL CANDIDATO], clasificalo como "contacto" (es el candidato enviando, no una respuesta de empresa).
2. Ignorá alertas automáticas de portales de empleo (Computrabajo, LinkedIn Job Alerts, Indeed, Bumeran, etc.) — clasificalas como "otro".
3. Ignorá newsletters, promociones, facturas o mensajes sin relación con un proceso de selección específico — clasificalos como "otro".

Tipos posibles (elegí exactamente UNO por correo):
- rechazo: la empresa comunica que no avanza con el candidato.
- entrevista: la empresa invita a una entrevista o a continuar el proceso.
- oferta: la empresa ofrece el puesto o propuesta laboral concreta.
- novedad: actualización de estado sin decisión final clara.
- contacto: el candidato escribe, o es un mensaje humano sin decisión de proceso.
- otro: alerta de portal, newsletter, spam, o sin relación con una postulación.

Respondé SOLO JSON, un array de objetos, una entrada por correo:
[{"index": 0, "tipo": "rechazo", "confianza": 0-100, "motivo": "breve"}]

Correos:
${bloques}`;
}

async function llamarGemini(prompt: string): Promise<unknown> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada');
  }

  let ultimoError: unknown;
  for (let intento = 0; intento <= RETRIES; intento += 1) {
    if (intento > 0) {
      await new Promise((resolver) =>
        setTimeout(resolver, ESPERAS_RETRY_MS[intento - 1] ?? 5_000),
      );
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
        throw new Error(`Gemini respondió ${respuesta.status}`);
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

function esErrorTransitorio(error: unknown): boolean {
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }
  if (error instanceof TypeError) {
    return true;
  }
  const mensaje =
    error instanceof Error ? error.message : String(error);
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

export interface DeteccionPostulacionIA {
  es_postulacion: boolean;
  puesto: string | null;
  confianza: number;
  motivo: string;
}

function construirPromptPostulacion(emails: EmailParaAnalisis[]): string {
  const bloques = emails.map(construirBloque).join('\n\n');

  return `Determiná si cada correo corresponde a una postulación laboral (el candidato aplicó o está en un proceso de selección para un puesto concreto).

PISTAS DE DIRECCIÓN:
- Los correos marcados [ENVIADO POR EL CANDIDATO] son enviados por el propio candidato: en la enorme mayoría de los casos SON postulaciones (se postuló a una vacante o escribió al reclutador). Tratalos como postulación salvo que sea claramente un mensaje interno, una respuesta trivial o un tema sin relación laboral.
- Los correos recibidos (sin esa marca) son postulaciones solo si una empresa o un reclutador confirma o avanza el proceso de una candidatura del candidato.

Es una postulación si el correo:
- es el propio candidato postulándose o enviando su CV a una vacante,
- confirma o responde una candidatura/aplicación enviada,
- invita a una entrevista, hace una oferta o comunica una decisión (avance/rechazo) de un proceso de selección.

NO es una postulación (es_postulacion = false) si es:
- alertas automáticas de portales de empleo (por ejemplo "Trabajo Copado" de Computrabajo, "Nuevas ofertas que te pueden interesar", LinkedIn Job Alerts, Indeed, Bumeran, ZonaJobs, Glassdoor, etc.), aunque mencionen muchos puestos;
- newsletters, promociones, facturas, notificaciones de sistemas, mensajes personales o laborales genéricos sin un puesto concreto, correos vacíos.

Si es una postulación, extraé el PUESTO (título del puesto al que refiere, tomado del asunto o del contenido). Si no se menciona ningún puesto concreto, devolvé null.

Respondé SOLO JSON, un array de objetos, una entrada por correo:
[{"index": 0, "es_postulacion": true, "puesto": "Desarrollador Backend", "confianza": 0-100, "motivo": "breve"}]

Correos:
${bloques}`;
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