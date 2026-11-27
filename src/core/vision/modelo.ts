/** Parámetros fijos del modelo de profundidad (ver docs/decisiones/0003). */

export const ID_MODELO_PROFUNDIDAD = 'onnx-community/depth-anything-v2-small';

/** Depth Anything usa parches de 14 px: la entrada debe ser múltiplo de 14. */
export const TAMANIO_PARCHE = 14;

/** Lados de entrada a evaluar en la Fase 0.5 (múltiplos de 14). */
export const TAMANIOS_ENTRADA = [252, 392] as const;

/** Normalización de ImageNet que usa el preprocesador de Depth Anything V2. */
export const MEDIA_RGB = [0.485, 0.456, 0.406] as const;
export const DESVIO_RGB = [0.229, 0.224, 0.225] as const;

export function esTamanioValido(lado: number): boolean {
  return Number.isInteger(lado) && lado > 0 && lado % TAMANIO_PARCHE === 0;
}
