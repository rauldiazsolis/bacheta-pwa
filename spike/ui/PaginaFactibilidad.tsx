import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { CapacidadesDispositivo } from '../../src/core/puertos/dispositivo';
import type { ImagenRGBA, InfoCamara } from '../../src/core/puertos/imagen';
import type { ResultadoConfiguracion } from '../../src/core/factibilidad/benchmarkModelo';
import type { MedicionSensores, PruebaResistencia, PruebaTeclas } from '../../src/core/factibilidad/informe';
import type { ServiciosSpike } from './servicios';
import { SeccionDispositivo } from './SeccionDispositivo';
import { SeccionModelo } from './SeccionModelo';
import { SeccionSensores } from './SeccionSensores';
import { SeccionTeclas } from './SeccionTeclas';
import { SeccionResistencia } from './SeccionResistencia';
import { SeccionExportar } from './SeccionExportar';

/**
 * Página de mediciones de la Fase 0.5. Cada sección mide una cosa y deja su
 * resultado acá; la última exporta todo junto. Protocolo: docs/factibilidad.md.
 */
export function PaginaFactibilidad({ servicios }: { readonly servicios: ServiciosSpike }) {
  const [capacidades, setCapacidades] = useState<CapacidadesDispositivo | null>(null);
  const [camara, setCamara] = useState<InfoCamara | null>(null);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);
  const [modelo, setModelo] = useState<readonly ResultadoConfiguracion[]>([]);
  const [sensores, setSensores] = useState<readonly MedicionSensores[]>([]);
  const [teclas, setTeclas] = useState<readonly PruebaTeclas[]>([]);
  const [resistencia, setResistencia] = useState<PruebaResistencia | null>(null);
  const camaraIntentada = useRef(false);

  useEffect(() => {
    void servicios.capacidades.detectar().then(setCapacidades);
    return () => servicios.camara.detener();
  }, [servicios]);

  const iniciarCamara = useCallback(async () => {
    camaraIntentada.current = true;
    try {
      setCamara(await servicios.camara.iniciar());
      setErrorCamara(null);
    } catch (e) {
      setErrorCamara(e instanceof Error ? e.message : String(e));
    }
  }, [servicios]);

  /** Antes de medir, intenta una vez abrir la cámara; si no se puede, se usa la imagen sintética. */
  const prepararImagen = useCallback(async () => {
    if (!camaraIntentada.current) await iniciarCamara();
  }, [iniciarCamara]);

  const obtenerImagen = useCallback(
    (lado: number): ImagenRGBA => servicios.camara.capturar(lado, lado) ?? servicios.imagenSintetica(lado),
    [servicios],
  );

  const hayWebGPU = capacidades?.webgpu.disponible ?? false;

  return (
    <main class="pantalla">
      <h1>Bacheta · Factibilidad</h1>
      <p class="subtitulo">
        Fase 0.5 — versión {servicios.versionApp}
        {servicios.modo === 'simulacion' && <strong> · MODO SIMULACIÓN</strong>}
      </p>
      <p>Seguí el protocolo de docs/factibilidad.md. Al final, descargá el informe y adjuntalo al PR.</p>
      <SeccionDispositivo
        capacidades={capacidades}
        camara={camara}
        errorCamara={errorCamara}
        alIniciarCamara={() => void iniciarCamara()}
      />
      {capacidades && (
        <SeccionModelo
          servicios={servicios}
          hayWebGPU={hayWebGPU}
          obtenerImagen={obtenerImagen}
          prepararImagen={prepararImagen}
          resultados={modelo}
          alTerminar={setModelo}
        />
      )}
      <SeccionSensores
        servicios={servicios}
        mediciones={sensores}
        alTerminar={(m) => setSensores((l) => [...l, m])}
      />
      <SeccionTeclas servicios={servicios} pruebas={teclas} alTerminar={(p) => setTeclas((l) => [...l, p])} />
      {capacidades && (
        <SeccionResistencia
          servicios={servicios}
          resultadosModelo={modelo}
          hayWebGPU={hayWebGPU}
          obtenerImagen={obtenerImagen}
          prepararImagen={prepararImagen}
          prueba={resistencia}
          alTerminar={setResistencia}
        />
      )}
      <SeccionExportar
        servicios={servicios}
        partes={{ dispositivo: capacidades, camara, modelo, sensores, teclas, resistencia }}
      />
    </main>
  );
}
