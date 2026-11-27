# Plan del proyecto

Plan aprobado al cierre de la Fase 0 de planificación. Los cambios posteriores se registran en [`decisiones/`](decisiones/).

## Decisiones cerradas

| Tema                      | Decisión                                                                                                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Teléfonos                 | **Moto Edge 40** (Dimensity 8020, Android 15): referencia con WebGPU. **Redmi Note 12 Pro 4G** (Snapdragon 732G, Android 13): caso sin WebGPU, usa q8 en WASM. Moto G100 opcional. Chrome 158.                             |
| Perfiles                  | **Bici** (principal), **Caminando** (arranque 2,5 km/h + 8 m recorridos + precisión GPS ≤ 15 m; sin detector de impactos ni de esquives), **Auto** (mismos detectores que Bici con otros umbrales; sin validar en la PoC). |
| Tipos                     | `bache`, `agua`, `vereda-rota`, `obstaculo` y `esquive` (solo automático). Cada perfil asigna qué tipo marca cada botón.                                                                                                   |
| Control                   | "Detectar tecla", doble clic a 400 ms, mantener = deshacer la última marca, 2 botones en pantalla de respaldo.                                                                                                             |
| Teléfono en la mano       | Las líneas se recalculan en cada cuadro con la gravedad; la visión se suspende (con tono) si la cámara apunta fuera de rango; se descartan cuadros movidos.                                                                |
| Inversión de dependencias | Puertos en `src/core/puertos/` + raíz de composición manual (`src/app/composicion.ts`) con modos `real`, `reproduccion` y `simulacion`. Sin librería.                                                                      |
| Stack                     | TypeScript estricto, Vite, `vite-plugin-pwa`, Preact, Transformers.js en Web Worker, `idb`, Leaflet, `fflate`.                                                                                                             |
| Tests                     | Vitest (+ `fake-indexeddb`, `happy-dom`) y Playwright (cámara falsa de Chromium y GPS simulado). CI en GitHub Actions.                                                                                                     |
| Publicación               | GitHub Pages en cada push a `main`. Repo público, licencia MIT.                                                                                                                                                            |
| Grabación cruda           | Máximo 2 minutos en 480p; exportable como un solo archivo para el simulador.                                                                                                                                               |
| Idioma                    | Español en todo; nombres del dominio en español.                                                                                                                                                                           |
| Objetivo de la PoC        | ≥ 70 % de baches de más de 30 cm detectados a 10–20 km/h, con ≤ 1 falso positivo por km después de la revisión, sobre un recorrido grabado y etiquetado.                                                                   |

## Forma de trabajo

- Una rama `fase-N` por fase y un PR hacia `main`.
- Una fase se cierra con `npm run verificar` y el CI al 100 % y con la aprobación del PR por el dueño del proyecto.
- Commits en español.

## Fases

### Fase 0 — Base del proyecto

- **Entregables:** repo público con `docs/`; Vite, TypeScript, ESLint, Prettier, Vitest, Playwright; CI y publicación en Pages; PWA mínima instalable y offline.
- **Tests:** unitario del catálogo de tipos, de la pantalla inicial y de las reglas de capas; de punta a punta: carga, manifiesto e íconos, funcionamiento sin conexión.
- **Cierre:** la URL de Pages abre en el Edge 40 y se puede instalar.

### Fase 0.5 — Factibilidad en los teléfonos

- **Entregables:** página `/spike/` que mide y exporta a JSON:
  - velocidad del modelo (WebGPU / WASM, fp16 / q8, 252 / 392 px (múltiplos de 14); mediana y p95);
  - frecuencia del sensor de movimiento, frecuencia y precisión del GPS, resolución de la cámara;
  - "Detectar tecla" (botones de volumen y cualquier control disponible);
  - prueba de 20 minutos de pantalla encendida, batería y calor;
  - tiempo real de descarga del modelo.
  - Los adaptadores de hardware de esta fase se reutilizan en la 1.
- **Tests:** unitarios de estadísticas y del analizador de teclas; las mediciones se corren a mano con el protocolo de [`factibilidad.md`](factibilidad.md).
- **Cierre:** `factibilidad.md` completo para ambos teléfonos y parámetros de la Fase 2 ajustados.

### Fase 1 — Base PWA, sensores, control, grabación y revisión

- **Entregables:** perfiles y arranque/pausa con histéresis; detector de impactos (gravedad, línea base adaptativa, severidad) y de esquive; control (1 clic, 2 clics, mantener, asignación por perfil, detectar tecla, botones en pantalla); tonos; pantalla encendida y pantalla negra; proyección hacia adelante, estimación entre lecturas GPS y agrupamiento; IndexedDB persistente; foto de evidencia; grabación cruda, reproductor y simulador sintético; pantalla de revisión.
- **Tests unitarios:** normalización por velocidad (incluido el piso con v → 0); línea base sobre adoquín simulado; doble clic, clic simple, mantener y repetición de teclas con reloj falso; histéresis por perfil incluida la deriva del GPS quieto; proyección y estimación contra valores calculados a mano; agrupamiento dentro de una pasada y entre pasadas; IndexedDB con `fake-indexeddb`; grabar → reproducir da lo mismo.
- **De punta a punta:** simulador → detecciones → revisión; la misma sesión reproducida da exactamente las mismas detecciones.
- **Al cerrar:** 3–4 grabaciones reales de 2 minutos (asfalto con baches conocidos, adoquín sin baches, un charco, caminando con el teléfono en la mano), fuera del repo.

### Fase 2 — Motor de visión

- **Entregables:** worker de visión con selección de formato, descarga con progreso y caché; geometría de cámara; 3 líneas trapezoidales y pantalla de calibración; ajuste del plano del suelo y anomalías por franja con confirmación entre cuadros; detector de agua con interruptor de lluvia; fusión con confianza; reducción automática de cuadros por calor; filtro de nitidez; simulador con videos y mapas de profundidad sintéticos; script de evaluación de precisión sobre grabaciones etiquetadas.
- **Tests:** geometría (filas a 1,5 / 2,5 / 3,5 m); anomalías sobre arreglos simulados (suelo plano, bache, cordón, ruido); agua sobre imágenes sintéticas con casos negativos (sombra, pintura vial); fusión; protocolo del worker con estimador falso; de punta a punta con cámara falsa y video sintético; prueba manual opcional con el modelo real.

### Fase 3 — Mapa, exportación y pulido

- **Entregables:** mapa Leaflet con filtros por tipo, fuente, estado y sesión; unión de sesiones; exportación GeoJSON, CSV y ZIP con fotos; interfaz de alto contraste con botón gigante de "Detener"; primer ingreso guiado; aviso de privacidad; manual de usuario.
- **Tests:** validación del GeoJSON y CSV; filtros y unión de sesiones; de punta a punta grabar (simulado) → revisar → mapa → exportar.
