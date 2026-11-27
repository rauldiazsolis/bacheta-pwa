import { describe, expect, it } from 'vitest';
import { estimarFrecuencia, percentil, redondear, resumir } from './resumen';

describe('percentil', () => {
  it('interpola linealmente entre rangos', () => {
    const v = [10, 20, 30, 40];
    expect(percentil(v, 0)).toBe(10);
    expect(percentil(v, 50)).toBe(25);
    expect(percentil(v, 100)).toBe(40);
    expect(percentil(v, 95)).toBeCloseTo(38.5);
  });

  it('rechaza listas vacías y percentiles inválidos', () => {
    expect(() => percentil([], 50)).toThrow(RangeError);
    expect(() => percentil([1], 101)).toThrow(RangeError);
  });
});

describe('resumir', () => {
  it('calcula las estadísticas básicas sin importar el orden', () => {
    const r = resumir([5, 1, 3, 2, 4]);
    expect(r).toMatchObject({ n: 5, minimo: 1, maximo: 5, media: 3, mediana: 3 });
    expect(r?.desvio).toBeCloseTo(Math.SQRT2);
  });

  it('ignora valores no finitos y devuelve null si no queda nada', () => {
    expect(resumir([1, Number.NaN, Infinity, 3])?.n).toBe(2);
    expect(resumir([Number.NaN])).toBeNull();
    expect(resumir([])).toBeNull();
  });
});

describe('estimarFrecuencia', () => {
  it('estima 60 Hz con intervalos de ~16,7 ms', () => {
    const marcas = Array.from({ length: 61 }, (_, i) => i * (1000 / 60));
    expect(estimarFrecuencia(marcas)?.hz).toBeCloseTo(60, 5);
  });

  it('es robusta a una pausa larga aislada (usa la mediana)', () => {
    const marcas = [0, 1000, 2000, 3000, 10000, 11000, 12000];
    expect(estimarFrecuencia(marcas)?.hz).toBeCloseTo(1, 5);
  });

  it('descarta intervalos nulos o negativos y necesita al menos dos marcas', () => {
    expect(estimarFrecuencia([0, 0, 100, 200])?.hz).toBeCloseTo(10);
    expect(estimarFrecuencia([5])).toBeNull();
  });
});

describe('redondear', () => {
  it('redondea a la cantidad de decimales pedida', () => {
    expect(redondear(3.14159)).toBe(3.1);
    expect(redondear(3.14159, 3)).toBe(3.142);
  });
});
