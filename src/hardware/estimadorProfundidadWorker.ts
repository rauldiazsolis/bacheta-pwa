import type {
  ConfigEstimador,
  EstimadorProfundidad,
  MapaProfundidad,
  ProgresoCarga,
} from '../core/puertos/profundidad';
import type { ImagenRGBA } from '../core/puertos/imagen';
import type { MensajeAlWorker, MensajeDelWorker } from '../workers/protocoloProfundidad';

/** Mínimo de un Worker que usa el cliente (permite probarlo con un doble). */
export interface PuertoWorker {
  postMessage(mensaje: MensajeAlWorker, transferir?: Transferable[]): void;
  addEventListener(tipo: 'message', oyente: (e: MessageEvent<MensajeDelWorker>) => void): void;
}

interface Pendiente {
  resolver: (m: MensajeDelWorker) => void;
  rechazar: (e: Error) => void;
  alProgresar?: (p: ProgresoCarga) => void;
}

/** Implementa EstimadorProfundidad enviando pedidos al worker de src/workers. */
export class EstimadorProfundidadWorker implements EstimadorProfundidad {
  private siguienteId = 1;
  private readonly pendientes = new Map<number, Pendiente>();

  constructor(private readonly worker: PuertoWorker) {
    worker.addEventListener('message', (e) => this.recibir(e.data));
  }

  /** Crea el worker real empaquetado por Vite. */
  static crear(): EstimadorProfundidadWorker {
    const worker = new Worker(new URL('../workers/profundidad.worker.ts', import.meta.url), {
      type: 'module',
    });
    return new EstimadorProfundidadWorker(worker as unknown as PuertoWorker);
  }

  async cargar(config: ConfigEstimador, alProgresar: (p: ProgresoCarga) => void): Promise<void> {
    await this.pedir((id) => ({ tipo: 'cargar', id, config }), alProgresar);
  }

  async estimar(imagen: ImagenRGBA): Promise<MapaProfundidad> {
    // Se copian los píxeles para poder transferir el buffer sin perder el original.
    const copia: ImagenRGBA = {
      ancho: imagen.ancho,
      alto: imagen.alto,
      datos: new Uint8ClampedArray(imagen.datos),
    };
    const respuesta = await this.pedir((id) => ({ tipo: 'estimar', id, imagen: copia }), undefined, [
      copia.datos.buffer as ArrayBuffer,
    ]);
    if (respuesta.tipo !== 'mapa') throw new Error('Respuesta inesperada del worker');
    return { ancho: respuesta.ancho, alto: respuesta.alto, valores: respuesta.valores };
  }

  async liberar(): Promise<void> {
    await this.pedir((id) => ({ tipo: 'liberar', id }));
  }

  private pedir(
    armar: (id: number) => MensajeAlWorker,
    alProgresar?: (p: ProgresoCarga) => void,
    transferir: Transferable[] = [],
  ): Promise<MensajeDelWorker> {
    const id = this.siguienteId++;
    return new Promise((resolver, rechazar) => {
      this.pendientes.set(id, { resolver, rechazar, ...(alProgresar ? { alProgresar } : {}) });
      this.worker.postMessage(armar(id), transferir);
    });
  }

  private recibir(mensaje: MensajeDelWorker): void {
    const pendiente = this.pendientes.get(mensaje.id);
    if (!pendiente) return;
    if (mensaje.tipo === 'progreso') {
      pendiente.alProgresar?.({ bytesCargados: mensaje.bytesCargados, bytesTotales: mensaje.bytesTotales });
      return;
    }
    this.pendientes.delete(mensaje.id);
    if (mensaje.tipo === 'error') pendiente.rechazar(new Error(mensaje.mensaje));
    else pendiente.resolver(mensaje);
  }
}
