import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

// Configuración de tests unitarios, separada de vite.config.ts para no
// cargar el plugin PWA. Por defecto el entorno es Node (lógica pura de
// src/core); los tests de UI declaran `// @vitest-environment happy-dom`.
export default defineConfig({
  plugins: [preact()],
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'spike/**/*.test.ts', 'tests/arquitectura/**/*.test.ts'],
    environment: 'node',
    restoreMocks: true,
  },
});
