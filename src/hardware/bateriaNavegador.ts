import type { Bateria, EstadoBateria } from '../core/puertos/dispositivo';

interface ConBateria {
  getBattery?: () => Promise<{ level: number; charging: boolean }>;
}

export class BateriaNavegador implements Bateria {
  constructor(private readonly nav: ConBateria = navigator as ConBateria) {}

  async leer(): Promise<EstadoBateria | null> {
    try {
      const b = await this.nav.getBattery?.();
      return b ? { nivel: b.level, cargando: b.charging } : null;
    } catch {
      return null;
    }
  }
}
