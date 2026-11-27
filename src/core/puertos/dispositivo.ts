import type { Cancelar } from './comunes';

export interface EstadoBateria {
  /** Nivel entre 0 y 1. */
  readonly nivel: number;
  readonly cargando: boolean;
}

export interface Bateria {
  /** Devuelve null si el navegador no expone la batería. */
  leer(): Promise<EstadoBateria | null>;
}

export interface PantallaEncendida {
  /** Pide mantener la pantalla encendida. Devuelve false si no se pudo. */
  activar(): Promise<boolean>;
  desactivar(): Promise<void>;
  /** Avisa cada vez que el bloqueo se pierde o se recupera. */
  alCambiar(alCambiar: (activa: boolean) => void): Cancelar;
}

export interface InfoWebGPU {
  readonly disponible: boolean;
  readonly fabricante: string | null;
  readonly arquitectura: string | null;
  readonly descripcion: string | null;
  /** Si la GPU soporta operaciones en fp16 (`shader-f16`). */
  readonly soportaF16: boolean;
  readonly esAdaptadorDeRespaldo: boolean;
}

export interface CapacidadesDispositivo {
  readonly navegador: string;
  readonly modeloTelefono: string | null;
  readonly versionPlataforma: string | null;
  readonly nucleos: number | null;
  readonly memoriaGB: number | null;
  /** Sin aislamiento de origen cruzado, WASM corre en un solo hilo. */
  readonly aisladoOrigenCruzado: boolean;
  readonly webgpu: InfoWebGPU;
}

export interface DetectorCapacidades {
  detectar(): Promise<CapacidadesDispositivo>;
}
