import type { ConfigEstimador } from '../core/puertos/profundidad';
import type { ImagenRGBA } from '../core/puertos/imagen';

/** Mensajes entre el hilo principal y el worker de profundidad. Cada pedido lleva un id. */
export type MensajeAlWorker =
  | { readonly tipo: 'cargar'; readonly id: number; readonly config: ConfigEstimador }
  | { readonly tipo: 'estimar'; readonly id: number; readonly imagen: ImagenRGBA }
  | { readonly tipo: 'liberar'; readonly id: number };

export type MensajeDelWorker =
  | {
      readonly tipo: 'progreso';
      readonly id: number;
      readonly bytesCargados: number;
      readonly bytesTotales: number;
    }
  | { readonly tipo: 'listo'; readonly id: number }
  | {
      readonly tipo: 'mapa';
      readonly id: number;
      readonly ancho: number;
      readonly alto: number;
      readonly valores: Float32Array;
    }
  | { readonly tipo: 'error'; readonly id: number; readonly mensaje: string };
