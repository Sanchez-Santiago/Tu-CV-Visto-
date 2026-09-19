/**
 * Utilidades para cálculo de tiempo hábil (días y horas laborables).
 * Por especificación, las horas hábiles transcurren durante los días de semana (Lunes a Viernes).
 * Los fines de semana (Sábado y Domingo) no computan horas hábiles.
 *
 * Ejemplos:
 * - Lunes 10:00 + 48h hábiles = Miércoles 10:00
 * - Viernes 10:00 + 48h hábiles = Martes 10:00
 * - Jueves 16:00 + 48h hábiles = Lunes 16:00
 */

const MS_POR_HORA = 60 * 60 * 1000;

function aFecha(valor: Date | string | number): Date {
  if (valor instanceof Date) return new Date(valor.getTime());
  const parseado = new Date(valor);
  if (isNaN(parseado.getTime())) {
    throw new Error(`Fecha inválida: ${String(valor)}`);
  }
  return parseado;
}

/**
 * Devuelve true si la fecha cae en día hábil (Lunes a Viernes).
 */
export function esDiaHabil(fecha: Date | string | number): boolean {
  const d = aFecha(fecha);
  const diaSemana = d.getDay(); // 0 = Domingo, 6 = Sábado
  return diaSemana !== 0 && diaSemana !== 6;
}

/**
 * Si la fecha cae en fin de semana, avanza hasta el próximo Lunes a las 00:00:00.
 */
export function ajustarAInicioHabil(fecha: Date): Date {
  const d = new Date(fecha.getTime());
  const diaSemana = d.getDay();
  if (diaSemana === 6) {
    // Sábado -> avanzar al lunes 00:00
    d.setDate(d.getDate() + 2);
    d.setHours(0, 0, 0, 0);
  } else if (diaSemana === 0) {
    // Domingo -> avanzar al lunes 00:00
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

/**
 * Suma una cantidad de horas hábiles a una fecha dada, saltando fines de semana.
 * Cada día hábil aporta hasta 24 horas continuas de lunes a viernes.
 */
export function sumarHorasHabiles(
  fechaInicio: Date | string | number,
  horasHabiles: number,
): Date {
  if (horasHabiles < 0) {
    throw new Error('horasHabiles debe ser mayor o igual a 0');
  }
  if (horasHabiles === 0) {
    return aFecha(fechaInicio);
  }

  let cursor = ajustarAInicioHabil(aFecha(fechaInicio));
  let horasRestantes = horasHabiles;

  while (horasRestantes > 0) {
    const diaSemana = cursor.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      cursor = ajustarAInicioHabil(cursor);
      continue;
    }

    // Calcular cuánto tiempo queda en el día hábil actual hasta las 24:00 (00:00 del día siguiente)
    const finDelDia = new Date(cursor.getTime());
    finDelDia.setHours(24, 0, 0, 0);

    const horasHastaFinDelDia =
      (finDelDia.getTime() - cursor.getTime()) / MS_POR_HORA;

    if (horasRestantes <= horasHastaFinDelDia) {
      cursor = new Date(cursor.getTime() + horasRestantes * MS_POR_HORA);
      horasRestantes = 0;
    } else {
      horasRestantes -= horasHastaFinDelDia;
      cursor = finDelDia; // Esto cae a las 00:00 del día siguiente
      if (!esDiaHabil(cursor)) {
        cursor = ajustarAInicioHabil(cursor);
      }
    }
  }

  return cursor;
}

/**
 * Calcula la cantidad exacta de horas hábiles transcurridas entre fechaInicio y fechaFin.
 * Si fechaFin < fechaInicio, retorna 0.
 */
export function calcularHorasHabilesTranscurridas(
  fechaInicio: Date | string | number,
  fechaFin: Date | string | number = new Date(),
): number {
  const inicio = aFecha(fechaInicio);
  const fin = aFecha(fechaFin);

  if (fin.getTime() <= inicio.getTime()) {
    return 0;
  }

  let cursor = aFecha(inicio);
  const finCursor = aFecha(fin);

  let msHabiles = 0;

  while (cursor.getTime() < finCursor.getTime()) {
    if (!esDiaHabil(cursor)) {
      const siguienteLunes = ajustarAInicioHabil(cursor);
      if (siguienteLunes.getTime() >= finCursor.getTime()) {
        break;
      }
      cursor = siguienteLunes;
    }

    const finDelDia = new Date(cursor.getTime());
    finDelDia.setHours(24, 0, 0, 0);

    const limite = finCursor.getTime() < finDelDia.getTime()
      ? finCursor.getTime()
      : finDelDia.getTime();

    if (esDiaHabil(cursor)) {
      msHabiles += Math.max(0, limite - cursor.getTime());
    }

    cursor = new Date(limite);
  }

  return msHabiles / MS_POR_HORA;
}

/**
 * Comprueba si ya han transcurrido al menos `horasRequeridas` horas hábiles
 * desde `fechaInicio` hasta `ahora`.
 */
export function hanPasadoHorasHabiles(
  fechaInicio: Date | string | number,
  horasRequeridas = 48,
  ahora: Date | string | number = new Date(),
): boolean {
  const transcurridas = calcularHorasHabilesTranscurridas(fechaInicio, ahora);
  return transcurridas >= horasRequeridas;
}
