import { describe, expect, it } from 'vitest';
import { duracion, fps, megabytes, ms, num } from './formato';

describe('formato', () => {
  it('usa coma decimal y raya para valores ausentes', () => {
    expect(num(1234.56)).toBe('1.234,6');
    expect(num(null)).toBe('—');
    expect(num(Number.NaN)).toBe('—');
    expect(num(2, 0, 'Hz')).toBe('2 Hz');
  });

  it('formatea milisegundos, megabytes, fps y duraciones', () => {
    expect(ms(250.4)).toBe('250 ms');
    expect(megabytes(49_500_000)).toBe('49,5 MB');
    expect(megabytes(null)).toBe('—');
    expect(fps(250)).toBe('4,0 fps');
    expect(fps(0)).toBe('—');
    expect(duracion(65_400)).toBe('1:05');
    expect(duracion(-5)).toBe('0:00');
  });
});
