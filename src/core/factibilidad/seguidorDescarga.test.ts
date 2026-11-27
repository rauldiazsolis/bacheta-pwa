import { describe, expect, it } from 'vitest';
import { SeguidorDescarga } from './seguidorDescarga';

describe('SeguidorDescarga', () => {
  it('calcula bytes, duración y Mbps desde el inicio de la carga', () => {
    const s = new SeguidorDescarga(1000);
    s.registrar({ bytesCargados: 2_500_000, bytesTotales: 50_000_000 }, 2000);
    s.registrar({ bytesCargados: 50_000_000, bytesTotales: 50_000_000 }, 9000);
    const r = s.resumen(9500);
    expect(r.bytes).toBe(50_000_000);
    expect(r.duracionMs).toBe(8500);
    expect(r.mbps).toBeCloseTo((50e6 * 8) / 1e6 / 8.5);
  });

  it('no retrocede si llega un evento con menos bytes', () => {
    const s = new SeguidorDescarga(0);
    s.registrar({ bytesCargados: 100, bytesTotales: 100 }, 10);
    s.registrar({ bytesCargados: 40, bytesTotales: 100 }, 20);
    expect(s.resumen(20).bytes).toBe(100);
  });

  it('sin eventos de progreso no informa velocidad', () => {
    const r = new SeguidorDescarga(0).resumen(300);
    expect(r).toEqual({ bytes: 0, duracionMs: 300, mbps: null });
  });
});
