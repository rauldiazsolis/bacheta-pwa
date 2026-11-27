import { useState } from 'preact/hooks';
import {
  clavesPrivadasEn,
  crearInforme,
  nombreArchivoInforme,
  type PartesInforme,
} from '../../src/core/factibilidad/informe';
import type { ServiciosSpike } from './servicios';

interface Props {
  readonly servicios: ServiciosSpike;
  readonly partes: PartesInforme;
}

export function SeccionExportar({ servicios, partes }: Props) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const estado = [
    ['Modelo', partes.modelo.length > 0],
    ['Sensores', partes.sensores.length > 0],
    ['Teclas', partes.teclas.length > 0],
    ['Resistencia', partes.resistencia !== null],
  ] as const;

  const exportar = () => {
    const informe = crearInforme(partes, servicios.versionApp, servicios.reloj.fechaHoraMs());
    const privadas = clavesPrivadasEn(informe);
    if (privadas.length) {
      setMensaje(`No se exporta: el informe contiene datos privados (${privadas.join(', ')}).`);
      return;
    }
    const nombre = nombreArchivoInforme(informe);
    servicios.descargar(nombre, JSON.stringify(informe, null, 2));
    setMensaje(`Descargado «${nombre}». Adjuntalo al PR de la Fase 0.5.`);
  };

  return (
    <section aria-labelledby="t-exportar">
      <h2 id="t-exportar">6. Exportar</h2>
      <ul class="lista-estado">
        {estado.map(([nombre, listo]) => (
          <li key={nombre}>
            {listo ? '✔' : '○'} {nombre}
          </li>
        ))}
      </ul>
      <button type="button" onClick={exportar}>
        Descargar informe JSON
      </button>
      {mensaje && <p role="status">{mensaje}</p>}
    </section>
  );
}
