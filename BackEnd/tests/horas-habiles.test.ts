import { describe, expect, it } from 'vitest';
import {
  ajustarAInicioHabil,
  calcularHorasHabilesTranscurridas,
  esDiaHabil,
  hanPasadoHorasHabiles,
  sumarHorasHabiles,
} from '../src/utils/horas-habiles';

describe('horas-habiles', () => {
  it('identifica correctamente días hábiles y fines de semana', () => {
    // 2026-09-14 es Lunes
    expect(esDiaHabil(new Date('2026-09-14T10:00:00'))).toBe(true);
    // 2026-09-18 es Viernes
    expect(esDiaHabil(new Date('2026-09-18T10:00:00'))).toBe(true);
    // 2026-09-19 es Sábado
    expect(esDiaHabil(new Date('2026-09-19T10:00:00'))).toBe(false);
    // 2026-09-20 es Domingo
    expect(esDiaHabil(new Date('2026-09-20T10:00:00'))).toBe(false);
  });

  it('ajusta fines de semana al inicio del lunes', () => {
    // Sábado 14:00 -> Lunes 00:00
    const sabado = new Date('2026-09-19T14:00:00');
    const lunes = ajustarAInicioHabil(sabado);
    expect(lunes.getDay()).toBe(1); // Lunes
    expect(lunes.getHours()).toBe(0);
    expect(lunes.getMinutes()).toBe(0);
  });

  it('suma 48 horas hábiles de Lunes 10:00 a Miércoles 10:00', () => {
    const lunes10 = new Date('2026-09-14T10:00:00');
    const resultado = sumarHorasHabiles(lunes10, 48);

    expect(resultado.getDay()).toBe(3); // Miércoles
    expect(resultado.getHours()).toBe(10);
    expect(resultado.getMinutes()).toBe(0);
  });

  it('suma 48 horas hábiles de Viernes 10:00 a Martes 10:00 (salta fin de semana)', () => {
    const viernes10 = new Date('2026-09-18T10:00:00');
    const resultado = sumarHorasHabiles(viernes10, 48);

    expect(resultado.getDay()).toBe(2); // Martes
    expect(resultado.getHours()).toBe(10);
    expect(resultado.getMinutes()).toBe(0);
  });

  it('suma 48 horas hábiles desde el Jueves 16:00 a Lunes 16:00', () => {
    const jueves16 = new Date('2026-09-17T16:00:00');
    const resultado = sumarHorasHabiles(jueves16, 48);

    expect(resultado.getDay()).toBe(1); // Lunes
    expect(resultado.getHours()).toBe(16);
    expect(resultado.getMinutes()).toBe(0);
  });

  it('calcula horas hábiles transcurridas correctamente', () => {
    const lunes10 = new Date('2026-09-14T10:00:00');
    const martes10 = new Date('2026-09-15T10:00:00');
    expect(calcularHorasHabilesTranscurridas(lunes10, martes10)).toBe(24);

    const miercoles10 = new Date('2026-09-16T10:00:00');
    expect(calcularHorasHabilesTranscurridas(lunes10, miercoles10)).toBe(48);

    // De Viernes 10:00 a Lunes 10:00 deben ser exactamente 24 horas hábiles (Viernes 14h + Lunes 10h)
    const viernes10 = new Date('2026-09-18T10:00:00');
    const lunesSiguiente10 = new Date('2026-09-21T10:00:00');
    expect(calcularHorasHabilesTranscurridas(viernes10, lunesSiguiente10)).toBe(24);

    // De Viernes 10:00 a Martes 10:00 deben ser exactamente 48 horas hábiles
    const martesSiguiente10 = new Date('2026-09-22T10:00:00');
    expect(calcularHorasHabilesTranscurridas(viernes10, martesSiguiente10)).toBe(48);
  });

  it('hanPasadoHorasHabiles devuelve true solo después de transcurrido el tiempo hábil', () => {
    const viernes10 = new Date('2026-09-18T10:00:00');

    // Lunes 10:00 (24h hábiles) -> false para 48h
    expect(
      hanPasadoHorasHabiles(viernes10, 48, new Date('2026-09-21T10:00:00')),
    ).toBe(false);

    // Martes 09:59 -> false
    expect(
      hanPasadoHorasHabiles(viernes10, 48, new Date('2026-09-22T09:59:00')),
    ).toBe(false);

    // Martes 10:00 -> true
    expect(
      hanPasadoHorasHabiles(viernes10, 48, new Date('2026-09-22T10:00:00')),
    ).toBe(true);

    // Martes 14:00 -> true
    expect(
      hanPasadoHorasHabiles(viernes10, 48, new Date('2026-09-22T14:00:00')),
    ).toBe(true);
  });
});
