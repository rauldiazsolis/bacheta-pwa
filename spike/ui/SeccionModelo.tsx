import { useState } from 'preact/hooks';
import type { ConfigEstimador } from '../../src/core/puertos/profundidad';
import {
  configuracionesPosibles,
  medirModelo,
  type AvanceBenchmark,
  type ResultadoConfiguracion,
} from '../../src/core/factibilidad/benchmarkModelo';
import { TAMANIOS_ENTRADA } from '../../src/core/vision/modelo';
import type { ServiciosSpike } from './servicios';
import { fps, megabytes, ms, num } from './formato';

interface Props {
  readonly servicios: ServiciosSpike;
  readonly hayWebGPU: boolean;
  readonly obtenerImagen: (lado: number) => ReturnType<ServiciosSpike['imagenSintetica']>;
  readonly prepararImagen: () => Promise<void>;
  readonly resultados: readonly ResultadoConfiguracion[];
  readonly alTerminar: (resultados: ResultadoConfiguracion[]) => void;
}

const clave = (c: ConfigEstimador) => `${c.backend}-${c.precision}`;
const nombre = (c: ConfigEstimador) => `${c.backend === 'webgpu' ? 'WebGPU' : 'WASM'} ${c.precision}`;

function describirAvance(a: AvanceBenchmark): string {
  if (a.etapa === 'cargando') {
    return `Cargando ${nombre(a.config)}: ${megabytes(a.bytes)} de ${megabytes(a.total)}`;
  }
  return `Midiendo ${nombre(a.config)} a ${a.tamanio} px: cuadro ${a.cuadro} de ${a.de}`;
}

export function SeccionModelo({
  servicios,
  hayWebGPU,
  obtenerImagen,
  prepararImagen,
  resultados,
  alTerminar,
}: Props) {
  const posibles = configuracionesPosibles(hayWebGPU);
  const [elegidas, setElegidas] = useState<ReadonlySet<string>>(() => new Set(posibles.map(clave)));
  const [avance, setAvance] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const alternar = (k: string) =>
    setElegidas((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(k)) nuevo.delete(k);
      else nuevo.add(k);
      return nuevo;
    });

  const medir = async () => {
    setAviso(null);
    setAvance('Preparando…');
    await prepararImagen();
    const r = await medirModelo({
      estimador: servicios.estimador,
      reloj: servicios.reloj,
      obtenerImagen,
      configuraciones: posibles.filter((c) => elegidas.has(clave(c))),
      tamanios: TAMANIOS_ENTRADA,
      cuadros: servicios.tiempos.cuadrosBenchmark,
      alAvanzar: (a) => setAvance(describirAvance(a)),
    });
    setAvance(null);
    alTerminar(r);
  };

  const borrar = async () => {
    const n = await servicios.borrarCacheModelo();
    setAviso(n ? 'Modelo borrado: la próxima medición vuelve a descargarlo.' : 'No había modelo guardado.');
  };

  return (
    <section aria-labelledby="t-modelo">
      <h2 id="t-modelo">2. Modelo de profundidad</h2>
      <p>
        Medilo con wifi. La primera vez descarga el modelo; para volver a medir la descarga, borralo antes.
      </p>
      <fieldset>
        <legend>Configuraciones</legend>
        {posibles.map((c) => (
          <label key={clave(c)}>
            <input type="checkbox" checked={elegidas.has(clave(c))} onChange={() => alternar(clave(c))} />{' '}
            {nombre(c)}
          </label>
        ))}
      </fieldset>
      <div class="botones">
        <button type="button" onClick={medir} disabled={avance !== null || elegidas.size === 0}>
          Medir modelo
        </button>
        <button type="button" class="secundario" onClick={borrar} disabled={avance !== null}>
          Borrar modelo descargado
        </button>
      </div>
      {avance && <p role="status">{avance}</p>}
      {aviso && <p role="status">{aviso}</p>}
      {resultados.length > 0 && (
        <div class="tabla">
          <table data-prueba="resultados-modelo">
            <thead>
              <tr>
                <th>Config.</th>
                <th>Carga</th>
                <th>Descarga</th>
                <th>Lado</th>
                <th>1.er cuadro</th>
                <th>Mediana</th>
                <th>p95</th>
                <th>Ritmo</th>
              </tr>
            </thead>
            <tbody>
              {resultados.flatMap((r) =>
                r.error || r.porTamanio.length === 0 ? (
                  <tr key={clave(r)}>
                    <td>{nombre(r)}</td>
                    <td colSpan={7} class="error">
                      {r.error ?? 'cancelado'}
                    </td>
                  </tr>
                ) : (
                  r.porTamanio.map((t, i) => (
                    <tr key={`${clave(r)}-${t.tamanio}`}>
                      <td>{i === 0 ? nombre(r) : ''}</td>
                      <td>{i === 0 ? ms(r.cargaMs) : ''}</td>
                      <td>
                        {i === 0 && r.descarga
                          ? `${megabytes(r.descarga.bytes)} · ${num(r.descarga.mbps, 1, 'Mbps')}`
                          : ''}
                      </td>
                      <td>{t.tamanio}</td>
                      <td>{ms(t.primerCuadroMs)}</td>
                      <td>{ms(t.resumen?.mediana)}</td>
                      <td>{ms(t.resumen?.p95)}</td>
                      <td>{t.error ? <span class="error">{t.error}</span> : fps(t.resumen?.mediana)}</td>
                    </tr>
                  ))
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
