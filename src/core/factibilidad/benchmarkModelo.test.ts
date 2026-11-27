import { describe, expect, it } from 'vitest';
import type { Reloj } from '../puertos/reloj';
import type { ConfigEstimador, EstimadorProfundidad, ProgresoCarga } from '../puertos/profundidad';
import { configuracionesPosibles, medirModelo } from './benchmarkModelo';

/** Reloj manual: el estimador falso lo adelanta para simular tiempos de inferencia. */
function crearReloj(): Reloj & { avanzar(ms: number): void } {
  let t = 0;
  return { ahoraMs: () => t, fechaHoraMs: () => 1_700_000_000_000 + t, avanzar: (ms) => (t += ms) };
}

function crearEstimador(
  reloj: ReturnType<typeof crearReloj>,
  { msPorPixel = 0.001, fallaCarga = false, fallaEn = -1 } = {},
): EstimadorProfundidad & { liberaciones: number } {
  let llamadas = 0;
  return {
    liberaciones: 0,
    async cargar(_config: ConfigEstimador, alProgresar: (p: ProgresoCarga) => void) {
      if (fallaCarga) throw new Error('sin WebGPU');
      reloj.avanzar(1000);
      alProgresar({ bytesCargados: 25e6, bytesTotales: 50e6 });
      reloj.avanzar(1000);
      alProgresar({ bytesCargados: 50e6, bytesTotales: 50e6 });
      reloj.avanzar(500); // inicialización
    },
    async estimar(imagen) {
      if (llamadas++ === fallaEn) throw new Error('memoria agotada');
      // El primer cuadro (calentamiento) es más lento.
      reloj.avanzar(imagen.ancho * imagen.alto * msPorPixel * (llamadas === 1 ? 10 : 1));
      return {
        ancho: imagen.ancho,
        alto: imagen.alto,
        valores: new Float32Array(imagen.ancho * imagen.alto),
      };
    },
    async liberar() {
      this.liberaciones++;
    },
  };
}

const imagen = (lado: number) => ({ ancho: lado, alto: lado, datos: new Uint8ClampedArray(lado * lado * 4) });

describe('medirModelo', () => {
  it('mide carga, descarga y tiempos por tamaño, separando el primer cuadro', async () => {
    const reloj = crearReloj();
    const estimador = crearEstimador(reloj);
    const [r] = await medirModelo({
      estimador,
      reloj,
      obtenerImagen: imagen,
      configuraciones: [{ backend: 'wasm', precision: 'q8' }],
      tamanios: [14, 28],
      cuadros: 3,
    });
    expect(r?.error).toBeNull();
    expect(r?.cargaMs).toBe(2500);
    expect(r?.descarga).toMatchObject({ bytes: 50e6, duracionMs: 2500 });
    expect(r?.porTamanio.map((t) => t.tamanio)).toEqual([14, 28]);
    expect(r?.porTamanio[0]?.primerCuadroMs).toBeCloseTo(1.96);
    expect(r?.porTamanio[0]?.tiemposMs).toHaveLength(3);
    expect(r?.porTamanio[0]?.resumen?.mediana).toBeCloseTo(0.196);
    expect(r?.porTamanio[1]?.resumen?.mediana).toBeCloseTo(0.784);
    expect(estimador.liberaciones).toBe(1);
  });

  it('si una configuración no carga, la registra y sigue con la siguiente', async () => {
    const reloj = crearReloj();
    const falla = crearEstimador(reloj, { fallaCarga: true });
    const resultados = await medirModelo({
      estimador: falla,
      reloj,
      obtenerImagen: imagen,
      configuraciones: configuracionesPosibles(true),
      tamanios: [14],
      cuadros: 1,
    });
    expect(resultados).toHaveLength(3);
    expect(resultados.every((r) => r.error === 'sin WebGPU')).toBe(true);
  });

  it('un error durante la inferencia conserva los cuadros ya medidos', async () => {
    const reloj = crearReloj();
    const [r] = await medirModelo({
      estimador: crearEstimador(reloj, { fallaEn: 2 }),
      reloj,
      obtenerImagen: imagen,
      configuraciones: [{ backend: 'webgpu', precision: 'fp16' }],
      tamanios: [14],
      cuadros: 5,
    });
    expect(r?.porTamanio[0]).toMatchObject({ error: 'memoria agotada' });
    expect(r?.porTamanio[0]?.tiemposMs).toHaveLength(1);
  });

  it('informa el avance y se puede cancelar', async () => {
    const reloj = crearReloj();
    const etapas: string[] = [];
    let cuadrosVistos = 0;
    await medirModelo({
      estimador: crearEstimador(reloj),
      reloj,
      obtenerImagen: imagen,
      configuraciones: [{ backend: 'wasm', precision: 'q8' }],
      tamanios: [14, 28],
      cuadros: 10,
      alAvanzar: (a) => {
        etapas.push(a.etapa);
        if (a.etapa === 'midiendo') cuadrosVistos++;
      },
      cancelado: () => cuadrosVistos >= 3,
    });
    expect(etapas[0]).toBe('cargando');
    expect(cuadrosVistos).toBe(3);
  });
});

describe('configuracionesPosibles', () => {
  it('sin WebGPU solo prueba WASM q8', () => {
    expect(configuracionesPosibles(false)).toEqual([{ backend: 'wasm', precision: 'q8' }]);
  });
  it('con WebGPU prueba fp16 y q8 en GPU, y WASM como referencia', () => {
    expect(configuracionesPosibles(true).map((c) => `${c.backend}-${c.precision}`)).toEqual([
      'webgpu-fp16',
      'webgpu-q8',
      'wasm-q8',
    ]);
  });
});
