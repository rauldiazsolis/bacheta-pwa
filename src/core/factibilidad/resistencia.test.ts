import { describe, expect, it } from 'vitest';
import { resumirResistencia, type MuestraResistencia } from './resistencia';

/** 20 minutos con una muestra cada 10 s; el teléfono se calienta y baja de 4 a 2 fps. */
function prueba(
  opciones: Partial<MuestraResistencia> = {},
  pantalla: (i: number) => boolean = () => true,
): MuestraResistencia[] {
  return Array.from({ length: 121 }, (_, i) => {
    const fps = i <= 12 ? 4 : i >= 109 ? 2 : 3;
    return {
      t: i * 10_000,
      nivelBateria: 0.9 - i * (0.1 / 120),
      cargando: false,
      cuadros: i === 0 ? 0 : fps * 10,
      msCuadroMediana: 1000 / fps,
      pantallaActiva: pantalla(i),
      ...opciones,
    };
  });
}

describe('resumirResistencia', () => {
  it('compara los primeros y los últimos 2 minutos', () => {
    const r = resumirResistencia(prueba());
    expect(r.duracionMin).toBe(20);
    expect(r.muestras).toBe(121);
    expect(r.fpsInicio).toBeCloseTo(4);
    expect(r.fpsFinal).toBeCloseTo(2);
    expect(r.caidaRendimientoPct).toBeCloseTo(50);
    expect(r.msCuadroInicio).toBeCloseTo(250);
    expect(r.msCuadroFinal).toBeCloseTo(500);
  });

  it('calcula el consumo de batería total y por hora', () => {
    const r = resumirResistencia(prueba());
    expect(r.consumoPorcentual).toBeCloseTo(10);
    expect(r.consumoPorHora).toBeCloseTo(30);
    expect(r.estuvoCargando).toBe(false);
  });

  it('no informa consumo si el teléfono estuvo cargando o no expone la batería', () => {
    expect(resumirResistencia(prueba({ cargando: true })).consumoPorcentual).toBeNull();
    expect(resumirResistencia(prueba({ nivelBateria: null })).consumoPorHora).toBeNull();
  });

  it('cuenta cada vez que se perdió la pantalla encendida', () => {
    const r = resumirResistencia(prueba({}, (i) => !(i >= 30 && i < 33) && i !== 80));
    expect(r.perdidasPantalla).toBe(2);
  });

  it('tolera una prueba vacía o de una sola muestra', () => {
    expect(resumirResistencia([])).toMatchObject({ duracionMin: 0, muestras: 0, fpsInicio: null });
    expect(resumirResistencia(prueba().slice(0, 1)).fpsFinal).toBeNull();
  });
});
