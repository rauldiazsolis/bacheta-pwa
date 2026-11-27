import type { CapacidadesDispositivo } from '../puertos/dispositivo';
import type { InfoCamara } from '../puertos/imagen';
import type { ConfigEstimador } from '../puertos/profundidad';
import type { TeclaDetectada } from '../control/analizadorTeclas';
import type { ResultadoConfiguracion } from './benchmarkModelo';
import type { ResumenSensores } from './medicionSensores';
import type { MuestraResistencia, ResumenResistencia } from './resistencia';

export const VERSION_INFORME = 1;

export interface MedicionSensores {
  /** "quieto" (30 s apoyado) o "caminando" (1 min al aire libre). */
  readonly escenario: 'quieto' | 'caminando';
  readonly resumen: ResumenSensores;
}

export interface PruebaTeclas {
  readonly bloquearAccionPorDefecto: boolean;
  readonly detectadas: readonly TeclaDetectada[];
}

export interface PruebaResistencia {
  readonly config: ConfigEstimador;
  readonly tamanio: number;
  readonly resumen: ResumenResistencia;
  readonly muestras: readonly MuestraResistencia[];
}

/** Lo que exporta la página de factibilidad. No contiene fotos ni ubicaciones. */
export interface InformeFactibilidad {
  readonly version: typeof VERSION_INFORME;
  readonly versionApp: string;
  readonly generadoEn: string;
  readonly dispositivo: CapacidadesDispositivo | null;
  readonly camara: InfoCamara | null;
  readonly modelo: readonly ResultadoConfiguracion[];
  readonly sensores: readonly MedicionSensores[];
  readonly teclas: readonly PruebaTeclas[];
  readonly resistencia: PruebaResistencia | null;
}

export type PartesInforme = Omit<InformeFactibilidad, 'version' | 'versionApp' | 'generadoEn'>;

export function crearInforme(
  partes: PartesInforme,
  versionApp: string,
  fechaHoraMs: number,
): InformeFactibilidad {
  return { version: VERSION_INFORME, versionApp, generadoEn: new Date(fechaHoraMs).toISOString(), ...partes };
}

/** Nombre de archivo legible: factibilidad-<teléfono>-<fecha>.json */
export function nombreArchivoInforme(informe: InformeFactibilidad): string {
  const telefono = (informe.dispositivo?.modeloTelefono ?? 'telefono')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const fecha = informe.generadoEn.slice(0, 16).replace(/[:T]/g, '-');
  return `factibilidad-${telefono || 'telefono'}-${fecha}.json`;
}

/** Claves que nunca deben aparecer en un informe (privacidad). */
const CLAVES_PROHIBIDAS = ['latitud', 'longitud', 'latitude', 'longitude', 'imagen', 'datos'];

/** Devuelve las claves prohibidas encontradas en cualquier nivel del informe. */
export function clavesPrivadasEn(valor: unknown): string[] {
  const encontradas = new Set<string>();
  const recorrer = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(recorrer);
    else if (v && typeof v === 'object') {
      for (const [clave, hijo] of Object.entries(v)) {
        if (CLAVES_PROHIBIDAS.includes(clave)) encontradas.add(clave);
        recorrer(hijo);
      }
    }
  };
  recorrer(valor);
  return [...encontradas];
}
