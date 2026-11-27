# Directivas de Ingeniería — Proyecto `bacheta-pwa`

## 1. Flujo de Trabajo Obligatorio (Plan-First & Human-in-the-Loop)

- **NO escribas código de aplicación antes de tener un plan aprobado.**
- **Paso 1 (Análisis y Preguntas):** Lee `README.md`. Si existen ambigüedades técnicas o decisiones de diseño abiertas (ej. framework frontend, bundler como Vite, librería de modelos ONNX/Transformers.js), formula una lista breve y concreta de preguntas antes de continuar.
- **Paso 2 (Plan Detallado):** Propón la arquitectura del proyecto, la estructura de archivos y el plan de ejecución dividido por las fases del `README.md`, indicando qué se probará en cada paso. **Detente y espera confirmación explícita** antes de crear el repositorio o escribir código.
- **Paso 3 (Ejecución Incremental):** Implementa **una sola fase a la vez**. Al terminar cada fase, ejecuta toda la suite de tests, verifica que pasen al 100%, haz commit con mensaje descriptivo en español y pide revisión/aprobación antes de pasar a la siguiente fase.

## 2. Reglas Estrictas de Testing y Calidad

- **Testing obligatorio en cada fase:** Ninguna fase se considera terminada sin tests automatizados (ej. Vitest / Playwright).
- **Qué testear sí o sí:**
  - Lógica pura: normalización de impacto Z por velocidad, cálculo de proyección GPS hacia adelante, clustering espacial (< 1.5 m), máquina de estados del botón Bluetooth (1 clic vs. doble clic), detección de anomalías sobre arreglos simulados de las 3 líneas láser y detección de reflejos de agua.
  - Simulación sin hardware: incluir un modo "Simulador / Demo" en la web para poder probar toda la app desde una PC de escritorio (simulando recorrido GPS, golpes en Z y videos de calle) sin necesidad de estar en una bicicleta.
- **Clean Code y Modularidad:** Separar estrictamente la lógica matemática/sensores (`src/core/`) de las APIs del navegador (`src/hardware/`) y la interfaz (`src/ui/`).

## 3. Decisiones Técnicas y Restricciones

- **Repositorio:** Debe crearse como repositorio **público** en GitHub llamado `bacheta-pwa`.
- **Arquitectura 100% Client-Side:** Sin backend propio. Todo procesamiento (incluyendo IA de profundidad con WebGPU/WebGL) y almacenamiento (`IndexedDB`) ocurre en el navegador del dispositivo.
- **Idioma:** Toda la documentación, comentarios en código, commits, interfaz de usuario y comunicación deben estar en **español**.

## 4. Convenciones Operativas (acordadas en la Fase 0)

- **Plan vigente:** `docs/plan.md`. Algoritmos y umbrales: `docs/algoritmos.md`. Decisiones: `docs/decisiones/`.
- **Capas (verificadas por ESLint y por `tests/arquitectura/`):**
  - `src/core/` — lógica pura. Sin `window`, `navigator`, `document`, `fetch`, `Date`, `performance`, etc.: todo entra por un puerto (`src/core/puertos/`), incluido el reloj.
  - `src/hardware/` — adaptadores reales de APIs del navegador (incluye IndexedDB).
  - `src/simulacion/` — implementaciones sintéticas y reproducción de grabaciones.
  - `src/workers/` — hilos aparte (visión).
  - `src/ui/` — Preact; no importa de `src/hardware/`.
  - `src/app/composicion.ts` — único lugar donde se eligen implementaciones (`real` | `reproduccion` | `simulacion`). Sin librería de inyección.
- **Nombres:** español en el dominio (`calcularSeveridad`); inglés solo donde lo imponen las APIs.
- **Ramas:** una rama `fase-N` por fase, PR hacia `main`, cierre con CI verde + aprobación del dueño.
- **Comando de verificación completa antes de cada commit de cierre:** `npm run verificar`.
- **Privacidad:** las grabaciones reales de la calle nunca se versionan (`grabaciones/` está en `.gitignore`). En el repo solo hay datos sintéticos.
