import type { CapacidadesDispositivo } from '../../src/core/puertos/dispositivo';
import type { InfoCamara } from '../../src/core/puertos/imagen';
import { num } from './formato';

interface Props {
  readonly capacidades: CapacidadesDispositivo | null;
  readonly camara: InfoCamara | null;
  readonly errorCamara: string | null;
  readonly alIniciarCamara: () => void;
}

const siNo = (v: boolean) => (v ? 'sí' : 'no');

export function SeccionDispositivo({ capacidades: c, camara, errorCamara, alIniciarCamara }: Props) {
  return (
    <section aria-labelledby="t-dispositivo">
      <h2 id="t-dispositivo">1. Dispositivo</h2>
      {!c ? (
        <p>Detectando…</p>
      ) : (
        <dl class="datos">
          <dt>Teléfono</dt>
          <dd>{c.modeloTelefono ?? 'desconocido'}</dd>
          <dt>Android</dt>
          <dd>{c.versionPlataforma ?? '—'}</dd>
          <dt>Navegador</dt>
          <dd>{c.navegador}</dd>
          <dt>Núcleos / memoria</dt>
          <dd>
            {c.nucleos ?? '—'} / {c.memoriaGB === null ? '—' : `${c.memoriaGB} GB`}
          </dd>
          <dt>WebGPU</dt>
          <dd data-prueba="webgpu">
            {c.webgpu.disponible
              ? `sí — ${[c.webgpu.fabricante, c.webgpu.arquitectura].filter(Boolean).join(' ') || 'GPU'}; fp16: ${siNo(c.webgpu.soportaF16)}`
              : 'no disponible'}
          </dd>
          <dt>WASM multihilo</dt>
          <dd>{c.aisladoOrigenCruzado ? 'sí' : 'no (un solo hilo)'}</dd>
        </dl>
      )}
      <h3>Cámara</h3>
      {camara ? (
        <p data-prueba="camara">
          {camara.anchoActual}×{camara.altoActual} en uso; máximo {camara.anchoMaximo ?? '—'}×
          {camara.altoMaximo ?? '—'} a {num(camara.fpsMaximo, 0, 'fps')}
        </p>
      ) : (
        <>
          {errorCamara && (
            <p class="error">No se pudo abrir la cámara: {errorCamara}. Se usa una imagen sintética.</p>
          )}
          <button type="button" onClick={alIniciarCamara}>
            Iniciar cámara
          </button>
        </>
      )}
    </section>
  );
}
