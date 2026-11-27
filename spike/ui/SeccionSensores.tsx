import { useEffect, useRef, useState } from 'preact/hooks';
import { AcumuladorSensores } from '../../src/core/factibilidad/medicionSensores';
import type { MedicionSensores } from '../../src/core/factibilidad/informe';
import type { ServiciosSpike } from './servicios';
import { duracion, num } from './formato';

interface Props {
  readonly servicios: ServiciosSpike;
  readonly mediciones: readonly MedicionSensores[];
  readonly alTerminar: (medicion: MedicionSensores) => void;
}

const TEXTO: Record<MedicionSensores['escenario'], string> = {
  quieto: 'Quieto (apoyado en una mesa)',
  caminando: 'Caminando al aire libre',
};

export function SeccionSensores({ servicios, mediciones, alTerminar }: Props) {
  const [enCurso, setEnCurso] = useState<{
    escenario: MedicionSensores['escenario'];
    restanteMs: number;
  } | null>(null);
  const cancelar = useRef<(() => void) | null>(null);
  useEffect(() => () => cancelar.current?.(), []);

  const medir = (escenario: MedicionSensores['escenario']) => {
    const { reloj } = servicios;
    const totalMs =
      escenario === 'quieto' ? servicios.tiempos.sensoresQuietoMs : servicios.tiempos.sensoresCaminandoMs;
    const inicio = reloj.ahoraMs();
    const acc = new AcumuladorSensores(inicio);
    const pararMovimiento = servicios.movimiento.escuchar((l) => acc.agregarMovimiento(l));
    const pararGPS = servicios.gps.escuchar(
      (l) => acc.agregarGPS(l),
      (motivo) => acc.agregarErrorGPS(motivo),
    );
    const intervalo = setInterval(() => {
      const transcurrido = reloj.ahoraMs() - inicio;
      if (transcurrido < totalMs) {
        setEnCurso({ escenario, restanteMs: totalMs - transcurrido });
        return;
      }
      detener();
      alTerminar({ escenario, resumen: acc.resumen(reloj.ahoraMs()) });
    }, 250);
    const detener = () => {
      clearInterval(intervalo);
      pararMovimiento();
      pararGPS();
      cancelar.current = null;
      setEnCurso(null);
    };
    cancelar.current = detener;
    setEnCurso({ escenario, restanteMs: totalMs });
  };

  return (
    <section aria-labelledby="t-sensores">
      <h2 id="t-sensores">3. Sensores y GPS</h2>
      <p>No se guardan coordenadas: solo frecuencia, precisión y velocidad.</p>
      <div class="botones">
        {(['quieto', 'caminando'] as const).map((e) => (
          <button key={e} type="button" disabled={enCurso !== null} onClick={() => medir(e)}>
            Medir: {TEXTO[e].toLowerCase()}
          </button>
        ))}
      </div>
      {enCurso && (
        <p role="status">
          Midiendo «{TEXTO[enCurso.escenario]}»: faltan {duracion(enCurso.restanteMs)}{' '}
          <button type="button" class="secundario" onClick={() => cancelar.current?.()}>
            Cancelar
          </button>
        </p>
      )}
      {mediciones.length > 0 && (
        <div class="tabla">
          <table data-prueba="resultados-sensores">
            <thead>
              <tr>
                <th>Escenario</th>
                <th>Movimiento</th>
                <th>Giroscopio</th>
                <th>Ruido |a|</th>
                <th>GPS</th>
                <th>Precisión mediana</th>
                <th>Vel. máx.</th>
              </tr>
            </thead>
            <tbody>
              {mediciones.map(({ escenario, resumen: { movimiento: m, gps: g } }, i) => (
                <tr key={i}>
                  <td>{TEXTO[escenario]}</td>
                  <td>
                    {num(m.hz, 0, 'Hz')} ({m.lecturas})
                  </td>
                  <td>{m.tieneGiroscopio ? 'sí' : 'no'}</td>
                  <td>{num(m.moduloConGravedad?.desvio, 2, 'm/s²')}</td>
                  <td>
                    {g.errores.length ? (
                      <span class="error">{g.errores.join('; ')}</span>
                    ) : (
                      `${num(g.hz, 1, 'Hz')} (${g.lecturas})`
                    )}
                  </td>
                  <td>{num(g.precisionM?.mediana, 0, 'm')}</td>
                  <td>{num(g.velocidadMaximaKmh, 1, 'km/h')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
