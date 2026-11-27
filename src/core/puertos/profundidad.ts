import type { ImagenRGBA } from './imagen';

export type BackendInferencia = 'webgpu' | 'wasm';
export type PrecisionModelo = 'fp16' | 'q8';

export interface ConfigEstimador {
  readonly backend: BackendInferencia;
  readonly precision: PrecisionModelo;
}

/** Progreso agregado de la descarga del modelo. */
export interface ProgresoCarga {
  readonly bytesCargados: number;
  readonly bytesTotales: number;
}

/** Mapa de profundidad relativa (disparidad): valores más altos = más cerca. */
export interface MapaProfundidad {
  readonly ancho: number;
  readonly alto: number;
  readonly valores: Float32Array;
}

export interface EstimadorProfundidad {
  /** Descarga (o lee de la caché) e inicializa el modelo. */
  cargar(config: ConfigEstimador, alProgresar: (progreso: ProgresoCarga) => void): Promise<void>;
  estimar(imagen: ImagenRGBA): Promise<MapaProfundidad>;
  liberar(): Promise<void>;
}
