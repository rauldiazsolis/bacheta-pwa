# 0002 — Inversión de dependencias con raíz de composición manual

**Contexto.** Se quiere poder intercambiar cualquier componente (hardware real, reproducción, simulación; un detector visual por otro). Se evaluó una librería de inyección de dependencias (p. ej. `hardwired`), que funciona en el navegador.

**Decisión.** Interfaces (puertos) en `src/core/puertos/` y un único archivo, `src/app/composicion.ts`, que elige las implementaciones según el modo (`real`, `reproduccion`, `simulacion`). Sin librería.

**Motivos.** La app es chica y no necesita ámbitos anidados; ningún contenedor cruza la frontera de un Web Worker, que de todos modos se arma a mano; los tests pasan dobles por parámetro sin configuración extra. El reloj también es un puerto, lo que hace deterministas la reproducción y los tests de tiempo.

**Consecuencias.** ESLint prohíbe en `src/core/` los globales del navegador (incluido `Date`) y las importaciones de otras capas; un test verifica que esa regla siga activa.
