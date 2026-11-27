import { useEffect, useRef, useState } from 'preact/hooks';
import { analizarTeclas } from '../../src/core/control/analizadorTeclas';
import type { EventoTecla } from '../../src/core/puertos/teclas';
import type { PruebaTeclas } from '../../src/core/factibilidad/informe';
import type { ServiciosSpike } from './servicios';
import { ms } from './formato';

interface Props {
  readonly servicios: ServiciosSpike;
  readonly pruebas: readonly PruebaTeclas[];
  readonly alTerminar: (prueba: PruebaTeclas) => void;
}

export function SeccionTeclas({ servicios, pruebas, alTerminar }: Props) {
  const [bloquear, setBloquear] = useState(false);
  const [eventos, setEventos] = useState<readonly EventoTecla[] | null>(null);
  const cancelar = useRef<(() => void) | null>(null);
  useEffect(() => () => cancelar.current?.(), []);

  const empezar = (evento: Event) => {
    // Un control Bluetooth manda Enter: si un botón queda con foco, Enter lo
    // "aprieta". Se quita el foco para que la tecla solo llegue al detector.
    (evento.currentTarget as HTMLElement | null)?.blur();
    setEventos([]);
    cancelar.current = servicios.teclas.escuchar((e) => setEventos((lista) => [...(lista ?? []), e]), {
      bloquearAccionPorDefecto: bloquear,
    });
  };
  const terminar = () => {
    cancelar.current?.();
    cancelar.current = null;
    alTerminar({ bloquearAccionPorDefecto: bloquear, detectadas: analizarTeclas(eventos ?? []) });
    setEventos(null);
  };

  const ultima = eventos?.filter((e) => e.tipo === 'pulsar').at(-1);
  const enVivo = eventos ? analizarTeclas(eventos) : [];
  const detectadasTotales = pruebas.flatMap((p) =>
    p.detectadas.map((d) => ({ ...d, bloqueo: p.bloquearAccionPorDefecto })),
  );

  return (
    <section aria-labelledby="t-teclas">
      <h2 id="t-teclas">4. Detectar tecla</h2>
      <p>
        Tocá «Empezar», apretá cada botón (volumen, control Bluetooth) dos o tres veces y anotá si cambió el
        volumen. Repetí con «Bloquear acción por defecto» para ver si Chrome deja de cambiar el volumen.
      </p>
      <label>
        <input
          type="checkbox"
          checked={bloquear}
          disabled={eventos !== null}
          onChange={(e) => setBloquear(e.currentTarget.checked)}
        />{' '}
        Bloquear acción por defecto
      </label>
      <div class="botones">
        {eventos === null ? (
          <button type="button" onClick={empezar}>
            Empezar a detectar
          </button>
        ) : (
          <button type="button" onClick={terminar}>
            Terminar
          </button>
        )}
      </div>
      {eventos !== null && (
        <p class="tecla-grande" role="status" aria-live="polite">
          {ultima ? `${ultima.key} · ${ultima.code || 'sin code'}` : 'Esperando un botón…'}
          <small> ({enVivo.reduce((s, t) => s + t.pulsaciones, 0)} pulsaciones)</small>
        </p>
      )}
      {detectadasTotales.length > 0 && (
        <div class="tabla">
          <table data-prueba="resultados-teclas">
            <thead>
              <tr>
                <th>key</th>
                <th>code</th>
                <th>Pulsaciones</th>
                <th>Repeticiones</th>
                <th>Sin soltar</th>
                <th>Duración</th>
                <th>Bloqueo</th>
              </tr>
            </thead>
            <tbody>
              {detectadasTotales.map((t, i) => (
                <tr key={i}>
                  <td>{t.key}</td>
                  <td>{t.code || '—'}</td>
                  <td>{t.pulsaciones}</td>
                  <td>{t.repeticiones}</td>
                  <td>{t.sinSoltar}</td>
                  <td>{ms(t.duracionMedianaMs)}</td>
                  <td>{t.bloqueo ? 'sí' : 'no'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
