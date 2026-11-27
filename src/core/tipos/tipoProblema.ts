/**
 * Catálogo de tipos de problema que puede registrar Bacheta.
 *
 * Es lógica pura de dominio: no depende de ninguna API del navegador.
 */

export const TIPOS_PROBLEMA = ['bache', 'agua', 'vereda-rota', 'obstaculo', 'esquive'] as const;

export type TipoProblema = (typeof TIPOS_PROBLEMA)[number];

export interface DescripcionTipo {
  /** Texto corto para la interfaz y las exportaciones. */
  readonly etiqueta: string;
  /** Si el usuario puede marcarlo a mano (botón) o solo lo genera un detector. */
  readonly marcableManualmente: boolean;
}

export const DESCRIPCION_TIPOS: Readonly<Record<TipoProblema, DescripcionTipo>> = {
  bache: { etiqueta: 'Bache', marcableManualmente: true },
  agua: { etiqueta: 'Agua / derrame', marcableManualmente: true },
  'vereda-rota': { etiqueta: 'Vereda rota', marcableManualmente: true },
  obstaculo: { etiqueta: 'Obstáculo / calle cortada', marcableManualmente: true },
  esquive: { etiqueta: 'Esquive', marcableManualmente: false },
};

/** Valida un valor desconocido (por ejemplo, leído de IndexedDB o de un archivo importado). */
export function esTipoProblema(valor: unknown): valor is TipoProblema {
  return typeof valor === 'string' && (TIPOS_PROBLEMA as readonly string[]).includes(valor);
}

/** Tipos que se pueden asignar a un botón del control o de la pantalla. */
export function tiposMarcables(): TipoProblema[] {
  return TIPOS_PROBLEMA.filter((tipo) => DESCRIPCION_TIPOS[tipo].marcableManualmente);
}
