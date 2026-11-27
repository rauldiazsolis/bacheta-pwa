import type { Reloj } from '../core/puertos/reloj';

export const relojNavegador: Reloj = {
  ahoraMs: () => performance.now(),
  fechaHoraMs: () => Date.now(),
};
