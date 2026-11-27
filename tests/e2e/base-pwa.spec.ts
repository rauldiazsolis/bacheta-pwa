import { expect, test } from '@playwright/test';

test.describe('base de la PWA (Fase 0)', () => {
  test('carga la pantalla inicial en español', async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveTitle('Bacheta');
    await expect(page.getByRole('heading', { level: 1, name: 'Bacheta' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-AR');
    await expect(page.getByText(/^Versión \d+\.\d+\.\d+$/)).toBeVisible();
  });

  test('publica un manifiesto instalable', async ({ page }) => {
    await page.goto('./');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    if (!href) throw new Error('Falta <link rel="manifest">');
    const respuesta = await page.request.get(new URL(href, page.url()).toString());
    expect(respuesta.ok()).toBe(true);
    const manifiesto = await respuesta.json();
    expect(manifiesto).toMatchObject({
      short_name: 'Bacheta',
      lang: 'es-AR',
      display: 'standalone',
      start_url: '/bacheta-pwa/',
    });
    const tamanios = manifiesto.icons.map((icono: { sizes: string }) => icono.sizes);
    expect(tamanios).toEqual(expect.arrayContaining(['192x192', '512x512']));
    for (const icono of manifiesto.icons as { src: string }[]) {
      const img = await page.request.get(new URL(icono.src, respuesta.url()).toString());
      expect(img.ok(), `ícono ${icono.src}`).toBe(true);
    }
  });

  test('funciona sin conexión gracias al service worker', async ({ page, context }) => {
    await page.goto('./');
    // Espera a que el service worker esté activo y controlando la página.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolver) =>
          navigator.serviceWorker.addEventListener('controllerchange', resolver, { once: true }),
        );
      }
    });

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Bacheta' })).toBeVisible();
  });
});
