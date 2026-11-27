# 0003 — Modelo de profundidad y su descarga

**Contexto.** Se necesita profundidad monocular en el teléfono. Licencias: Depth Anything V2 **Small** es Apache-2.0; Base y Large son CC-BY-NC (no se usan). MiDaS es MIT.

**Decisión.**

- **Depth Anything V2 Small** con Transformers.js, en un Web Worker.
- **fp16 (~50 MB)** si hay WebGPU; **q8 (~27 MB)** si se cae a WASM. Se descarga solo el formato que corresponde, más el motor (~20–25 MB).
- Descarga desde el CDN de Hugging Face la primera vez y caché local (Cache Storage) para uso sin conexión. No es un backend propio.
- MiDaS small como plan B. El detector queda detrás del puerto `DetectorVisual` para poder probar después un detector entrenado (p. ej. YOLO-nano).

**Tiempos estimados de descarga** (a medir en la Fase 0.5): wifi ~50 Mbps: 8–12 s; 4G 10–25 Mbps: 16–60 s; 4G débil ~3 Mbps: 2–4 min.

**Hallazgos al implementar la Fase 0.5.**

- La entrada debe ser múltiplo de 14 px (parches del modelo): se evalúan **252 y 392 px** en lugar de 256.
- El preprocesamiento (escalado, normalización ImageNet, C × H × W) se hace en `src/core/vision/preprocesamiento.ts`, no en el procesador de Transformers.js, para controlar el tamaño de entrada y poder testearlo.
- Transformers.js no convierte la entrada a float16: si un modelo fp16 la exige, el worker lo detecta en el primer cuadro y reintenta en float16.
- Vite empaqueta el motor WASM de ONNX Runtime (~27 MB, ~7 MB comprimido) y lo sirve desde el mismo origen, sin depender de un CDN.
- **GitHub Pages no permite enviar las cabeceras COOP/COEP**, así que la página no queda con aislamiento de origen cruzado y **WASM corre en un solo hilo**. La Fase 0.5 lo mide tal cual; si WASM resulta decisivo (Redmi 4G), en la Fase 2 se evaluará agregar esas cabeceras desde el service worker.

**Consecuencias.** El primer ingreso muestra progreso y recomienda wifi. En el Redmi Note 12 Pro 4G (Adreno 618, probablemente sin WebGPU) se esperan 0,3–1 fps: si no alcanza, ese teléfono funciona con sensores y botón manual.
