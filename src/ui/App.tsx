import { DESCRIPCION_TIPOS, tiposMarcables } from '../core/tipos/tipoProblema';

export interface PropsApp {
  /** Versión de la app, inyectada desde la composición. */
  readonly version: string;
}

/**
 * Pantalla inicial provisoria (Fase 0). Solo confirma que la PWA carga,
 * se instala y funciona sin conexión.
 */
export function App({ version }: PropsApp) {
  return (
    <main class="pantalla">
      <h1>Bacheta</h1>
      <p class="subtitulo">Relevamiento vial manos libres</p>
      <p>
        Esta es la base del proyecto (Fase 0). Todavía no releva: en las próximas fases se suman sensores,
        cámara y mapa.
      </p>
      <h2>Qué vas a poder registrar</h2>
      <ul>
        {tiposMarcables().map((tipo) => (
          <li key={tipo}>{DESCRIPCION_TIPOS[tipo].etiqueta}</li>
        ))}
      </ul>
      <p class="version">Versión {version}</p>
    </main>
  );
}
