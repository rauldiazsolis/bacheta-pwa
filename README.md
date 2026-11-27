# Bacheta PWA — Relevamiento Autónomo de Estado Vial (Bici / A pie / Auto)

Progressive Web App (PWA) móvil (Android/Chrome) para relevar baches, veredas rotas, obstáculos y derrames cloacales/agua de forma segura ("manos libres y ojos en la calle") y generar evidencia técnica georreferenciada para reclamos ciudadanos.

Pensada y probada primero en **San Miguel de Tucumán, Argentina** (asfalto, adoquín/granito y calles de tierra).

> **Estado:** Fase 0 — base del proyecto. La app todavía no releva. Ver [`docs/plan.md`](docs/plan.md).
>
> **Probala:** https://rauldiazsolis.github.io/bacheta-pwa/ (Chrome en Android).

## Capacidades Principales (PoC)

1. **Seguridad y operación manos libres**
   - Inicio/pausa automática por velocidad GPS, con histéresis y un umbral por perfil (Bici, Caminando, Auto).
   - `Screen Wake Lock API` para mantener sensores y cámara activos, con pantalla negra para ahorrar batería.
   - Feedback auditivo (Web Audio API, tonos diferenciados) para no mirar nunca la pantalla.
2. **Detección multimodal (fusión independiente — `OR`, no `AND`)**
   - **Visión (3 líneas láser virtuales):** profundidad monocular en el navegador (`Transformers.js` + `Depth Anything V2 Small` sobre WebGPU, con respaldo WASM) evaluando 3 franjas de calzada delante del vehículo.
   - **Agua / derrames:** firma especular (baja textura + alto brillo) combinada con anomalías de profundidad.
   - **Sensores inerciales:** impactos verticales normalizados por velocidad y maniobras de esquive (desactivados en el perfil Caminando).
   - **Control Bluetooth en el manillar** (o botones en pantalla): botones asignables por perfil, con función "Detectar tecla".
3. **Evidencia y revisión:** foto por detección y pantalla para confirmar, descartar o reclasificar.
4. **Georreferenciación y persistencia offline:** proyección hacia adelante según rumbo, estimación entre lecturas GPS, agrupamiento espacial e `IndexedDB` 100 % local. Exportación a GeoJSON / CSV / ZIP y mapa Leaflet.
5. **Grabar y reproducir:** tramos crudos de 1–2 min (480p + sensores) que se reproducen idénticos en la PC para probar y ajustar sin salir a la calle.

## Fases de desarrollo

| Fase | Contenido                                                                                                                |
| ---- | ------------------------------------------------------------------------------------------------------------------------ |
| 0    | Base del proyecto: documentación, herramientas, CI y publicación en GitHub Pages.                                        |
| 0.5  | Factibilidad en teléfonos reales: velocidad del modelo, sensores, teclas del control, batería y calor.                   |
| 1    | Base PWA, sensores IMU/GPS, control, sonido, IndexedDB, foto de evidencia, grabación/reproducción, simulador y revisión. |
| 2    | Motor de visión (3 líneas + agua), calibración, fusión y evaluación de precisión.                                        |
| 3    | Mapa de evidencia, exportación y pulido de la interfaz.                                                                  |

Detalle completo en [`docs/plan.md`](docs/plan.md).

## Desarrollo

Requisitos: Node.js 22 o superior.

```bash
npm install
npm run dev          # servidor de desarrollo
npm test             # tests unitarios (Vitest)
npm run test:e2e     # tests de punta a punta (Playwright, requiere `npm run build`)
npm run verificar    # todo lo que corre el CI
```

Para probar en el teléfono contra el servidor de desarrollo hace falta HTTPS (cámara, GPS y sensores lo exigen); lo más simple es usar la versión publicada en GitHub Pages.

## Documentación

- [`docs/plan.md`](docs/plan.md) — plan por fases y criterios de cierre.
- [`docs/arquitectura.md`](docs/arquitectura.md) — capas, puertos y modos de ejecución.
- [`docs/algoritmos.md`](docs/algoritmos.md) — diseño de los algoritmos y umbrales iniciales.
- [`docs/decisiones/`](docs/decisiones/) — registro de decisiones técnicas.
- [`docs/factibilidad.md`](docs/factibilidad.md) — protocolo y resultados de la Fase 0.5.
- [`docs/compra-control.md`](docs/compra-control.md) — qué control Bluetooth comprar.

## Privacidad

Todo el procesamiento y el almacenamiento ocurren en el teléfono; no hay servidor propio. Las fotos pueden mostrar personas y patentes: las grabaciones reales nunca se suben a este repositorio público.

## Licencia

[MIT](LICENSE).
