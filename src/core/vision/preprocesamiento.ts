import type { ImagenRGBA } from '../puertos/imagen';
import { DESVIO_RGB, MEDIA_RGB, esTamanioValido } from './modelo';

/**
 * Convierte una imagen RGBA (ya escalada al tamaño de entrada) en el tensor
 * que espera el modelo: float32, canales separados (C × H × W), valores
 * llevados a [0, 1] y normalizados con la media y el desvío de ImageNet.
 * Se descarta el canal alfa.
 */
export function aTensorNormalizado(imagen: ImagenRGBA): Float32Array {
  const { ancho, alto, datos } = imagen;
  if (!esTamanioValido(ancho) || !esTamanioValido(alto)) {
    throw new RangeError(`El tamaño ${ancho}×${alto} no es múltiplo de 14`);
  }
  if (datos.length !== ancho * alto * 4) {
    throw new RangeError('La cantidad de píxeles no coincide con ancho × alto');
  }
  const plano = ancho * alto;
  const salida = new Float32Array(3 * plano);
  for (let i = 0; i < plano; i++) {
    for (let c = 0; c < 3; c++) {
      const valor = (datos[i * 4 + c] as number) / 255;
      salida[c * plano + i] = (valor - (MEDIA_RGB[c] as number)) / (DESVIO_RGB[c] as number);
    }
  }
  return salida;
}
