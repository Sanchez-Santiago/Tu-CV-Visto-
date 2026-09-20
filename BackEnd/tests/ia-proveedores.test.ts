import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '../src/config/env';
import {
  clasificarLote,
  detectarPostulacionesLote,
  iaEstaConfigurada,
  type EmailParaAnalisis,
} from '../src/services/ia.service';
import {
  extraerEsperaRetry,
  obtenerUltimoProveedorIA,
  ordenProveedores,
} from '../src/services/ia-proveedores';

const CLAVES = [
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'IA_PROVEEDORES',
] as const;

let originales: Record<string, string> = {};

function configurarEnv(valores: Partial<Record<string, string>>): void {
  for (const clave of CLAVES) {
    (env as unknown as Record<string, string>)[clave] =
      valores[clave] ?? '';
  }
  if (valores.IA_PROVEEDORES === undefined) {
    (env as unknown as Record<string, string>)['IA_PROVEEDORES'] =
      'gemini,groq,openrouter,openai,anthropic';
  }
}

function emailPrueba(): EmailParaAnalisis {
  return {
    id: '1',
    asunto: 'Entrevista',
    remitente: 'rrhh@empresa.com',
    contenido: 'Te invitamos a una entrevista el lunes.',
  };
}

function respuestaGeminiOk(tipo = 'entrevista'): Response {
  return new Response(
    JSON.stringify({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify([
                  { index: 0, tipo, confianza: 90, motivo: 'prueba' },
                ]),
              },
            ],
          },
        },
      ],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function respuestaOpenAIOk(tipo = 'entrevista'): Response {
  return new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify([
              { index: 0, tipo, confianza: 91, motivo: 'prueba' },
            ]),
          },
        },
      ],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function respuestaAnthropicOk(tipo = 'entrevista'): Response {
  return new Response(
    JSON.stringify({
      content: [
        {
          type: 'text',
          text: JSON.stringify([
            { index: 0, tipo, confianza: 92, motivo: 'prueba' },
          ]),
        },
      ],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function respuestaError(status: number): Response {
  return new Response(JSON.stringify({ error: 'falla' }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockFetch(
  manejador: (url: string) => Response | null,
): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string | URL) => {
      const ruta = String(url);
      return manejador(ruta) ?? respuestaError(404);
    }),
  );
}

beforeEach(() => {
  originales = {};
  for (const clave of CLAVES) {
    originales[clave] =
      (env as unknown as Record<string, string>)[clave] ?? '';
  }
});

afterEach(() => {
  for (const clave of CLAVES) {
    (env as unknown as Record<string, string>)[clave] =
      originales[clave] ?? '';
  }
  vi.unstubAllGlobals();
});

describe('proveedores de IA con fallback', () => {
  it('usa gemini cuando es el único configurado', async () => {
    configurarEnv({ GEMINI_API_KEY: 'clave-gemini' });
    mockFetch((url) =>
      url.includes('generativelanguage.googleapis.com')
        ? respuestaGeminiOk()
        : null,
    );

    expect(ordenProveedores().map((p) => p.id)).toEqual(['gemini']);
    const resultado = await clasificarLote([emailPrueba()]);
    expect(resultado[0]?.tipo).toBe('entrevista');
    expect(obtenerUltimoProveedorIA()).toBe('gemini');
  });

  it('hace fallback a openai si gemini falla', async () => {
    configurarEnv({ GEMINI_API_KEY: 'clave-gemini', OPENAI_API_KEY: 'clave-openai' });
    const llamadas: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const ruta = String(url);
        llamadas.push(ruta);
        if (ruta.includes('generativelanguage.googleapis.com')) {
          return respuestaError(401);
        }
        if (ruta.includes('/chat/completions')) {
          return respuestaOpenAIOk();
        }
        return respuestaError(404);
      }),
    );

    const resultado = await clasificarLote([emailPrueba()]);
    expect(resultado[0]?.tipo).toBe('entrevista');
    expect(obtenerUltimoProveedorIA()).toBe('openai');
    expect(llamadas.some((u) => u.includes('/chat/completions'))).toBe(true);
  });

  it('hace fallback a anthropic si gemini y openai fallan', async () => {
    configurarEnv({
      GEMINI_API_KEY: 'clave-gemini',
      OPENAI_API_KEY: 'clave-openai',
      ANTHROPIC_API_KEY: 'clave-anthropic',
    });
    mockFetch((url) => {
      if (url.includes('generativelanguage.googleapis.com')) {
        return respuestaError(401);
      }
      if (url.includes('/chat/completions')) {
        return respuestaError(401);
      }
      if (url.includes('api.anthropic.com')) {
        return respuestaAnthropicOk('oferta');
      }
      return null;
    });

    const resultado = await clasificarLote([emailPrueba()]);
    expect(resultado[0]?.tipo).toBe('oferta');
    expect(obtenerUltimoProveedorIA()).toBe('anthropic');
  });

  it('respeta el orden de IA_PROVEEDORES', async () => {
    configurarEnv({
      GEMINI_API_KEY: 'clave-gemini',
      OPENAI_API_KEY: 'clave-openai',
      IA_PROVEEDORES: 'openai,gemini',
    });
    const llamadas: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const ruta = String(url);
        llamadas.push(ruta);
        if (ruta.includes('/chat/completions')) {
          return respuestaOpenAIOk();
        }
        return respuestaGeminiOk();
      }),
    );

    const resultado = await clasificarLote([emailPrueba()]);
    expect(resultado[0]?.tipo).toBe('entrevista');
    expect(obtenerUltimoProveedorIA()).toBe('openai');
    expect(
      llamadas.some((u) => u.includes('generativelanguage.googleapis.com')),
    ).toBe(false);
  });

  it('detectarPostulacionesLote también usa el fallback', async () => {
    configurarEnv({ GEMINI_API_KEY: 'clave-gemini', OPENAI_API_KEY: 'clave-openai' });
    mockFetch((url) => {
      if (url.includes('generativelanguage.googleapis.com')) {
        return respuestaError(401);
      }
      if (url.includes('/chat/completions')) {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify([
                    {
                      index: 0,
                      es_postulacion: true,
                      puesto: 'Backend Dev',
                      confianza: 95,
                      motivo: 'prueba',
                    },
                  ]),
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return null;
    });

    const resultado = await detectarPostulacionesLote([emailPrueba()]);
    expect(resultado[0]?.es_postulacion).toBe(true);
    expect(resultado[0]?.puesto).toBe('Backend Dev');
    expect(obtenerUltimoProveedorIA()).toBe('openai');
  });

  it('sin keys no hay IA configurada y devuelve nulos', async () => {
    configurarEnv({});
    const llamadas: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        llamadas.push(String(url));
        return respuestaError(500);
      }),
    );

    expect(iaEstaConfigurada()).toBe(false);
    expect(ordenProveedores()).toEqual([]);
    expect(await clasificarLote([emailPrueba()])).toEqual([null]);
    expect(await detectarPostulacionesLote([emailPrueba()])).toEqual([null]);
    expect(llamadas).toEqual([]);
  });

  it('si todos los proveedores fallan devuelve nulos', async () => {
    configurarEnv({ GEMINI_API_KEY: 'clave-gemini', OPENAI_API_KEY: 'clave-openai' });
    mockFetch(() => respuestaError(401));

    const resultado = await clasificarLote([emailPrueba()]);
    expect(resultado).toEqual([null]);
  });

  it('usa groq como secundaria gratuita si gemini falla', async () => {
    configurarEnv({ GEMINI_API_KEY: 'clave-gemini', GROQ_API_KEY: 'clave-groq' });
    let modeloPedido: string | null = null;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL, init?: { body?: unknown }) => {
        const ruta = String(url);
        if (ruta.includes('generativelanguage.googleapis.com')) {
          return respuestaError(401);
        }
        if (ruta.includes('api.groq.com')) {
          const cuerpo = JSON.parse(String(init?.body ?? '{}')) as {
            model?: string;
          };
          modeloPedido = cuerpo.model ?? null;
          return respuestaOpenAIOk('novedad');
        }
        return respuestaError(404);
      }),
    );

    const resultado = await clasificarLote([emailPrueba()]);
    expect(resultado[0]?.tipo).toBe('novedad');
    expect(obtenerUltimoProveedorIA()).toBe('groq');
    expect(modeloPedido).toBe('openai/gpt-oss-20b');
  });

  it('groq con rate limit (429) pasa a openrouter en la cadena de 5', async () => {
    configurarEnv({
      GEMINI_API_KEY: 'clave-gemini',
      GROQ_API_KEY: 'clave-groq',
      OPENROUTER_API_KEY: 'clave-openrouter',
    });
    const llamadas: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const ruta = String(url);
        llamadas.push(ruta);
        if (ruta.includes('generativelanguage.googleapis.com')) {
          return respuestaError(401);
        }
        if (ruta.includes('api.groq.com')) {
          return respuestaError(429);
        }
        if (ruta.includes('openrouter.ai')) {
          return respuestaOpenAIOk('contacto');
        }
        return respuestaError(404);
      }),
    );

    const resultado = await clasificarLote([emailPrueba()]);
    expect(resultado[0]?.tipo).toBe('contacto');
    expect(obtenerUltimoProveedorIA()).toBe('openrouter');
    expect(llamadas.some((u) => u.includes('api.groq.com'))).toBe(true);
    expect(llamadas.some((u) => u.includes('openrouter.ai'))).toBe(true);
  }, 30000);

  it('la cadena por defecto incluye los 5 proveedores en orden', async () => {
    configurarEnv({
      GEMINI_API_KEY: 'k1',
      GROQ_API_KEY: 'k2',
      OPENROUTER_API_KEY: 'k3',
      OPENAI_API_KEY: 'k4',
      ANTHROPIC_API_KEY: 'k5',
    });
    expect(ordenProveedores().map((p) => p.id)).toEqual([
      'gemini',
      'groq',
      'openrouter',
      'openai',
      'anthropic',
    ]);
  });

  it('gemini con 429 persistente intenta 3 veces y pasa al siguiente', async () => {
    configurarEnv({
      GEMINI_API_KEY: 'clave-gemini',
      OPENAI_API_KEY: 'clave-openai',
    });
    let llamadasGemini = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const ruta = String(url);
        if (ruta.includes('generativelanguage.googleapis.com')) {
          llamadasGemini += 1;
          return new Response(
            JSON.stringify({
              error: {
                code: 429,
                message: 'Cuota excedida. Please retry in 0.05s.',
                details: [
                  {
                    '@type':
                      'type.googleapis.com/google.rpc.RetryInfo',
                    retryDelay: '0.05s',
                  },
                ],
              },
            }),
            { status: 429, headers: { 'Content-Type': 'application/json' } },
          );
        }
        if (ruta.includes('/chat/completions')) {
          return respuestaOpenAIOk();
        }
        return respuestaError(404);
      }),
    );

    const resultado = await clasificarLote([emailPrueba()]);
    expect(llamadasGemini).toBe(3);
    expect(resultado[0]?.tipo).toBe('entrevista');
    expect(obtenerUltimoProveedorIA()).toBe('openai');
  }, 30000);
});

describe('extraerEsperaRetry', () => {
  it('parsea el retryDelay de Google', () => {
    expect(
      extraerEsperaRetry(
        '{"error":{"details":[{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"44.18s"}]}}',
      ),
    ).toBe(44180);
  });

  it('aplica el tope de 60 segundos', () => {
    expect(extraerEsperaRetry('"retryDelay": "120s"')).toBe(60000);
  });

  it('parsea el "retry in Ns" del mensaje', () => {
    expect(extraerEsperaRetry('Please retry in 23.8s.')).toBe(23800);
  });

  it('devuelve null sin sugerencia o con valor inválido', () => {
    expect(extraerEsperaRetry('{"error":"falla"}')).toBeNull();
    expect(extraerEsperaRetry('"retryDelay": "0s"')).toBeNull();
    expect(extraerEsperaRetry('')).toBeNull();
  });
});
