# 0001 — Stack técnico

**Contexto.** PWA móvil para Chrome en Android, sin backend, con procesamiento pesado (IA) en un hilo aparte y una interfaz pequeña.

**Decisión.**

- **TypeScript estricto** (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`): la lógica de sensores es numérica y fácil de romper sin tipos.
- **Vite** + **`vite-plugin-pwa`** (Workbox) para el build, el manifiesto y el service worker.
- **Preact** para la interfaz: JSX, ~4 KB, suficiente para pocas pantallas.
- **Vitest** para lógica pura (entorno Node) y componentes (`happy-dom`); **Playwright** para pruebas de punta a punta contra la build de producción.
- **ESLint** (`typescript-eslint` estricto) + **Prettier**.
- **GitHub Actions** para el CI y **GitHub Pages** para publicar (da el HTTPS que exigen cámara, GPS y sensores).

**Consecuencias.** Un solo comando (`npm run verificar`) reproduce el CI en local. Las dependencias de las fases siguientes (`@huggingface/transformers`, `idb`, `leaflet`, `fflate`) se agregan recién cuando se usan.
