import type { Cancelar } from '../core/puertos/comunes';
import type { EventoTecla, FuenteTeclas, OpcionesTeclas } from '../core/puertos/teclas';
import type { Reloj } from '../core/puertos/reloj';

/**
 * Escucha `keydown`/`keyup`. Un control Bluetooth se presenta como teclado.
 * Con `bloquearAccionPorDefecto` se intenta evitar, por ejemplo, que la tecla
 * de volumen cambie el volumen (la Fase 0.5 mide si Chrome lo respeta).
 */
export class TecladoNavegador implements FuenteTeclas {
  constructor(
    private readonly reloj: Reloj,
    private readonly destino: Pick<Window, 'addEventListener' | 'removeEventListener'> = window,
  ) {}

  escuchar(alRecibir: (evento: EventoTecla) => void, opciones: OpcionesTeclas): Cancelar {
    const crear = (tipo: EventoTecla['tipo']) => (evento: Event) => {
      const e = evento as KeyboardEvent;
      if (opciones.bloquearAccionPorDefecto) e.preventDefault();
      alRecibir({ t: this.reloj.ahoraMs(), tipo, key: e.key, code: e.code, repeticion: e.repeat });
    };
    const alPulsar = crear('pulsar');
    const alSoltar = crear('soltar');
    this.destino.addEventListener('keydown', alPulsar);
    this.destino.addEventListener('keyup', alSoltar);
    return () => {
      this.destino.removeEventListener('keydown', alPulsar);
      this.destino.removeEventListener('keyup', alSoltar);
    };
  }
}
