import { env } from '../config/env';
import type { TipoRespuesta } from '../types/common';

const MODELO = 'gemini-2.0-flash';
const URL_GEMINI = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`;
const TIMEOUT_MS = 15_000;

export const TAMANIO_LOTE = 10;
export const MAX_CONTENIDO_POR_EMAIL = 1500;

export interface EmailParaAnalisis {
  id: string;
  asunto: string | null;
  remitente: string;
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

function construirPrompt(emails: EmailParaAnalisis[]): string {
  const bloques = emails
    .map(
      (email, i) =>
        `[${i}]\nAsunto: ${email.asunto ?? '(sin asunto)'}\nRemitente: ${email.remitente}\nContenido:\n${email.contenido.slice(0, MAX_CONTENIDO_POR_EMAIL)}`,
    )
    .join('\n\n');

  return `Clasificá cada correo de respuesta a una postulación de trabajo.

Tipos posibles (elegí exactamente UNO por correo):
- rechazo: la empresa comunica que no avanza con el candidato.
- entrevista: invita a una entrevista o a continuar el proceso.
- oferta: ofrece el puesto, condiciones o propuesta laboral.
- novedad: actualización de estado sin decisión final clara.
- contacto: consulta o mensaje humano sin decisión.
- otro: no aplica a una postulación.

Respondé SOLO JSON, un array de objetos, una entrada por correo:
[{"index": 0, "tipo": "rechazo", "confianza": 0-100, "motivo": "breve"}] 

Correos:
${bloques}`;
}

async function llamarGemini(prompt: string): Promise<unknown> {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada');
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
  } finally {
    clearTimeout(temporizador);
  }
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
  const bloques = emails
    .map(
      (email, i) =>
        `[${i}]\nAsunto: ${email.asunto ?? '(sin asunto)'}\nRemitente: ${email.remitente}\nContenido:\n${email.contenido.slice(0, MAX_CONTENIDO_POR_EMAIL)}`,
    )
    .join('\n\n');

  return `Determiná si cada correo corresponde a una postulación laboral (el candidato aplicó o está en un proceso de selección para un puesto concreto).

Es una postulación si el correo:
- confirma o responde una candidatura/aplicación enviada,
- invita a una entrevista, hace una oferta o comunica una decisión (avance/rechazo) de un proceso de selección,
- es el propio candidato postulándose a una vacante (correo enviado).

NO es una postulación si es: newsletter, promoción, factura, notificación automática de un sistema, mensaje personal o laboral genérico sin puesto concreto, correo vacío.

Si es una postulación, extraé el PUESTO (título del puesto al que refiere); si no se menciona ningún puesto devolvé null.

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