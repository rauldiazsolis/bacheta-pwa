import { describe, expect, it } from 'vitest';
import { EstimadorSimulado } from './estimadorSimulado';

const imagen = { ancho: 14, alto: 14, datos: new Uint8ClampedArray(14 * 14 * 4) };

describe('EstimadorSimulado', () => {
  it('informa progreso hasta el total y devuelve un suelo plano', async () => {
    const estimador = new EstimadorSimulado({ msPorCuadro252: 0, bytesModelo: 100 });
    const progreso: number[] = [];
    await estimador.cargar({ backend: 'wasm', precision: 'q8' }, (p) => progreso.push(p.bytesCargados));
    expect(progreso.at(-1)).toBe(100);
    const mapa = await estimador.estimar(imagen);
    expect(mapa.valores[0]).toBe(0);
    expect(mapa.valores[14 * 13]).toBeGreaterThan(mapa.valores[14] as number);
  });

  it('simula un teléfono sin WebGPU y exige cargar antes de estimar', async () => {
    const estimador = new EstimadorSimulado({ sinWebGPU: true });
    await expect(
      estimador.cargar({ backend: 'webgpu', precision: 'fp16' }, () => undefined),
    ).rejects.toThrow();
    await expect(estimador.estimar(imagen)).rejects.toThrow('no está cargado');
  });
});
