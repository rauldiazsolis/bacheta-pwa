import type { LecturaGPS, LecturaMovimiento } from '../puertos/sensores';
import { estimarFrecuencia, resumir, type ResumenEstadistico } from '../estadisticas/resumen';

export interface ResumenMovimiento {
  readonly lecturas: number;
  readonly hz: number | null;
  /** Mediana del intervalo que informa el propio navegador (ms). */
  readonly intervaloInformadoMs: number | null;
  readonly tieneAceleracionSinGravedad: boolean;
  readonly tieneGiroscopio: boolean;
  /** Módulo de la aceleración con gravedad (m/s²): con el teléfono quieto ≈ 9,8 y el desvío mide el ruido. */
  readonly moduloConGravedad: ResumenEstadistico | null;
}

export interface ResumenGPS {
  readonly lecturas: number;
  readonly hz: number | null;
  readonly precisionM: ResumenEstadistico | null;
  readonly informaVelocidad: boolean;
  readonly informaRumbo: boolean;
  readonly velocidadMaximaKmh: number | null;
  readonly errores: readonly string[];
}

export interface ResumenSensores {
  readonly duracionMs: number;
  readonly movimiento: ResumenMovimiento;
  readonly gps: ResumenGPS;
}

/**
 * Acumula lecturas durante una medición. Por privacidad, del GPS solo se
 * conservan precisión, velocidad y rumbo: nunca la latitud ni la longitud.
 */
export class AcumuladorSensores {
  private readonly marcasMovimiento: number[] = [];
  private readonly intervalosInformados: number[] = [];
  private readonly modulos: number[] = [];
  private sinGravedad = false;
  private giroscopio = false;

  private readonly marcasGPS: number[] = [];
  private readonly precisiones: number[] = [];
  private readonly velocidades: number[] = [];
  private rumbo = false;
  private readonly errores: string[] = [];

  constructor(private readonly inicio: number) {}

  agregarMovimiento(l: LecturaMovimiento): void {
    this.marcasMovimiento.push(l.t);
    if (l.intervaloMs !== null && l.intervaloMs > 0) this.intervalosInformados.push(l.intervaloMs);
    if (l.aceleracion) this.sinGravedad = true;
    if (l.rotacion) this.giroscopio = true;
    const g = l.aceleracionConGravedad;
    if (g) this.modulos.push(Math.hypot(g.x, g.y, g.z));
  }

  agregarGPS(l: LecturaGPS): void {
    this.marcasGPS.push(l.t);
    this.precisiones.push(l.precisionM);
    if (l.velocidadMs !== null) this.velocidades.push(l.velocidadMs);
    if (l.rumboGrados !== null) this.rumbo = true;
  }

  agregarErrorGPS(motivo: string): void {
    if (!this.errores.includes(motivo)) this.errores.push(motivo);
  }

  resumen(fin: number): ResumenSensores {
    const velocidadMaxima = this.velocidades.length ? Math.max(...this.velocidades) * 3.6 : null;
    return {
      duracionMs: fin - this.inicio,
      movimiento: {
        lecturas: this.marcasMovimiento.length,
        hz: estimarFrecuencia(this.marcasMovimiento)?.hz ?? null,
        intervaloInformadoMs: resumir(this.intervalosInformados)?.mediana ?? null,
        tieneAceleracionSinGravedad: this.sinGravedad,
        tieneGiroscopio: this.giroscopio,
        moduloConGravedad: resumir(this.modulos),
      },
      gps: {
        lecturas: this.marcasGPS.length,
        hz: estimarFrecuencia(this.marcasGPS)?.hz ?? null,
        precisionM: resumir(this.precisiones),
        informaVelocidad: this.velocidades.length > 0,
        informaRumbo: this.rumbo,
        velocidadMaximaKmh: velocidadMaxima,
        errores: [...this.errores],
      },
    };
  }
}
