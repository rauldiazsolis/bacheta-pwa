import type { EventoTecla } from '../puertos/teclas';

/** Resumen de lo que mandó un botón durante "Detectar tecla". */
export interface TeclaDetectada {
  readonly key: string;
  readonly code: string;
  /** Pulsaciones reales (sin contar repeticiones automáticas). */
  readonly pulsaciones: number;
  /** Eventos repetidos por mantener apretado. */
  readonly repeticiones: number;
  /** Cuántas pulsaciones llegaron sin su "soltar" (algunos controles no lo envían). */
  readonly sinSoltar: number;
  /** Mediana de la duración pulsar → soltar en ms, si hubo pares completos. */
  readonly duracionMedianaMs: number | null;
}

const identificador = (e: Pick<EventoTecla, 'key' | 'code'>): string => `${e.key}\u0000${e.code}`;

/**
 * Agrupa los eventos por tecla (key + code) en el orden en que aparecieron
 * por primera vez y calcula pulsaciones, repeticiones y duración.
 */
export function analizarTeclas(eventos: readonly EventoTecla[]): TeclaDetectada[] {
  interface Acumulado {
    key: string;
    code: string;
    pulsaciones: number;
    repeticiones: number;
    sinSoltar: number;
    pulsadaDesde: number | null;
    duraciones: number[];
  }
  const porTecla = new Map<string, Acumulado>();

  for (const evento of eventos) {
    const id = identificador(evento);
    let acc = porTecla.get(id);
    if (!acc) {
      acc = {
        key: evento.key,
        code: evento.code,
        pulsaciones: 0,
        repeticiones: 0,
        sinSoltar: 0,
        pulsadaDesde: null,
        duraciones: [],
      };
      porTecla.set(id, acc);
    }
    if (evento.tipo === 'pulsar') {
      if (evento.repeticion) {
        acc.repeticiones++;
        continue;
      }
      if (acc.pulsadaDesde !== null) acc.sinSoltar++;
      acc.pulsaciones++;
      acc.pulsadaDesde = evento.t;
    } else if (acc.pulsadaDesde !== null) {
      acc.duraciones.push(evento.t - acc.pulsadaDesde);
      acc.pulsadaDesde = null;
    }
  }

  return [...porTecla.values()].map((acc) => {
    const ordenadas = [...acc.duraciones].sort((a, b) => a - b);
    const medio = Math.floor(ordenadas.length / 2);
    const mediana =
      ordenadas.length === 0
        ? null
        : ordenadas.length % 2
          ? (ordenadas[medio] as number)
          : ((ordenadas[medio - 1] as number) + (ordenadas[medio] as number)) / 2;
    return {
      key: acc.key,
      code: acc.code,
      pulsaciones: acc.pulsaciones,
      repeticiones: acc.repeticiones,
      sinSoltar: acc.sinSoltar + (acc.pulsadaDesde !== null ? 1 : 0),
      duracionMedianaMs: mediana,
    };
  });
}
