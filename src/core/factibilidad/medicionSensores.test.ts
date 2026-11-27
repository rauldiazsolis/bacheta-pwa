import { describe, expect, it } from 'vitest';
import { AcumuladorSensores } from './medicionSensores';

describe('AcumuladorSensores', () => {
  it('resume frecuencia, intervalo informado y ruido del sensor de movimiento', () => {
    const acc = new AcumuladorSensores(0);
    for (let i = 0; i < 100; i++) {
      acc.agregarMovimiento({
        t: i * 16,
        aceleracion: { x: 0, y: 0, z: 0 },
        aceleracionConGravedad: { x: 0, y: 0, z: i % 2 ? 9.9 : 9.7 },
        rotacion: { alfa: 0, beta: 0, gama: 0 },
        intervaloMs: 16,
      });
    }
    const r = acc.resumen(1600).movimiento;
    expect(r.lecturas).toBe(100);
    expect(r.hz).toBeCloseTo(62.5);
    expect(r.intervaloInformadoMs).toBe(16);
    expect(r.tieneAceleracionSinGravedad).toBe(true);
    expect(r.tieneGiroscopio).toBe(true);
    expect(r.moduloConGravedad?.media).toBeCloseTo(9.8);
    expect(r.moduloConGravedad?.desvio).toBeCloseTo(0.1);
  });

  it('marca la falta de giroscopio y de aceleración sin gravedad', () => {
    const acc = new AcumuladorSensores(0);
    acc.agregarMovimiento({
      t: 0,
      aceleracion: null,
      aceleracionConGravedad: null,
      rotacion: null,
      intervaloMs: null,
    });
    const r = acc.resumen(10).movimiento;
    expect(r).toMatchObject({
      tieneAceleracionSinGravedad: false,
      tieneGiroscopio: false,
      moduloConGravedad: null,
    });
  });

  it('resume el GPS sin guardar coordenadas y convierte la velocidad a km/h', () => {
    const acc = new AcumuladorSensores(0);
    acc.agregarGPS({
      t: 0,
      latitud: -26.83,
      longitud: -65.2,
      precisionM: 12,
      velocidadMs: null,
      rumboGrados: null,
    });
    acc.agregarGPS({
      t: 1000,
      latitud: -26.83,
      longitud: -65.2,
      precisionM: 6,
      velocidadMs: 1.5,
      rumboGrados: 90,
    });
    acc.agregarGPS({
      t: 2000,
      latitud: -26.83,
      longitud: -65.2,
      precisionM: 4,
      velocidadMs: 5,
      rumboGrados: 91,
    });
    acc.agregarErrorGPS('permiso denegado');
    acc.agregarErrorGPS('permiso denegado');
    const r = acc.resumen(2000);
    expect(r.duracionMs).toBe(2000);
    expect(r.gps).toMatchObject({
      lecturas: 3,
      hz: 1,
      informaVelocidad: true,
      informaRumbo: true,
      errores: ['permiso denegado'],
    });
    expect(r.gps.precisionM?.mediana).toBe(6);
    expect(r.gps.velocidadMaximaKmh).toBeCloseTo(18);
    const json = JSON.stringify(r);
    expect(json).not.toContain('-26.83');
    expect(json).not.toContain('-65.2');
  });

  it('sin lecturas devuelve valores nulos', () => {
    const r = new AcumuladorSensores(0).resumen(0);
    expect(r.movimiento.hz).toBeNull();
    expect(r.gps).toMatchObject({ lecturas: 0, hz: null, precisionM: null, velocidadMaximaKmh: null });
  });
});
