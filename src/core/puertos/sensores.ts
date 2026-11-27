import type { Cancelar, Vector3 } from './comunes';

export interface LecturaMovimiento {
  /** Marca de tiempo del Reloj, en ms. */
  readonly t: number;
  /** Aceleración sin gravedad (m/s²), si el dispositivo la entrega. */
  readonly aceleracion: Vector3 | null;
  /** Aceleración incluyendo la gravedad (m/s²). */
  readonly aceleracionConGravedad: Vector3 | null;
  /** Velocidad de rotación (°/s) alrededor de los ejes del dispositivo. */
  readonly rotacion: { readonly alfa: number; readonly beta: number; readonly gama: number } | null;
  /** Intervalo informado por el navegador entre lecturas (ms). */
  readonly intervaloMs: number | null;
}

export interface FuenteMovimiento {
  escuchar(alLeer: (lectura: LecturaMovimiento) => void): Cancelar;
}

export interface LecturaGPS {
  readonly t: number;
  readonly latitud: number;
  readonly longitud: number;
  /** Radio de precisión horizontal en metros. */
  readonly precisionM: number;
  /** Velocidad en m/s, o null si el GPS no la informa. */
  readonly velocidadMs: number | null;
  /** Rumbo en grados (0 = norte, sentido horario), o null. */
  readonly rumboGrados: number | null;
}

export interface FuenteGPS {
  escuchar(alLeer: (lectura: LecturaGPS) => void, alFallar: (motivo: string) => void): Cancelar;
}
