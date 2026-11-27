import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import paquete from './package.json' with { type: 'json' };

// La app se publica en GitHub Pages bajo /bacheta-pwa/.
const BASE = '/bacheta-pwa/';

export default defineConfig({
  base: BASE,
  define: { __VERSION_APP__: JSON.stringify(paquete.version) },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['iconos/favicon.svg'],
      manifest: {
        name: 'Bacheta — Relevamiento vial',
        short_name: 'Bacheta',
        description:
          'Relevamiento autónomo de baches, veredas rotas y derrames de agua, manos libres y sin conexión.',
        lang: 'es-AR',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: 'iconos/icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'iconos/icono-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'iconos/icono-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Toma control de la página en la primera visita para que quede
        // disponible sin conexión de inmediato.
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
    }),
  ],
});
