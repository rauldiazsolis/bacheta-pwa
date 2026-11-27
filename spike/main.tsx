/**
 * Raíz de composición de la página de factibilidad. `?modo=simulacion`
 * reemplaza el modelo real por uno simulado y acorta las pruebas (tests de
 * punta a punta y prueba desde la PC).
 */
import { render } from 'preact';
import { relojNavegador } from '../src/hardware/relojNavegador';
import { CapacidadesNavegador } from '../src/hardware/capacidadesNavegador';
import { CamaraNavegador } from '../src/hardware/camaraNavegador';
import { EstimadorProfundidadWorker } from '../src/hardware/estimadorProfundidadWorker';
import { MovimientoNavegador } from '../src/hardware/movimientoNavegador';
import { GPSNavegador } from '../src/hardware/gpsNavegador';
import { TecladoNavegador } from '../src/hardware/tecladoNavegador';
import { BateriaNavegador } from '../src/hardware/bateriaNavegador';
import { PantallaEncendidaNavegador } from '../src/hardware/pantallaEncendidaNavegador';
import { borrarCacheModelo, descargarTexto } from '../src/hardware/archivos';
import { EstimadorSimulado } from '../src/simulacion/estimadorSimulado';
import { imagenCalleSintetica } from '../src/simulacion/imagenSintetica';
import { PaginaFactibilidad } from './ui/PaginaFactibilidad';
import type { ServiciosSpike } from './ui/servicios';
import './ui/estilos.css';

const simulacion = new URLSearchParams(location.search).get('modo') === 'simulacion';
const reloj = relojNavegador;

const servicios: ServiciosSpike = {
  modo: simulacion ? 'simulacion' : 'real',
  versionApp: __VERSION_APP__,
  reloj,
  capacidades: new CapacidadesNavegador(),
  camara: new CamaraNavegador(),
  estimador: simulacion ? new EstimadorSimulado({ msPorCuadro252: 20 }) : EstimadorProfundidadWorker.crear(),
  movimiento: new MovimientoNavegador(reloj),
  gps: new GPSNavegador(reloj),
  teclas: new TecladoNavegador(reloj),
  bateria: new BateriaNavegador(),
  pantalla: new PantallaEncendidaNavegador(),
  imagenSintetica: (lado) => imagenCalleSintetica(lado, lado),
  descargar: descargarTexto,
  borrarCacheModelo,
  tiempos: simulacion
    ? {
        sensoresQuietoMs: 2_000,
        sensoresCaminandoMs: 2_000,
        resistenciaMs: 3_000,
        resistenciaIntervaloMs: 500,
        cuadrosBenchmark: 3,
      }
    : {
        sensoresQuietoMs: 30_000,
        sensoresCaminandoMs: 60_000,
        resistenciaMs: 20 * 60_000,
        resistenciaIntervaloMs: 10_000,
        cuadrosBenchmark: 20,
      },
};

const raiz = document.getElementById('app');
if (!raiz) throw new Error('No se encontró el elemento #app');
render(<PaginaFactibilidad servicios={servicios} />, raiz);
