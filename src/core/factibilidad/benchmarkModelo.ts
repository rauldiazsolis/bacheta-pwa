import type { Reloj } from '../puertos/reloj';
import type { ImagenRGBA } from '../puertos/imagen';
import type { ConfigEstimador, EstimadorProfundidad } from '../puertos/profundidad';
import { resumir, type ResumenEstadistico } from '../estadisticas/resumen';
import { SeguidorDescarga, type ResumenDescarga } from './seguidorDescarga';

export interface ResultadoConfiguracion {
  readonly backend: ConfigEstimador['backend'];
  readonly precision: ConfigEstimador['precision'];
  /** Tiempo total de carga (descarga + inicialización), en ms. */
  readonly cargaMs: number | null;
  readonly descarga: ResumenDescarga | null;
  readonly porTamanio: readonly ResultadoTamanio[];
  /** Mensaje de error si la configuración no pudo cargarse. */
  readonly error: string | null;
}

export interface ResultadoTamanio {
  readonly tamanio: number;
  /** Primer cuadro aparte: incluye compilación de shaders y no es representativo. */
  readonly primerCuadroMs: number | null;
  readonly tiemposMs: readonly number[];
  readonly resumen: ResumenEstadistico | null;
  readonly error: string | null;
}

export type AvanceBenchmark =
  | {
      readonly etapa: 'cargando';
      readonly config: ConfigEstimador;
      readonly bytes: number;
      readonly total: number;
    }
  | {
      readonly etapa: 'midiendo';
      readonly config: ConfigEstimador;
      readonly tamanio: number;
      readonly cuadro: number;
      readonly de: number;
    };

export interface OpcionesBenchmark {
  readonly estimador: EstimadorProfundidad;
  readonly reloj: Reloj;
  /** Entrega la imagen de prueba al tamaño pedido (cuadrada). */
  readonly obtenerImagen: (lado: number) => ImagenRGBA;
  readonly configuraciones: readonly ConfigEstimador[];
  readonly tamanios: readonly number[];
  /** Cuadros medidos por tamaño, sin contar el de calentamiento. */
  readonly cuadros: number;
  readonly alAvanzar?: (avance: AvanceBenchmark) => void;
  /** Permite cancelar entre cuadros. */
  readonly cancelado?: () => boolean;
}

const mensaje = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/**
 * Mide cada configuración (backend × precisión) en cada tamaño de entrada.
 * Una configuración que falla no detiene a las demás: queda registrada con su error.
 */
export async function medirModelo(opciones: OpcionesBenchmark): Promise<ResultadoConfiguracion[]> {
  const { estimador, reloj, configuraciones, tamanios, cuadros, alAvanzar, cancelado } = opciones;
  const resultados: ResultadoConfiguracion[] = [];

  for (const config of configuraciones) {
    if (cancelado?.()) break;
    const inicio = reloj.ahoraMs();
    const seguidor = new SeguidorDescarga(inicio);
    try {
      await estimador.cargar(config, (progreso) => {
        seguidor.registrar(progreso, reloj.ahoraMs());
        alAvanzar?.({
          etapa: 'cargando',
          config,
          bytes: progreso.bytesCargados,
          total: progreso.bytesTotales,
        });
      });
    } catch (e) {
      resultados.push({ ...config, cargaMs: null, descarga: null, porTamanio: [], error: mensaje(e) });
      await estimador.liberar().catch(() => undefined);
      continue;
    }
    const fin = reloj.ahoraMs();

    const porTamanio: ResultadoTamanio[] = [];
    for (const tamanio of tamanios) {
      if (cancelado?.()) break;
      porTamanio.push(await medirTamanio(opciones, config, tamanio, cuadros, alAvanzar));
    }
    await estimador.liberar();
    resultados.push({
      ...config,
      cargaMs: fin - inicio,
      descarga: seguidor.resumen(fin),
      porTamanio,
      error: null,
    });
  }
  return resultados;
}

async function medirTamanio(
  { estimador, reloj, obtenerImagen, cancelado }: OpcionesBenchmark,
  config: ConfigEstimador,
  tamanio: number,
  cuadros: number,
  alAvanzar: OpcionesBenchmark['alAvanzar'],
): Promise<ResultadoTamanio> {
  const tiemposMs: number[] = [];
  let primerCuadroMs: number | null = null;
  try {
    for (let i = 0; i <= cuadros; i++) {
      if (cancelado?.()) break;
      alAvanzar?.({ etapa: 'midiendo', config, tamanio, cuadro: i, de: cuadros });
      const imagen = obtenerImagen(tamanio);
      const t0 = reloj.ahoraMs();
      await estimador.estimar(imagen);
      const dt = reloj.ahoraMs() - t0;
      if (i === 0) primerCuadroMs = dt;
      else tiemposMs.push(dt);
    }
    return { tamanio, primerCuadroMs, tiemposMs, resumen: resumir(tiemposMs), error: null };
  } catch (e) {
    return { tamanio, primerCuadroMs, tiemposMs, resumen: resumir(tiemposMs), error: mensaje(e) };
  }
}

/** Configuraciones a probar según lo que soporta el teléfono. */
export function configuracionesPosibles(hayWebGPU: boolean): ConfigEstimador[] {
  const wasm: ConfigEstimador = { backend: 'wasm', precision: 'q8' };
  if (!hayWebGPU) return [wasm];
  return [{ backend: 'webgpu', precision: 'fp16' }, { backend: 'webgpu', precision: 'q8' }, wasm];
}
