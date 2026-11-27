import type { Reloj } from '../../src/core/puertos/reloj';
import type { FuenteCamara, ImagenRGBA } from '../../src/core/puertos/imagen';
import type { EstimadorProfundidad } from '../../src/core/puertos/profundidad';
import type { FuenteGPS, FuenteMovimiento } from '../../src/core/puertos/sensores';
import type { FuenteTeclas } from '../../src/core/puertos/teclas';
import type { Bateria, DetectorCapacidades, PantallaEncendida } from '../../src/core/puertos/dispositivo';

/** Todo lo que la página de factibilidad necesita, armado en spike/main.tsx. */
export interface ServiciosSpike {
  readonly modo: 'real' | 'simulacion';
  readonly versionApp: string;
  readonly reloj: Reloj;
  readonly capacidades: DetectorCapacidades;
  readonly camara: FuenteCamara;
  readonly estimador: EstimadorProfundidad;
  readonly movimiento: FuenteMovimiento;
  readonly gps: FuenteGPS;
  readonly teclas: FuenteTeclas;
  readonly bateria: Bateria;
  readonly pantalla: PantallaEncendida;
  readonly imagenSintetica: (lado: number) => ImagenRGBA;
  readonly descargar: (nombre: string, contenido: string) => void;
  readonly borrarCacheModelo: () => Promise<number>;
  /** Duraciones de las pruebas (más cortas en simulación). */
  readonly tiempos: {
    readonly sensoresQuietoMs: number;
    readonly sensoresCaminandoMs: number;
    readonly resistenciaMs: number;
    readonly resistenciaIntervaloMs: number;
    readonly cuadrosBenchmark: number;
  };
}
