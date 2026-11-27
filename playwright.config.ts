import { defineConfig, devices } from '@playwright/test';

const PUERTO = 4173;

// Los tests de punta a punta corren contra la build de producción
// (`vite preview`), que es lo que se publica en GitHub Pages.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PUERTO}/bacheta-pwa/`,
    locale: 'es-AR',
  },
  projects: [{ name: 'android-chrome', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: `npx vite preview --port ${PUERTO} --strictPort`,
    url: `http://localhost:${PUERTO}/bacheta-pwa/`,
    reuseExistingServer: !process.env.CI,
  },
});
