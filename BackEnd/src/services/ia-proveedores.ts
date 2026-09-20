import { env } from '../config/env';

export type IdProveedorIA =
  | 'gemini'
  | 'groq'
  | 'openrouter'
  | 'openai'
  | 'anthropic';

export interface ProveedorIA {
  id: IdProveedorIA;
  disponible(): boolean;
  completar(prompt: string): Promise<unknown>;
}

const TIMEOUT_MS = 60_000;

interface ErrorConEstado extends Error {
  status?: number;
}

function esErrorTransitorio(error: unknown): boolean {
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }
  if (error instanceof TypeError) {
    return true;
  }
  const status = (error as { status?: number })?.status;
  if (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return true;
  }
  const mensaje = error instanceof Error ? error.message : String(error);
  return /respondió (429|500|502|503|504)/.test(mensaje);
}

function limpiarJson(texto: string): unknown {
  const limpio = texto
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(limpio);
}

const TOPE_ESPERA_RETRY_MS = 60_000;

/**
 * Extrae la espera sugerida por el servidor ante un 429/cuota, ej. Google
 * `details[].retryInfo.retryDelay: "44.18s"` o `"Please retry in 44s"`.
 * Devuelve milisegundos (tope 60s) o null si no hay sugerencia.
 */
export function extraerEsperaRetry(cuerpoError: string): number | null {
  const match =
    cuerpoError.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/) ??
    cuerpoError.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (!match) return null;
  const segundos = Number(match[1]);
  if (!Number.isFinite(segundos) || segundos <= 0) return null;
  return Math.min(Math.ceil(segundos * 1000), TOPE_ESPERA_RETRY_MS);
}

async function postJson(opts: {
  etiqueta: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
  reintentos: number;
  esperasMs: number[];
}): Promise<unknown> {
  let ultimoError: unknown;
  let ultimoCuerpoError = '';
  for (let intento = 0; intento <= opts.reintentos; intento += 1) {
    if (intento > 0) {
      const baseEspera = opts.esperasMs[intento - 1] ?? 10_000;
      const espera =
        extraerEsperaRetry(ultimoCuerpoError) ??
        baseEspera + Math.floor(Math.random() * 800);
      console.warn(
        `[IA][${opts.etiqueta}] Reintento ${intento}/${opts.reintentos} tras espera de ${espera}ms...`,
      );
      await new Promise((resolver) => setTimeout(resolver, espera));
    }

    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), TIMEOUT_MS);
    try {
      const respuesta = await fetch(opts.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...opts.headers },
        body: JSON.stringify(opts.body),
        signal: control.signal,
      });

      if (!respuesta.ok) {
        const cuerpoError = await respuesta.text().catch(() => '');
        ultimoCuerpoError = cuerpoError;
        console.error(
          `[IA][${opts.etiqueta} Error ${respuesta.status}] ${respuesta.statusText}:\n${cuerpoError.slice(0, 500)}`,
        );
        const error = new Error(
          `${opts.etiqueta} respondió ${respuesta.status} (${respuesta.statusText}): ${cuerpoError.slice(0, 300)}`,
        ) as ErrorConEstado;
        error.status = respuesta.status;
        throw error;
      }

      return (await respuesta.json()) as unknown;
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

class ProveedorGemini implements ProveedorIA {
  readonly id: IdProveedorIA = 'gemini';

  disponible(): boolean {
    return Boolean(env.GEMINI_API_KEY);
  }

  async completar(prompt: string): Promise<unknown> {
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no configurada');
    }
    const cuerpo = (await postJson({
      etiqueta: 'Gemini',
      url: `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      headers: {},
      body: {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0,
        },
      },
      reintentos: 2,
      esperasMs: [2_000, 5_000],
    })) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const texto = cuerpo.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof texto !== 'string' || texto.trim() === '') {
      throw new Error('Gemini devolvió una respuesta vacía');
    }
    return limpiarJson(texto);
  }
}

interface ConfigOpenAICompatible {
  id: 'groq' | 'openrouter' | 'openai';
  etiqueta: string;
  baseUrl: () => string;
  apiKey: () => string;
  modelo: () => string;
  reintentos?: number;
}

/**
 * Adapter genérico Chat Completions. Sirve para OpenAI y para cualquier
 * servicio compatible (Groq, OpenRouter, Ollama, LM Studio, etc.)
 * cambiando base URL, key y modelo.
 */
class ProveedorOpenAICompatible implements ProveedorIA {
  readonly id: ConfigOpenAICompatible['id'];
  private config: ConfigOpenAICompatible;

  constructor(config: ConfigOpenAICompatible) {
    this.id = config.id;
    this.config = config;
  }

  disponible(): boolean {
    return Boolean(this.config.apiKey());
  }

  async completar(prompt: string): Promise<unknown> {
    const key = this.config.apiKey();
    if (!key) {
      throw new Error(`${this.config.etiqueta}: API key no configurada`);
    }
    const base = this.config.baseUrl().replace(/\/+$/, '');
    const cuerpo = (await postJson({
      etiqueta: this.config.etiqueta,
      url: `${base}/chat/completions`,
      headers: { Authorization: `Bearer ${key}` },
      body: {
        model: this.config.modelo(),
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        response_format: { type: 'json_object' },
      },
      reintentos: this.config.reintentos ?? 1,
      esperasMs: [2_000],
    })) as {
      choices?: { message?: { content?: string | null } }[];
    };
    const texto = cuerpo.choices?.[0]?.message?.content;
    if (typeof texto !== 'string' || texto.trim() === '') {
      throw new Error(`${this.config.etiqueta} devolvió una respuesta vacía`);
    }
    return limpiarJson(texto);
  }
}

class ProveedorAnthropic implements ProveedorIA {
  readonly id: IdProveedorIA = 'anthropic';

  disponible(): boolean {
    return Boolean(env.ANTHROPIC_API_KEY);
  }

  async completar(prompt: string): Promise<unknown> {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY no configurada');
    }
    const cuerpo = (await postJson({
      etiqueta: 'Anthropic',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: {
        model: env.ANTHROPIC_MODEL,
        max_tokens: 4096,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      },
      reintentos: 1,
      esperasMs: [2_000],
    })) as {
      content?: { type?: string; text?: string }[];
    };
    const texto = (cuerpo.content ?? [])
      .filter((bloque) => bloque.type === 'text')
      .map((bloque) => bloque.text ?? '')
      .join('\n');
    if (texto.trim() === '') {
      throw new Error('Anthropic devolvió una respuesta vacía');
    }
    return limpiarJson(texto);
  }
}

const INSTANCIAS: Record<IdProveedorIA, ProveedorIA> = {
  gemini: new ProveedorGemini(),
  groq: new ProveedorOpenAICompatible({
    id: 'groq',
    etiqueta: 'Groq',
    baseUrl: () => env.GROQ_BASE_URL,
    apiKey: () => env.GROQ_API_KEY,
    modelo: () => env.GROQ_MODEL,
  }),
  openrouter: new ProveedorOpenAICompatible({
    id: 'openrouter',
    etiqueta: 'OpenRouter',
    baseUrl: () => env.OPENROUTER_BASE_URL,
    apiKey: () => env.OPENROUTER_API_KEY,
    modelo: () => env.OPENROUTER_MODEL,
  }),
  openai: new ProveedorOpenAICompatible({
    id: 'openai',
    etiqueta: 'OpenAI',
    baseUrl: () => env.OPENAI_BASE_URL,
    apiKey: () => env.OPENAI_API_KEY,
    modelo: () => env.OPENAI_MODEL,
  }),
  anthropic: new ProveedorAnthropic(),
};

/** Proveedores configurados (con API key) en el orden de `IA_PROVEEDORES`. */
export function ordenProveedores(): ProveedorIA[] {
  const ids = env.IA_PROVEEDORES.split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(
      (s): s is IdProveedorIA =>
        s === 'gemini' ||
        s === 'groq' ||
        s === 'openrouter' ||
        s === 'openai' ||
        s === 'anthropic',
    );
  const unicos = [...new Set(ids)];
  const orden: IdProveedorIA[] =
    unicos.length > 0
      ? unicos
      : ['gemini', 'groq', 'openrouter', 'openai', 'anthropic'];
  return orden
    .map((id) => INSTANCIAS[id])
    .filter((proveedor) => proveedor.disponible());
}

let ultimoProveedorUsado: IdProveedorIA | null = null;

/** Id del proveedor que respondió la última llamada exitosa (o null). */
export function obtenerUltimoProveedorIA(): IdProveedorIA | null {
  return ultimoProveedorUsado;
}

/**
 * Llama a los proveedores en orden hasta que uno responda.
 * Devuelve los datos parseados y el proveedor usado, o null si todos fallan.
 */
export async function llamarIAConFallback(
  prompt: string,
): Promise<{ datos: unknown; proveedor: IdProveedorIA } | null> {
  for (const proveedor of ordenProveedores()) {
    try {
      const datos = await proveedor.completar(prompt);
      ultimoProveedorUsado = proveedor.id;
      return { datos, proveedor: proveedor.id };
    } catch (error) {
      console.warn(
        `[IA] Proveedor ${proveedor.id} falló, probando el siguiente:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
  return null;
}
