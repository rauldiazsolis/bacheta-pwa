import { describe, expect, it } from 'vitest';
import { aTensorNormalizado } from './preprocesamiento';
import { DESVIO_RGB, MEDIA_RGB, esTamanioValido } from './modelo';

function imagenUniforme(lado: number, rgba: [number, number, number, number]) {
  const datos = new Uint8ClampedArray(lado * lado * 4);
  for (let i = 0; i < datos.length; i += 4) datos.set(rgba, i);
  return { ancho: lado, alto: lado, datos };
}

describe('aTensorNormalizado', () => {
  it('separa los canales (C×H×W) y normaliza con ImageNet', () => {
    const tensor = aTensorNormalizado(imagenUniforme(14, [255, 0, 128, 77]));
    const plano = 14 * 14;
    expect(tensor).toHaveLength(3 * plano);
    expect(tensor[0]).toBeCloseTo((1 - MEDIA_RGB[0]) / DESVIO_RGB[0], 5);
    expect(tensor[plano]).toBeCloseTo((0 - MEDIA_RGB[1]) / DESVIO_RGB[1], 5);
    expect(tensor[2 * plano + plano - 1]).toBeCloseTo((128 / 255 - MEDIA_RGB[2]) / DESVIO_RGB[2], 5);
  });

  it('respeta la posición de cada píxel', () => {
    const img = imagenUniforme(14, [0, 0, 0, 255]);
    img.datos[(14 * 2 + 3) * 4] = 255; // fila 2, columna 3, canal R
    const tensor = aTensorNormalizado(img);
    expect(tensor[14 * 2 + 3]).toBeCloseTo((1 - MEDIA_RGB[0]) / DESVIO_RGB[0], 5);
    expect(tensor[14 * 2 + 4]).toBeCloseTo((0 - MEDIA_RGB[0]) / DESVIO_RGB[0], 5);
  });

  it('rechaza tamaños que no son múltiplo de 14 o datos inconsistentes', () => {
    expect(() => aTensorNormalizado(imagenUniforme(16, [0, 0, 0, 0]))).toThrow(RangeError);
    expect(() => aTensorNormalizado({ ancho: 14, alto: 14, datos: new Uint8ClampedArray(10) })).toThrow(
      RangeError,
    );
  });
});

describe('esTamanioValido', () => {
  it('acepta solo múltiplos positivos de 14', () => {
    expect([252, 392, 518].every(esTamanioValido)).toBe(true);
    expect([0, 256, 14.5, -14].some(esTamanioValido)).toBe(false);
  });
});
