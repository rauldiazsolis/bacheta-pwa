/**
 * Raíz de composición: el ÚNICO lugar donde se eligen las implementaciones
 * concretas de cada puerto (hardware real, reproducción de grabaciones o
 * simulación). El resto del código recibe sus dependencias por parámetro.
 *
 * En la Fase 0 solo existe el modo `real` y no hay puertos todavía.
 */

export type ModoEjecucion = 'real' | 'reproduccion' | 'simulacion';

export interface Aplicacion {
  readonly modo: ModoEjecucion;
  readonly version: string;
}

export function componerAplicacion(modo: ModoEjecucion, version: string): Aplicacion {
  return { modo, version };
}
