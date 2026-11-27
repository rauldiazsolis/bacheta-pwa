# Arquitectura

Bacheta es 100 % client-side: no hay servidor propio. Todo el procesamiento (incluida la IA) y el almacenamiento ocurren en el navegador del teléfono.

## Capas

```
          ┌──────────────────── src/app/composicion.ts ────────────────────┐
          │  arma la app en modo:  real | reproduccion | simulacion         │
          └───────┬───────────────────────┬────────────────────────┬───────┘
                  │                       │                        │
   src/hardware/ (APIs reales)   src/simulacion/ (sintético   src/ui/ (Preact)
   GPS, sensores, cámara,         + reproducción de            pantallas, sin
   teclado, sonido, pantalla      grabaciones)                 lógica de negocio
   encendida, IndexedDB,                 │                        ▲
   grabadora                             │                        │ estado
                  └──────────┬───────────┘                        │
                             ▼  (implementan los puertos)         │
                  src/core/  ← lógica pura, sin APIs del navegador
                  sesión → [movimiento | visión | botones] → fusión
                         → georreferencia → agrupamiento → repositorio
                             ▲
                  src/workers/vision.worker.ts (modelo + líneas + agua)
```

| Carpeta           | Responsabilidad                                                   | Puede importar de            |
| ----------------- | ----------------------------------------------------------------- | ---------------------------- |
| `src/core/`       | Lógica pura de dominio: tipos, puertos (interfaces), algoritmos.  | Solo `src/core/`             |
| `src/hardware/`   | Adaptadores que implementan los puertos con APIs del navegador.   | `src/core/`                  |
| `src/simulacion/` | Implementaciones sintéticas y reproducción de grabaciones.        | `src/core/`                  |
| `src/workers/`    | Código que corre en Web Workers (visión).                         | `src/core/`, `src/hardware/` |
| `src/ui/`         | Componentes Preact. Reciben estado y acciones; no tocan hardware. | `src/core/`                  |
| `src/app/`        | Raíz de composición y punto de entrada.                           | Todo                         |

Las reglas se verifican automáticamente: ESLint (`eslint.config.js`) prohíbe en `src/core/` los globales del navegador (`window`, `navigator`, `document`, `fetch`, `indexedDB`, `localStorage`, `performance`, `Date`) y las importaciones de otras capas; prohíbe en `src/ui/` importar de `src/hardware/`. `tests/arquitectura/capas.test.ts` comprueba que esas reglas sigan activas.

## Puertos

Cada dependencia externa se modela como una interfaz en `src/core/puertos/` (se crean a partir de la Fase 0.5/1). Lista prevista:

| Puerto                 | Real (`src/hardware/`)                         | Simulado / reproducción                                |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `Reloj`                | `performance.now()` + `Date.now()`             | reloj manual controlado por el test o por la grabación |
| `FuenteGPS`            | `navigator.geolocation.watchPosition`          | recorrido sintético / grabación                        |
| `FuenteMovimiento`     | `DeviceMotionEvent` / `DeviceOrientationEvent` | golpes sintéticos / grabación                          |
| `FuenteCamara`         | `getUserMedia`                                 | video de archivo / imágenes sintéticas                 |
| `FuenteTeclas`         | `keydown` / `keyup` + botones en pantalla      | secuencias programadas / grabación                     |
| `EstimadorProfundidad` | Transformers.js en Web Worker                  | mapas de profundidad sintéticos                        |
| `DetectorVisual`       | 3 líneas + agua sobre el estimador             | — (se intercambia por otro detector, p. ej. YOLO)      |
| `Repositorio`          | IndexedDB (`idb`)                              | en memoria / `fake-indexeddb`                          |
| `Sonido`               | Web Audio API                                  | registro de tonos emitidos                             |
| `PantallaEncendida`    | Screen Wake Lock API                           | no-op                                                  |
| `Grabadora`            | `MediaRecorder` + registro de sensores         | —                                                      |

## Modos de ejecución

- **`real`:** hardware del teléfono.
- **`reproduccion`:** una grabación cruda (video 480p + sensores con marcas de tiempo) alimenta todos los puertos de entrada, con el reloj sincronizado a la grabación. El resultado es determinista: la misma grabación produce siempre las mismas detecciones.
- **`simulacion`:** datos sintéticos (recorrido GPS, golpes en Z, imágenes y mapas de profundidad) para probar desde la PC.

La elección ocurre solo en `src/app/composicion.ts`, sin librería de inyección de dependencias: la app es chica, no necesita ámbitos anidados y los Web Workers se arman a mano de todos modos.

## Almacenamiento

IndexedDB local con `navigator.storage.persist()`. El modelo de IA se guarda en Cache Storage tras la primera descarga. Nada sale del teléfono salvo las exportaciones que el usuario descarga explícitamente.
