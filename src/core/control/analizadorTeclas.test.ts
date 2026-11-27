import { describe, expect, it } from 'vitest';
import type { EventoTecla } from '../puertos/teclas';
import { analizarTeclas } from './analizadorTeclas';

const pulsar = (t: number, key: string, code = key, repeticion = false): EventoTecla => ({
  t,
  tipo: 'pulsar',
  key,
  code,
  repeticion,
});
const soltar = (t: number, key: string, code = key): EventoTecla => ({
  t,
  tipo: 'soltar',
  key,
  code,
  repeticion: false,
});

describe('analizarTeclas', () => {
  it('agrupa por tecla en orden de aparición y mide la duración', () => {
    const r = analizarTeclas([
      pulsar(0, 'Enter'),
      soltar(100, 'Enter'),
      pulsar(500, 'AudioVolumeUp'),
      soltar(580, 'AudioVolumeUp'),
      pulsar(1000, 'Enter'),
      soltar(1200, 'Enter'),
    ]);
    expect(r.map((t) => t.key)).toEqual(['Enter', 'AudioVolumeUp']);
    expect(r[0]).toMatchObject({ pulsaciones: 2, repeticiones: 0, sinSoltar: 0, duracionMedianaMs: 150 });
    expect(r[1]).toMatchObject({ pulsaciones: 1, duracionMedianaMs: 80 });
  });

  it('no cuenta las repeticiones automáticas como pulsaciones', () => {
    const r = analizarTeclas([
      pulsar(0, 'Enter'),
      pulsar(500, 'Enter', 'Enter', true),
      pulsar(530, 'Enter', 'Enter', true),
      soltar(900, 'Enter'),
    ]);
    expect(r[0]).toMatchObject({ pulsaciones: 1, repeticiones: 2, duracionMedianaMs: 900 });
  });

  it('detecta controles que no envían "soltar"', () => {
    const r = analizarTeclas([pulsar(0, 'PageDown'), pulsar(300, 'PageDown')]);
    expect(r[0]).toMatchObject({ pulsaciones: 2, sinSoltar: 2, duracionMedianaMs: null });
  });

  it('distingue la misma key con distinto code', () => {
    const r = analizarTeclas([pulsar(0, 'Enter', 'Enter'), pulsar(10, 'Enter', 'NumpadEnter')]);
    expect(r).toHaveLength(2);
  });

  it('ignora un "soltar" huérfano y no falla con la lista vacía', () => {
    expect(analizarTeclas([soltar(0, 'Enter')])[0]).toMatchObject({ pulsaciones: 0, sinSoltar: 0 });
    expect(analizarTeclas([])).toEqual([]);
  });
});
