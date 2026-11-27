/** Imagen en píxeles RGBA de 8 bits, fila por fila (igual que ImageData). */
export interface ImagenRGBA {
  readonly ancho: number;
  readonly alto: number;
  readonly datos: Uint8ClampedArray;
}

export interface InfoCamara {
  readonly anchoActual: number;
  readonly altoActual: number;
  readonly anchoMaximo: number | null;
  readonly altoMaximo: number | null;
  readonly fpsMaximo: number | null;
}

export interface FuenteCamara {
  iniciar(): Promise<InfoCamara>;
  /** Captura el cuadro actual escalado a ancho × alto, o null si la cámara no está lista. */
  capturar(ancho: number, alto: number): ImagenRGBA | null;
  detener(): void;
}
