import { useEffect, useRef, useState } from 'preact/hooks';
import type { ConfigEstimador } from '../../src/core/puertos/profundidad';
import type { ImagenRGBA } from '../../src/core/puertos/imagen';
import type { ResultadoConfiguracion } from '../../src/core/factibilidad/benchmarkModelo';
import type { PruebaResistencia } from '../../src/core/factibilidad/informe';
import { resumirResistencia, type MuestraResistencia } from '../../src/core/factibilidad/resistencia';
import { resumir } from '../../src/core/estadisticas/resumen';
import { TAMANIOS_ENTRADA } from '../../src/core/vision/modelo';
import type { ServiciosSpike } from './servicios';
import { duracion, fps, ms, num } from './formato';

interface Props {
  readonly servicios: ServiciosSpike;
  readonly resultadosModelo: readonly ResultadoConfiguracion[];
  readonly hayWebGPU: boolean;
  readonly obtenerImagen: (lado: number) => ImagenRGBA;
  readonly prepararImagen: () => Promise<void>;
  readonly prueba: PruebaResistencia | null;
  readonly alTerminar: (prueba: PruebaResistencia) => void;
}

interface Estado {
  readonly transcurridoMs: number;
  readonly ultima: MuestraResistencia | null;
}

const esperarTurno = () => new Promise<void>((r) => setTimeout(r, 0));

export function SeccionResistencia(props: Props) {
  const { servicios, resultadosModelo, hayWebGPU, obtenerImagen, prepararImagen, prueba, alTerminar } = props;
  // Por defecto, la primera configuración que funcionó en la medición del modelo.
  const funcionaron = resultadosModelo.filter((r) => !r.error && r.porTamanio.some((t) => !t.error));
  const porDefecto: ConfigEstimador =
    funcionaron[0] ??
    (hayWebGPU ? { backend: 'webgpu', precision: 'fp16' } : { backend: 'wasm', precision: 'q8' });
  const [config, setConfig] = useState<ConfigEstimador>(porDefecto);
  const [tamanio, setTamanio] = useState<number>(TAMANIOS_ENTRADA[0]);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelado = useRef(false);
  useEffect(
    () => () => {
      cancelado.current = true;
    },
    [],
  );

  const correr = async () => {
    const { reloj, estimador, bateria, pantalla, tiempos } = servicios;
    cancelado.current = false;
    setError(null);
    setEstado({ transcurridoMs: 0, ultima: null });
    await prepararImagen();
    let pantallaActiva = await pantalla.activar();
    const dejarDeOir = pantalla.alCambiar((activa) => (pantallaActiva = activa));
    try {
      await estimador.cargar(config, () => undefined);
    } catch (e) {
      dejarDeOir();
      await pantalla.desactivar();
      setEstado(null);
      setError(e instanceof Error ? e.message : String(e));
      return;
    }

    const muestras: MuestraResistencia[] = [];
    let cuadros = 0;
    let tiemposCuadro: number[] = [];
    const inicio = reloj.ahoraMs();
    const tomarMuestra = async () => {
      const b = await bateria.leer();
      const muestra: MuestraResistencia = {
        t: reloj.ahoraMs(),
        nivelBateria: b?.nivel ?? null,
        cargando: b?.cargando ?? null,
        cuadros,
        msCuadroMediana: resumir(tiemposCuadro)?.mediana ?? null,
        pantallaActiva,
      };
      muestras.push(muestra);
      cuadros = 0;
      tiemposCuadro = [];
      setEstado({ transcurridoMs: muestra.t - inicio, ultima: muestra });
    };

    await tomarMuestra();
    let proxima = inicio + tiempos.resistenciaIntervaloMs;
    try {
      while (!cancelado.current && reloj.ahoraMs() - inicio < tiempos.resistenciaMs) {
        const t0 = reloj.ahoraMs();
        await estimador.estimar(obtenerImagen(tamanio));
        tiemposCuadro.push(reloj.ahoraMs() - t0);
        cuadros++;
        if (reloj.ahoraMs() >= proxima) {
          await tomarMuestra();
          proxima += tiempos.resistenciaIntervaloMs;
        }
        await esperarTurno();
      }
      await tomarMuestra();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      dejarDeOir();
      await pantalla.desactivar();
      await estimador.liberar().catch(() => undefined);
    }
    setEstado(null);
    alTerminar({ config, tamanio, resumen: resumirResistencia(muestras), muestras });
  };

  const opciones: ConfigEstimador[] = funcionaron.length
    ? funcionaron.map(({ backend, precision }) => ({ backend, precision }))
    : [porDefecto];
  const r = prueba?.resumen;

  return (
    <section aria-labelledby="t-resistencia">
      <h2 id="t-resistencia">5. Resistencia ({duracion(servicios.tiempos.resistenciaMs)})</h2>
      <p>
        Desconectá el cargador y dejá el teléfono al aire libre, en condiciones parecidas a las reales. La
        pantalla queda encendida y el modelo corre sin parar.
      </p>
      <div class="botones">
        <label>
          Configuración{' '}
          <select
            disabled={estado !== null}
            value={`${config.backend}-${config.precision}`}
            onChange={(e) => {
              const elegida = opciones.find((o) => `${o.backend}-${o.precision}` === e.currentTarget.value);
              if (elegida) setConfig(elegida);
            }}
          >
            {opciones.map((o) => (
              <option key={`${o.backend}-${o.precision}`} value={`${o.backend}-${o.precision}`}>
                {o.backend === 'webgpu' ? 'WebGPU' : 'WASM'} {o.precision}
              </option>
            ))}
          </select>
        </label>
        <label>
          Lado{' '}
          <select
            disabled={estado !== null}
            value={tamanio}
            onChange={(e) => setTamanio(Number(e.currentTarget.value))}
          >
            {TAMANIOS_ENTRADA.map((t) => (
              <option key={t} value={t}>
                {t} px
              </option>
            ))}
          </select>
        </label>
      </div>
      <div class="botones">
        {estado === null ? (
          <button type="button" onClick={correr}>
            Empezar prueba de resistencia
          </button>
        ) : (
          <button type="button" onClick={() => (cancelado.current = true)}>
            Terminar ahora
          </button>
        )}
      </div>
      {error && <p class="error">{error}</p>}
      {estado && (
        <p role="status">
          {duracion(estado.transcurridoMs)} de {duracion(servicios.tiempos.resistenciaMs)} · cuadro{' '}
          {ms(estado.ultima?.msCuadroMediana)} · batería{' '}
          {num(estado.ultima?.nivelBateria ? estado.ultima.nivelBateria * 100 : null, 0, '%')}
        </p>
      )}
      {r && (
        <dl class="datos" data-prueba="resultados-resistencia">
          <dt>Duración</dt>
          <dd>{num(r.duracionMin, 1, 'min')}</dd>
          <dt>Batería consumida</dt>
          <dd>
            {r.estuvoCargando
              ? 'estuvo cargando'
              : `${num(r.consumoPorcentual, 1, '%')} (${num(r.consumoPorHora, 1, '%/h')})`}
          </dd>
          <dt>Ritmo al inicio → al final</dt>
          <dd>
            {fps(r.msCuadroInicio)} → {fps(r.msCuadroFinal)} (caída {num(r.caidaRendimientoPct, 0, '%')})
          </dd>
          <dt>Pérdidas de pantalla encendida</dt>
          <dd>{r.perdidasPantalla}</dd>
        </dl>
      )}
    </section>
  );
}
