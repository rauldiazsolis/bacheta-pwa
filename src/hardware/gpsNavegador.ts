import type { Cancelar } from '../core/puertos/comunes';
import type { FuenteGPS, LecturaGPS } from '../core/puertos/sensores';
import type { Reloj } from '../core/puertos/reloj';

const MOTIVOS: Record<number, string> = {
  1: 'Permiso de ubicación denegado',
  2: 'Ubicación no disponible',
  3: 'Tiempo de espera agotado',
};

/** GPS con `watchPosition` en alta precisión y sin posiciones viejas en caché. */
export class GPSNavegador implements FuenteGPS {
  constructor(
    private readonly reloj: Reloj,
    private readonly geolocalizacion: Geolocation = navigator.geolocation,
  ) {}

  escuchar(alLeer: (lectura: LecturaGPS) => void, alFallar: (motivo: string) => void): Cancelar {
    if (!this.geolocalizacion) {
      alFallar('El navegador no tiene geolocalización');
      return () => undefined;
    }
    const id = this.geolocalizacion.watchPosition(
      ({ coords }) =>
        alLeer({
          t: this.reloj.ahoraMs(),
          latitud: coords.latitude,
          longitud: coords.longitude,
          precisionM: coords.accuracy,
          velocidadMs: coords.speed ?? null,
          rumboGrados: coords.heading === null || Number.isNaN(coords.heading) ? null : coords.heading,
        }),
      (error) => alFallar(MOTIVOS[error.code] ?? error.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30_000 },
    );
    return () => this.geolocalizacion.clearWatch(id);
  }
}
