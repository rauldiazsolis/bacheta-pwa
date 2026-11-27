/** Estadísticas descriptivas sobre muestras numéricas. */

export interface ResumenEstadistico {
  readonly n: number;
  readonly minimo: number;
  readonly maximo: number;
  readonly media: number;
  readonly mediana: number;
  readonly p95: number;
  readonly desvio: number;
}

/**
 * Percentil con interpolación lineal entre rangos (mismo criterio que
 * `numpy.percentile` por defecto). `p` va de 0 a 100.
 */
export function percentil(ordenadas: readonly number[], p: number): number {
  if (ordenadas.length === 0) throw new RangeError('No hay muestras');
  if (p < 0 || p > 100) throw new RangeError(`Percentil fuera de rango: ${p}`);
  const posicion = (p / 100) * (ordenadas.length - 1);
  const abajo = Math.floor(posicion);
  const arriba = Math.ceil(posicion);
  const a = ordenadas[abajo] as number;
  const b = ordenadas[arriba] as number;
  return a + (b - a) * (posicion - abajo);
}

/** Resume las muestras finitas; devuelve null si no hay ninguna. */
export function resumir(muestras: readonly number[]): ResumenEstadistico | null {
  const validas = muestras.filter(Number.isFinite);
  if (validas.length === 0) return null;
  const ordenadas = [...validas].sort((a, b) => a - b);
  const n = ordenadas.length;
  const media = ordenadas.reduce((s, v) => s + v, 0) / n;
  const varianza = ordenadas.reduce((s, v) => s + (v - media) ** 2, 0) / n;
  return {
    n,
    minimo: ordenadas[0] as number,
    maximo: ordenadas[n - 1] as number,
    media,
    mediana: percentil(ordenadas, 50),
    p95: percentil(ordenadas, 95),
    desvio: Math.sqrt(varianza),
  };
}

export interface FrecuenciaEstimada {
  /** Frecuencia en Hz calculada con la mediana de los intervalos (robusta a pausas). */
  readonly hz: number;
  readonly intervalos: ResumenEstadistico;
}

/** Estima la frecuencia de un flujo de eventos a partir de sus marcas de tiempo (ms). */
export function estimarFrecuencia(marcasMs: readonly number[]): FrecuenciaEstimada | null {
  const intervalos: number[] = [];
  for (let i = 1; i < marcasMs.length; i++) {
    const dt = (marcasMs[i] as number) - (marcasMs[i - 1] as number);
    if (dt > 0) intervalos.push(dt);
  }
  const resumen = resumir(intervalos);
  if (!resumen) return null;
  return { hz: 1000 / resumen.mediana, intervalos: resumen };
}

/** Redondea a `decimales` cifras para informes legibles. */
export function redondear(valor: number, decimales = 1): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}
