import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from '../ui/App';
import { componerAplicacion } from './composicion';
import '../ui/estilos.css';

const aplicacion = componerAplicacion('real', __VERSION_APP__);

// El service worker cachea la app para que funcione sin conexión.
registerSW({ immediate: true });

const raiz = document.getElementById('app');
if (!raiz) throw new Error('No se encontró el elemento #app');
render(<App version={aplicacion.version} />, raiz);
