import type {
  ConfigEstimador,
  EstimadorProfundidad,
  MapaProfundidad,
  ProgresoCarga,
} from '../core/puertos/profundidad';
import type { ImagenRGBA } from '../core/puertos/imagen';

export interface OpcionesEstimadorSimulado {
  /** Milisegundos por cuadro a 252 px; escala con la cantidad de píxeles. */
  readonly msPorCuadro252?: number;
  /** Simula un teléfono sin WebGPU: cargar con backend webgpu falla. */
  readonly sinWebGPU?: boolean;
  readonly bytesModelo?: number;
}

const esperar = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

/**
 * Estimador falso para el modo simulación y los tests de punta a punta:
 * tiempos realistas en escala, sin descargar nada. Devuelve un suelo plano
 * (disparidad que crece hacia abajo de la imagen).
 */
export class EstimadorSimulado implements EstimadorProfundidad {
  private cargado: ConfigEstimador | null = null;

  constructor(private readonly opciones: OpcionesEstimadorSimulado = {}) {}

  async cargar(config: ConfigEstimador, alProgresar: (p: ProgresoCarga) => void): Promise<void> {
    if (config.backend === 'webgpu' && this.opciones.sinWebGPU) {
      throw new Error('WebGPU no disponible (simulado)');
    }
    const total = this.opciones.bytesModelo ?? (config.precision === 'fp16' ? 50e6 : 27e6);
    for (let paso = 1; paso <= 5; paso++) {
      await esperar(10);
      alProgresar({ bytesCargados: (total * paso) / 5, bytesTotales: total });
    }
    this.cargado = config;
  }

  async estimar(imagen: ImagenRGBA): Promise<MapaProfundidad> {
    if (!this.cargado) throw new Error('El modelo no está cargado');
    const base = this.opciones.msPorCuadro252 ?? 40;
    const factorBackend = this.cargado.backend === 'wasm' ? 4 : 1;
    await esperar(base * factorBackend * ((imagen.ancho * imagen.alto) / (252 * 252)));
    const valores = new Float32Array(imagen.ancho * imagen.alto);
    for (let y = 0; y < imagen.alto; y++)
      valores.fill(y / imagen.alto, y * imagen.ancho, (y + 1) * imagen.ancho);
    return { ancho: imagen.ancho, alto: imagen.alto, valores };
  }

  async liberar(): Promise<void> {
    this.cargado = null;
  }
}
