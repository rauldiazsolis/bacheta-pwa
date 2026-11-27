import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

// Recorre toda la página de factibilidad en modo simulación: modelo simulado,
// cámara falsa de Chromium, GPS emulado y eventos de movimiento sintéticos.
test.use({
  permissions: ['geolocation', 'camera'],
  geolocation: { latitude: -26.8303, longitude: -65.2038, accuracy: 8 },
  launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
});

test('la página de factibilidad mide todo y exporta un informe sin datos privados', async ({ page }) => {
  await page.goto('./spike/?modo=simulacion');
  await expect(page.getByRole('heading', { level: 1, name: 'Bacheta · Factibilidad' })).toBeVisible();
  await expect(page.getByText('MODO SIMULACIÓN')).toBeVisible();
  await expect(page.locator('[data-prueba="webgpu"]')).toBeVisible();

  // 1. Cámara (dispositivo falso de Chromium).
  await page.getByRole('button', { name: 'Iniciar cámara' }).click();
  await expect(page.locator('[data-prueba="camara"]')).toContainText('en uso');

  // 2. Modelo simulado.
  await page.getByRole('button', { name: 'Medir modelo' }).click();
  const tablaModelo = page.locator('[data-prueba="resultados-modelo"]');
  await expect(tablaModelo).toBeVisible({ timeout: 20_000 });
  await expect(tablaModelo).toContainText('WASM q8');
  await expect(tablaModelo).toContainText('392');
  await expect(tablaModelo).toContainText('fps');

  // 3. Sensores: se inyectan eventos devicemotion a ~60 Hz durante la medición.
  await page.evaluate(() => {
    const id = setInterval(() => {
      const e = Object.assign(new Event('devicemotion'), {
        acceleration: { x: 0, y: 0, z: 0 },
        accelerationIncludingGravity: { x: 0.1, y: 9.8, z: 0.2 },
        rotationRate: { alpha: 0, beta: 0, gamma: 0 },
        interval: 16,
      });
      window.dispatchEvent(e);
    }, 16);
    setTimeout(() => clearInterval(id), 10_000);
  });
  await page.getByRole('button', { name: /Medir: quieto/ }).click();
  const tablaSensores = page.locator('[data-prueba="resultados-sensores"]');
  await expect(tablaSensores).toBeVisible({ timeout: 10_000 });
  await expect(tablaSensores).toContainText('Hz');
  await expect(tablaSensores).toContainText('8 m');

  // 4. Teclas.
  await page.getByRole('button', { name: 'Empezar a detectar' }).click();
  await page.keyboard.press('Enter');
  await page.keyboard.press('PageDown');
  await expect(page.getByRole('status').filter({ hasText: 'PageDown' })).toBeVisible();
  await page.getByRole('button', { name: 'Terminar' }).click();
  const tablaTeclas = page.locator('[data-prueba="resultados-teclas"]');
  await expect(tablaTeclas).toContainText('Enter');
  await expect(tablaTeclas).toContainText('PageDown');

  // 5. Resistencia (3 s en simulación).
  await page.getByRole('button', { name: 'Empezar prueba de resistencia' }).click();
  await expect(page.locator('[data-prueba="resultados-resistencia"]')).toBeVisible({ timeout: 15_000 });

  // 6. Exportar.
  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar informe JSON' }).click();
  const archivo = await descarga;
  expect(archivo.suggestedFilename()).toMatch(/^factibilidad-.+\.json$/);
  const texto = await readFile(await archivo.path(), 'utf8');
  const informe = JSON.parse(texto);
  expect(informe).toMatchObject({ version: 1, camara: { anchoActual: expect.any(Number) } });
  expect(informe.modelo[0].porTamanio.map((t: { tamanio: number }) => t.tamanio)).toEqual([252, 392]);
  expect(informe.sensores[0].resumen.movimiento.hz).toBeGreaterThan(20);
  expect(informe.sensores[0].resumen.gps.precisionM.mediana).toBe(8);
  expect(informe.teclas[0].detectadas.map((t: { key: string }) => t.key)).toEqual(['Enter', 'PageDown']);
  expect(informe.resistencia.muestras.length).toBeGreaterThanOrEqual(3);
  // Privacidad: ni coordenadas ni imágenes.
  expect(texto).not.toContain('-26.83');
  expect(texto).not.toContain('-65.20');
  expect(texto).not.toMatch(/"(latitud|longitud|datos)"/);
});

test('la página de factibilidad abre aunque la app ya tenga el service worker activo', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.goto('./spike/?modo=simulacion');
  await expect(page.getByRole('heading', { level: 1, name: 'Bacheta · Factibilidad' })).toBeVisible();
});
