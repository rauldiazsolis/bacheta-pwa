import type { Cancelar } from './comunes';

export interface EventoTecla {
  readonly t: number;
  readonly tipo: 'pulsar' | 'soltar';
  /** Valor de `KeyboardEvent.key` (p. ej. "Enter", "AudioVolumeUp"). */
  readonly key: string;
  /** Valor de `KeyboardEvent.code` (puede venir vacío en algunos controles). */
  readonly code: string;
  /** true si es una repetición automática por mantener apretado. */
  readonly repeticion: boolean;
}

export interface OpcionesTeclas {
  /** Si es true, se cancela la acción por defecto (p. ej. que cambie el volumen). */
  readonly bloquearAccionPorDefecto: boolean;
}

export interface FuenteTeclas {
  escuchar(alRecibir: (evento: EventoTecla) => void, opciones: OpcionesTeclas): Cancelar;
}
