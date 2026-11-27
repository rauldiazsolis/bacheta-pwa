import type { CapacidadesDispositivo, DetectorCapacidades, InfoWebGPU } from '../core/puertos/dispositivo';

// Tipos mínimos de WebGPU y User-Agent Client Hints (no están en lib.dom).
interface AdaptadorGPU {
  readonly features: { has(nombre: string): boolean };
  readonly info?: {
    vendor?: string;
    architecture?: string;
    description?: string;
    isFallbackAdapter?: boolean;
  };
  readonly isFallbackAdapter?: boolean;
}
interface NavegadorExtendido {
  readonly userAgent: string;
  readonly hardwareConcurrency?: number;
  readonly deviceMemory?: number;
  readonly gpu?: { requestAdapter(opciones?: { powerPreference?: string }): Promise<AdaptadorGPU | null> };
  readonly userAgentData?: {
    getHighEntropyValues(pistas: string[]): Promise<{
      model?: string;
      platformVersion?: string;
      fullVersionList?: { brand: string; version: string }[];
    }>;
  };
}

const SIN_WEBGPU: InfoWebGPU = {
  disponible: false,
  fabricante: null,
  arquitectura: null,
  descripcion: null,
  soportaF16: false,
  esAdaptadorDeRespaldo: false,
};

const vacioANulo = (v: string | undefined): string | null => (v ? v : null);

export class CapacidadesNavegador implements DetectorCapacidades {
  constructor(
    private readonly nav: NavegadorExtendido = navigator as unknown as NavegadorExtendido,
    private readonly aislado: boolean = globalThis.crossOriginIsolated === true,
  ) {}

  async detectar(): Promise<CapacidadesDispositivo> {
    const [webgpu, pistas] = await Promise.all([this.detectarWebGPU(), this.leerPistas()]);
    const chrome = pistas?.fullVersionList?.find((m) => /chrom/i.test(m.brand) && !/not/i.test(m.brand));
    return {
      navegador: chrome ? `${chrome.brand} ${chrome.version}` : this.nav.userAgent,
      modeloTelefono: vacioANulo(pistas?.model),
      versionPlataforma: vacioANulo(pistas?.platformVersion),
      nucleos: this.nav.hardwareConcurrency ?? null,
      memoriaGB: this.nav.deviceMemory ?? null,
      aisladoOrigenCruzado: this.aislado,
      webgpu,
    };
  }

  private async leerPistas() {
    try {
      return (
        (await this.nav.userAgentData?.getHighEntropyValues([
          'model',
          'platformVersion',
          'fullVersionList',
        ])) ?? null
      );
    } catch {
      return null;
    }
  }

  private async detectarWebGPU(): Promise<InfoWebGPU> {
    try {
      const adaptador = await this.nav.gpu?.requestAdapter({ powerPreference: 'high-performance' });
      if (!adaptador) return SIN_WEBGPU;
      return {
        disponible: true,
        fabricante: vacioANulo(adaptador.info?.vendor),
        arquitectura: vacioANulo(adaptador.info?.architecture),
        descripcion: vacioANulo(adaptador.info?.description),
        soportaF16: adaptador.features.has('shader-f16'),
        esAdaptadorDeRespaldo: adaptador.info?.isFallbackAdapter ?? adaptador.isFallbackAdapter ?? false,
      };
    } catch {
      return SIN_WEBGPU;
    }
  }
}
