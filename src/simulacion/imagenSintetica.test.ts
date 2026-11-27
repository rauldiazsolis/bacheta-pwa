import { describe, expect, it } from 'vitest';
import { imagenCalleSintetica } from './imagenSintetica';

describe('imagenCalleSintetica', () => {
  it('tiene el tamaño pedido y es opaca', () => {
    const img = imagenCalleSintetica(28, 14);
    expect(img.datos).toHaveLength(28 * 14 * 4);
    expect(img.datos.filter((_, i) => i % 4 === 3).every((a) => a === 255)).toBe(true);
  });

  it('es determinista con la misma semilla y cambia con otra', () => {
    expect(imagenCalleSintetica(28, 28, 7).datos).toEqual(imagenCalleSintetica(28, 28, 7).datos);
    expect(imagenCalleSintetica(28, 28, 7).datos).not.toEqual(imagenCalleSintetica(28, 28, 8).datos);
  });

  it('el cielo es más claro que el asfalto', () => {
    const img = imagenCalleSintetica(14, 100);
    const brillo = (y: number) => img.datos[(y * 14 + 1) * 4] as number;
    expect(brillo(5)).toBeGreaterThan(brillo(90));
  });
});
