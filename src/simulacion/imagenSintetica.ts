import type { ImagenRGBA } from '../core/puertos/imagen';

/**
 * Genera una "calle" sintética determinista: cielo arriba, asfalto con
 * textura abajo y una línea central. Sirve de imagen de prueba cuando no hay
 * cámara (PC, tests) y no contiene nada privado.
 */
export function imagenCalleSintetica(ancho: number, alto: number, semilla = 1): ImagenRGBA {
  const datos = new Uint8ClampedArray(ancho * alto * 4);
  let estado = semilla >>> 0 || 1;
  const azar = () => {
    // Generador congruencial lineal (Numerical Recipes): rápido y reproducible.
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
    return estado / 0x100000000;
  };
  const horizonte = Math.floor(alto * 0.4);
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const i = (y * ancho + x) * 4;
      if (y < horizonte) {
        const claridad = 200 - (y / horizonte) * 40;
        datos.set([claridad - 30, claridad - 10, claridad + 30, 255], i);
      } else {
        const ruido = (azar() - 0.5) * 40;
        // La línea central se angosta hacia el horizonte (perspectiva).
        const mitadLinea = 1 + ((y - horizonte) / (alto - horizonte)) * (ancho * 0.02);
        const enLinea = Math.abs(x - ancho / 2) < mitadLinea && Math.floor(y / 8) % 2 === 0;
        const gris = enLinea ? 230 : 90 + ruido;
        datos.set([gris, gris, enLinea ? 120 : gris, 255], i);
      }
    }
  }
  return { ancho, alto, datos };
}
