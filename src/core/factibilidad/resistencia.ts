import { resumir } from '../estadisticas/resumen';

/** Muestra periódica de la prueba de resistencia (por defecto cada 10 s). */
export interface MuestraResistencia {
  readonly t: number;
  /** Nivel de batería entre 0 y 1, o null si no se puede leer. */
  readonly nivelBateria: number | null;
  readonly cargando: boolean | null;
  /** Cuadros procesados desde la muestra anterior. */
  readonly cuadros: number;
  /** Mediana del tiempo por cuadro en el período, en ms. */
  readonly msCuadroMediana: number | null;
  readonly pantallaActiva: boolean;
}

export interface ResumenResistencia {
  readonly duracionMin: number;
  readonly muestras: number;
  /** Puntos porcentuales de batería consumidos (null si no hay datos o estuvo cargando). */
  readonly consumoPorcentual: number | null;
  readonly consumoPorHora: number | null;
  readonly fpsInicio: number | null;
  readonly fpsFinal: number | null;
  /** Cuánto cayó el rendimiento entre el inicio y el final, en %. Positivo = más lento al final. */
  readonly caidaRendimientoPct: number | null;
  readonly msCuadroInicio: number | null;
  readonly msCuadroFinal: number | null;
  /** Veces que se perdió el bloqueo de pantalla encendida. */
  readonly perdidasPantalla: number;
  readonly estuvoCargando: boolean;
}

/**
 * Resume la prueba de resistencia comparando la ventana inicial con la final
 * (por defecto, los primeros y los últimos 2 minutos).
 */
export function resumirResistencia(
  muestras: readonly MuestraResistencia[],
  ventanaMs = 120_000,
): ResumenResistencia {
  const primera = muestras[0];
  const ultima = muestras[muestras.length - 1];
  const duracionMs = primera && ultima ? ultima.t - primera.t : 0;

  // fps de cada período = cuadros / tiempo desde la muestra anterior.
  const periodos = muestras.slice(1).map((m, i) => {
    const dt = m.t - (muestras[i] as MuestraResistencia).t;
    return {
      t: m.t,
      fps: dt > 0 ? (m.cuadros * 1000) / dt : Number.NaN,
      ms: m.msCuadroMediana ?? Number.NaN,
    };
  });
  const enVentana = (desde: number, hasta: number) => periodos.filter((p) => p.t > desde && p.t <= hasta);
  const inicio = primera ? enVentana(primera.t, primera.t + ventanaMs) : [];
  const final = ultima ? enVentana(ultima.t - ventanaMs, ultima.t) : [];
  const mediana = (valores: number[]) => resumir(valores)?.mediana ?? null;

  const fpsInicio = mediana(inicio.map((p) => p.fps));
  const fpsFinal = mediana(final.map((p) => p.fps));

  const estuvoCargando = muestras.some((m) => m.cargando === true);
  const niveles = muestras.map((m) => m.nivelBateria).filter((n): n is number => n !== null);
  const consumo =
    !estuvoCargando && niveles.length >= 2
      ? ((niveles[0] as number) - (niveles[niveles.length - 1] as number)) * 100
      : null;

  let perdidasPantalla = 0;
  for (let i = 1; i < muestras.length; i++) {
    if (
      (muestras[i - 1] as MuestraResistencia).pantallaActiva &&
      !(muestras[i] as MuestraResistencia).pantallaActiva
    ) {
      perdidasPantalla++;
    }
  }

  return {
    duracionMin: duracionMs / 60_000,
    muestras: muestras.length,
    consumoPorcentual: consumo,
    consumoPorHora: consumo !== null && duracionMs > 0 ? consumo / (duracionMs / 3_600_000) : null,
    fpsInicio,
    fpsFinal,
    caidaRendimientoPct: fpsInicio && fpsFinal !== null ? ((fpsInicio - fpsFinal) / fpsInicio) * 100 : null,
    msCuadroInicio: mediana(inicio.map((p) => p.ms)),
    msCuadroFinal: mediana(final.map((p) => p.ms)),
    perdidasPantalla,
    estuvoCargando,
  };
}
