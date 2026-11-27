// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { Reloj } from '../core/puertos/reloj';
import type { EventoTecla } from '../core/puertos/teclas';
import type { LecturaGPS, LecturaMovimiento } from '../core/puertos/sensores';
import type { MensajeAlWorker, MensajeDelWorker } from '../workers/protocoloProfundidad';
import { TecladoNavegador } from './tecladoNavegador';
import { MovimientoNavegador } from './movimientoNavegador';
import { GPSNavegador } from './gpsNavegador';
import { PantallaEncendidaNavegador } from './pantallaEncendidaNavegador';
import { CapacidadesNavegador } from './capacidadesNavegador';
import { BateriaNavegador } from './bateriaNavegador';
import { EstimadorProfundidadWorker, type PuertoWorker } from './estimadorProfundidadWorker';

const reloj: Reloj = { ahoraMs: () => 42, fechaHoraMs: () => 0 };

describe('TecladoNavegador', () => {
  it('traduce keydown/keyup a eventos y deja de escuchar al cancelar', () => {
    const destino = new EventTarget();
    const eventos: EventoTecla[] = [];
    const cancelar = new TecladoNavegador(reloj, destino).escuchar((e) => eventos.push(e), {
      bloquearAccionPorDefecto: false,
    });
    destino.dispatchEvent(new KeyboardEvent('keydown', { key: 'AudioVolumeUp', code: 'AudioVolumeUp' }));
    destino.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'AudioVolumeUp', code: 'AudioVolumeUp', repeat: true }),
    );
    destino.dispatchEvent(new KeyboardEvent('keyup', { key: 'AudioVolumeUp', code: 'AudioVolumeUp' }));
    cancelar();
    destino.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(eventos).toEqual([
      { t: 42, tipo: 'pulsar', key: 'AudioVolumeUp', code: 'AudioVolumeUp', repeticion: false },
      { t: 42, tipo: 'pulsar', key: 'AudioVolumeUp', code: 'AudioVolumeUp', repeticion: true },
      { t: 42, tipo: 'soltar', key: 'AudioVolumeUp', code: 'AudioVolumeUp', repeticion: false },
    ]);
  });

  it('cancela la acción por defecto solo si se pide', () => {
    const destino = new EventTarget();
    const probar = (bloquear: boolean) => {
      const cancelar = new TecladoNavegador(reloj, destino).escuchar(() => undefined, {
        bloquearAccionPorDefecto: bloquear,
      });
      const e = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
      destino.dispatchEvent(e);
      cancelar();
      return e.defaultPrevented;
    };
    expect(probar(true)).toBe(true);
    expect(probar(false)).toBe(false);
  });
});

describe('MovimientoNavegador', () => {
  it('convierte devicemotion y marca como nulo lo que el dispositivo no entrega', () => {
    const destino = new EventTarget();
    const lecturas: LecturaMovimiento[] = [];
    new MovimientoNavegador(reloj, destino).escuchar((l) => lecturas.push(l));
    const evento = Object.assign(new Event('devicemotion'), {
      acceleration: { x: null, y: null, z: null },
      accelerationIncludingGravity: { x: 0.1, y: 9.7, z: 0.3 },
      rotationRate: { alpha: 1, beta: 2, gamma: 3 },
      interval: 16,
    });
    destino.dispatchEvent(evento);
    expect(lecturas[0]).toEqual({
      t: 42,
      aceleracion: null,
      aceleracionConGravedad: { x: 0.1, y: 9.7, z: 0.3 },
      rotacion: { alfa: 1, beta: 2, gama: 3 },
      intervaloMs: 16,
    });
  });
});

describe('GPSNavegador', () => {
  it('convierte posiciones, traduce errores y limpia la suscripción', () => {
    let exito: PositionCallback = () => undefined;
    let fallo: PositionErrorCallback = () => undefined;
    const geo = {
      watchPosition: vi.fn((e: PositionCallback, f: PositionErrorCallback) => {
        exito = e;
        fallo = f;
        return 7;
      }),
      clearWatch: vi.fn(),
    } as unknown as Geolocation;
    const lecturas: LecturaGPS[] = [];
    const errores: string[] = [];
    const cancelar = new GPSNavegador(reloj, geo).escuchar(
      (l) => lecturas.push(l),
      (m) => errores.push(m),
    );
    exito({
      coords: { latitude: -26.8, longitude: -65.2, accuracy: 5, speed: 3, heading: Number.NaN },
    } as GeolocationPosition);
    fallo({ code: 1, message: 'denied' } as GeolocationPositionError);
    cancelar();
    expect(lecturas[0]).toMatchObject({ precisionM: 5, velocidadMs: 3, rumboGrados: null });
    expect(errores).toEqual(['Permiso de ubicación denegado']);
    expect(geo.clearWatch).toHaveBeenCalledWith(7);
  });
});

describe('PantallaEncendidaNavegador', () => {
  function crearEntorno() {
    const centinelas: (EventTarget & { release: () => Promise<void> })[] = [];
    const nav = {
      wakeLock: {
        request: vi.fn(async () => {
          const c = Object.assign(new EventTarget(), {
            release: async () => {
              c.dispatchEvent(new Event('release'));
            },
          });
          centinelas.push(c);
          return c;
        }),
      },
    };
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' as DocumentVisibilityState });
    return { nav, doc, centinelas };
  }

  it('se recupera sola al volver a la pestaña si el sistema la liberó', async () => {
    const { nav, doc, centinelas } = crearEntorno();
    const pantalla = new PantallaEncendidaNavegador(nav, doc);
    const cambios: boolean[] = [];
    pantalla.alCambiar((a) => cambios.push(a));
    expect(await pantalla.activar()).toBe(true);
    // Chrome la libera al ocultar la pestaña.
    doc.visibilityState = 'hidden';
    centinelas[0]?.dispatchEvent(new Event('release'));
    doc.visibilityState = 'visible';
    doc.dispatchEvent(new Event('visibilitychange'));
    await vi.waitFor(() => expect(nav.wakeLock.request).toHaveBeenCalledTimes(2));
    expect(cambios).toEqual([true, false, true]);
  });

  it('no la vuelve a pedir después de desactivarla, y falla limpio sin la API', async () => {
    const { nav, doc } = crearEntorno();
    const pantalla = new PantallaEncendidaNavegador(nav, doc);
    await pantalla.activar();
    await pantalla.desactivar();
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(nav.wakeLock.request).toHaveBeenCalledTimes(1);
    expect(await new PantallaEncendidaNavegador({}, doc).activar()).toBe(false);
  });
});

describe('CapacidadesNavegador', () => {
  it('lee WebGPU (incluido fp16) y el modelo del teléfono', async () => {
    const nav = {
      userAgent: 'Mozilla/5.0',
      hardwareConcurrency: 8,
      deviceMemory: 8,
      gpu: {
        requestAdapter: async () => ({
          features: new Set(['shader-f16']),
          info: { vendor: 'arm', architecture: 'valhall', description: '', isFallbackAdapter: false },
        }),
      },
      userAgentData: {
        getHighEntropyValues: async () => ({
          model: 'motorola edge 40',
          platformVersion: '15.0.0',
          fullVersionList: [
            { brand: 'Not.A/Brand', version: '99' },
            { brand: 'Google Chrome', version: '158.0.8127.42' },
          ],
        }),
      },
    };
    expect(await new CapacidadesNavegador(nav, false).detectar()).toEqual({
      navegador: 'Google Chrome 158.0.8127.42',
      modeloTelefono: 'motorola edge 40',
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
    });
  });

  it('sin WebGPU ni client hints usa valores nulos y el user agent', async () => {
    const r = await new CapacidadesNavegador({ userAgent: 'UA de prueba' }, true).detectar();
    expect(r).toMatchObject({ navegador: 'UA de prueba', modeloTelefono: null, aisladoOrigenCruzado: true });
    expect(r.webgpu.disponible).toBe(false);
  });
});

describe('BateriaNavegador', () => {
  it('lee nivel y carga, o devuelve null si no hay API', async () => {
    const nav = { getBattery: async () => ({ level: 0.55, charging: false }) };
    expect(await new BateriaNavegador(nav).leer()).toEqual({ nivel: 0.55, cargando: false });
    expect(await new BateriaNavegador({}).leer()).toBeNull();
  });
});

describe('EstimadorProfundidadWorker', () => {
  /** Worker falso que responde como el real. */
  function crearWorker(): PuertoWorker & { recibidos: MensajeAlWorker[] } {
    let oyente: (e: MessageEvent<MensajeDelWorker>) => void = () => undefined;
    const responder = (m: MensajeDelWorker) =>
      queueMicrotask(() => oyente({ data: m } as MessageEvent<MensajeDelWorker>));
    const recibidos: MensajeAlWorker[] = [];
    return {
      recibidos,
      addEventListener: (_tipo, o) => (oyente = o),
      postMessage(m) {
        recibidos.push(m);
        if (m.tipo === 'cargar') {
          if (m.config.backend === 'webgpu')
            return responder({ tipo: 'error', id: m.id, mensaje: 'sin GPU' });
          responder({ tipo: 'progreso', id: m.id, bytesCargados: 10, bytesTotales: 20 });
          responder({ tipo: 'listo', id: m.id });
        } else if (m.tipo === 'estimar') {
          const { ancho, alto } = m.imagen;
          responder({ tipo: 'mapa', id: m.id, ancho, alto, valores: new Float32Array(ancho * alto) });
        } else responder({ tipo: 'listo', id: m.id });
      },
    };
  }

  it('resuelve cada pedido con su respuesta y reenvía el progreso', async () => {
    const worker = crearWorker();
    const estimador = new EstimadorProfundidadWorker(worker);
    const progreso = vi.fn();
    await estimador.cargar({ backend: 'wasm', precision: 'q8' }, progreso);
    expect(progreso).toHaveBeenCalledWith({ bytesCargados: 10, bytesTotales: 20 });
    const imagen = { ancho: 14, alto: 14, datos: new Uint8ClampedArray(14 * 14 * 4) };
    const mapa = await estimador.estimar(imagen);
    expect(mapa).toMatchObject({ ancho: 14, alto: 14 });
    expect(imagen.datos).toHaveLength(14 * 14 * 4); // el original no se transfiere
    await estimador.liberar();
    expect(worker.recibidos.map((m) => m.tipo)).toEqual(['cargar', 'estimar', 'liberar']);
  });

  it('convierte los errores del worker en promesas rechazadas', async () => {
    const estimador = new EstimadorProfundidadWorker(crearWorker());
    await expect(estimador.cargar({ backend: 'webgpu', precision: 'fp16' }, () => undefined)).rejects.toThrow(
      'sin GPU',
    );
  });
});
