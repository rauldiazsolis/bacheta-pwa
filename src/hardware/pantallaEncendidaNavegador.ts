import type { Cancelar } from '../core/puertos/comunes';
import type { PantallaEncendida } from '../core/puertos/dispositivo';

interface Centinela extends EventTarget {
  release(): Promise<void>;
}
interface ConWakeLock {
  readonly wakeLock?: { request(tipo: 'screen'): Promise<Centinela> };
}

/**
 * Screen Wake Lock con recuperación automática: Chrome lo libera cuando la
 * pestaña se oculta, así que se vuelve a pedir al volver a estar visible.
 */
export class PantallaEncendidaNavegador implements PantallaEncendida {
  private centinela: Centinela | null = null;
  private deseada = false;
  private readonly oyentes = new Set<(activa: boolean) => void>();

  constructor(
    private readonly nav: ConWakeLock = navigator as ConWakeLock,
    private readonly doc: Pick<Document, 'visibilityState' | 'addEventListener'> = document,
  ) {
    doc.addEventListener('visibilitychange', () => {
      if (this.deseada && !this.centinela && this.doc.visibilityState === 'visible') void this.pedir();
    });
  }

  activar(): Promise<boolean> {
    this.deseada = true;
    return this.centinela ? Promise.resolve(true) : this.pedir();
  }

  async desactivar(): Promise<void> {
    this.deseada = false;
    const centinela = this.centinela;
    this.centinela = null;
    await centinela?.release();
  }

  alCambiar(oyente: (activa: boolean) => void): Cancelar {
    this.oyentes.add(oyente);
    return () => this.oyentes.delete(oyente);
  }

  private async pedir(): Promise<boolean> {
    if (!this.nav.wakeLock) return false;
    try {
      const centinela = await this.nav.wakeLock.request('screen');
      centinela.addEventListener('release', () => {
        if (this.centinela === centinela) this.centinela = null;
        this.notificar(false);
      });
      this.centinela = centinela;
      this.notificar(true);
      return true;
    } catch {
      return false;
    }
  }

  private notificar(activa: boolean): void {
    for (const oyente of this.oyentes) oyente(activa);
  }
}
