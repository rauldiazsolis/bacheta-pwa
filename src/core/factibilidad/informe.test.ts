import { describe, expect, it } from 'vitest';
import { clavesPrivadasEn, crearInforme, nombreArchivoInforme, type PartesInforme } from './informe';
import { AcumuladorSensores } from './medicionSensores';

const partes = (modeloTelefono: string | null): PartesInforme => {
  const sensores = new AcumuladorSensores(0);
  sensores.agregarGPS({
    t: 0,
    latitud: -26.8,
    longitud: -65.2,
    precisionM: 5,
    velocidadMs: 1,
    rumboGrados: 0,
  });
  return {
    dispositivo: {
      navegador: 'Chrome 158',
      modeloTelefono,
      versionPlataforma: '15.0.0',
      nucleos: 8,
      memoriaGB: 8,
      aisladoOrigenCruzado: false,
      webgpu: {
        disponible: true,
        fabricante: 'arm',
        arquitectura: 'valhall',
        descripcion: null,
        soportaF16: true,
        esAdaptadorDeRespaldo: false,
      },
    },
    camara: null,
    modelo: [],
    sensores: [{ escenario: 'caminando', resumen: sensores.resumen(1000) }],
    teclas: [],
    resistencia: null,
  };
};

describe('informe de factibilidad', () => {
  it('agrega versión, versión de la app y fecha ISO', () => {
    const informe = crearInforme(partes('motorola edge 40'), '0.1.0', Date.UTC(2026, 10, 27, 15, 4));
    expect(informe).toMatchObject({
      version: 1,
      versionApp: '0.1.0',
      generadoEn: '2026-11-27T15:04:00.000Z',
    });
  });

  it('arma un nombre de archivo seguro con el modelo del teléfono', () => {
    const fecha = Date.UTC(2026, 10, 27, 15, 4);
    expect(nombreArchivoInforme(crearInforme(partes('Redmi Note 12 Pro (4G)'), '0.1.0', fecha))).toBe(
      'factibilidad-redmi-note-12-pro-4g-2026-11-27-15-04.json',
    );
    expect(nombreArchivoInforme(crearInforme(partes(null), '0.1.0', fecha))).toBe(
      'factibilidad-telefono-2026-11-27-15-04.json',
    );
  });

  it('no contiene ubicaciones ni imágenes', () => {
    const informe = crearInforme(partes('x'), '0.1.0', 0);
    expect(clavesPrivadasEn(JSON.parse(JSON.stringify(informe)))).toEqual([]);
  });

  it('detecta claves privadas en cualquier nivel', () => {
    expect(clavesPrivadasEn({ a: [{ b: { latitud: 1 } }], imagen: 'x' }).sort()).toEqual([
      'imagen',
      'latitud',
    ]);
  });
});
