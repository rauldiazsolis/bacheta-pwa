import type { ProgresoCarga } from '../puertos/profundidad';

export interface ResumenDescarga {
  readonly bytes: number;
  readonly duracionMs: number;
  /** Velocidad media en megabits por segundo. */
  readonly mbps: number | null;
}

/**
 * Acumula los eventos de progreso de la carga del modelo y calcula cuánto
 * se descargó y a qué velocidad. Si el modelo ya estaba en la caché, los
 * bytes llegan casi instantáneamente: la duración lo deja en evidencia.
 */
export class SeguidorDescarga {
  private inicio: number | null = null;
  private ultimo: number | null = null;
  private bytes = 0;

  constructor(private readonly inicioCarga: number) {}

  registrar(progreso: ProgresoCarga, t: number): void {
    this.inicio ??= this.inicioCarga;
    this.ultimo = t;
    this.bytes = Math.max(this.bytes, progreso.bytesCargados);
  }

  resumen(finCarga: number): ResumenDescarga {
    const fin = Math.max(finCarga, this.ultimo ?? finCarga);
    const duracionMs = fin - (this.inicio ?? this.inicioCarga);
    const mbps = this.bytes > 0 && duracionMs > 0 ? (this.bytes * 8) / 1e6 / (duracionMs / 1000) : null;
    return { bytes: this.bytes, duracionMs, mbps };
  }
}
