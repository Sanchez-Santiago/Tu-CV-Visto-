import { env } from '../config/env';

type Nivel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const PESO: Record<Nivel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 99,
};

const ACTIVO = PESO[env.LOG_LEVEL];

function timestamp(): string {
  return new Date().toISOString();
}

function escribir(nivel: Nivel, argumentos: unknown[]): void {
  if (PESO[nivel] < ACTIVO) return;
  const mensaje = argumentos
    .map((a) =>
      a instanceof Error ? a.stack ?? a.message : typeof a === 'string' ? a : JSON.stringify(a),
    )
    .join(' ');
  const linea = `[${timestamp()}] [${nivel.toUpperCase()}] ${mensaje}`;
  if (nivel === 'error' || nivel === 'warn') {
    console.error(linea);
  } else {
    console.log(linea);
  }
}

export const logger = {
  debug: (...args: unknown[]): void => escribir('debug', args),
  info: (...args: unknown[]): void => escribir('info', args),
  warn: (...args: unknown[]): void => escribir('warn', args),
  error: (...args: unknown[]): void => escribir('error', args),
};