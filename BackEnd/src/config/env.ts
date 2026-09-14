import { z } from 'zod';

const NOMBRES_NIVEL = ['debug', 'info', 'warn', 'error', 'silent'] as const;
export type NivelLog = (typeof NOMBRES_NIVEL)[number];

const nivelLogPredeterminado: NivelLog =
  process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

const envSchema = z.object({
  TOKEN_TURSO: z.string().default(''),
  URL_TURSO: z
    .string()
    .min(1, 'URL_TURSO es obligatoria')
    .refine(
      (url) =>
        url.startsWith('file:') ||
        /^(https?|libsql|wss?):\/\/.+/.test(url),
      'URL_TURSO debe ser una URL remota (http/https/libsql/ws) o local (file:...)',
    ),
  PORT: z.coerce.number().int().positive().default(3000),

  CADENCIA_CONTACTO_DIAS: z.coerce
    .number()
    .int()
    .positive('CADENCIA_CONTACTO_DIAS debe ser mayor a 0')
    .default(30),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  LOG_LEVEL: z.enum(NOMBRES_NIVEL).default(nivelLogPredeterminado),
  PANTALLA_BETA: z.enum(['true', 'false']).default('true'),

  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_CALLBACK_URL: z.string().url().default(''),
  FRONTEND_URL: z.string().url().default(''),
  JWT_SECRET: z.string().default(''),
});

// La pantalla beta (HTML del backend) solo aplica cuando no hay un SPA
// configurado (FRONTEND_URL vacío). Con un SPA real el login siempre
// redirige a FRONTEND_URL/auth/callback#token=... para no romper el flujo.
export function esPantallaBetaActiva(): boolean {
  return (
    env.PANTALLA_BETA === 'true' &&
    env.FRONTEND_URL === ''
  );
}

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Configuración de entorno inválida:\n${issues}`);
  }

  return parsed.data;
}

export const env = loadEnv();