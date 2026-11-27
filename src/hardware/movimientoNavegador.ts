import type { Cancelar, Vector3 } from '../core/puertos/comunes';
import type { FuenteMovimiento, LecturaMovimiento } from '../core/puertos/sensores';
import type { Reloj } from '../core/puertos/reloj';

interface EventoMovimiento extends Event {
  readonly acceleration?: { x: number | null; y: number | null; z: number | null } | null;
  readonly accelerationIncludingGravity?: { x: number | null; y: number | null; z: number | null } | null;
  readonly rotationRate?: { alpha: number | null; beta: number | null; gamma: number | null } | null;
  readonly interval?: number | null;
}

function vector(v: EventoMovimiento['acceleration']): Vector3 | null {
  if (!v || v.x === null || v.y === null || v.z === null) return null;
  return { x: v.x, y: v.y, z: v.z };
}

/** Lee `devicemotion`. En Chrome para Android no pide permiso, pero exige HTTPS. */
export class MovimientoNavegador implements FuenteMovimiento {
  constructor(
    private readonly reloj: Reloj,
    private readonly destino: Pick<Window, 'addEventListener' | 'removeEventListener'> = window,
  ) {}

  escuchar(alLeer: (lectura: LecturaMovimiento) => void): Cancelar {
    const oyente = (evento: Event) => {
      const e = evento as EventoMovimiento;
      const r = e.rotationRate;
      alLeer({
        t: this.reloj.ahoraMs(),
        aceleracion: vector(e.acceleration),
        aceleracionConGravedad: vector(e.accelerationIncludingGravity),
        rotacion:
          r && r.alpha !== null && r.beta !== null && r.gamma !== null
            ? { alfa: r.alpha, beta: r.beta, gama: r.gamma }
            : null,
        intervaloMs: e.interval ?? null,
      });
    };
    this.destino.addEventListener('devicemotion', oyente);
    return () => this.destino.removeEventListener('devicemotion', oyente);
  }
}
