// Genera los PNG del manifiesto a partir de public/iconos/favicon.svg
// usando el Chromium de Playwright. Los PNG generados se versionan.
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const svg = await readFile('public/iconos/favicon.svg', 'utf8');
const salidas = [
  { nombre: 'icono-192.png', lado: 192, escala: 1 },
  { nombre: 'icono-512.png', lado: 512, escala: 1 },
  // Maskable: el dibujo ocupa el 80 % central (zona segura) sobre fondo negro.
  { nombre: 'icono-maskable-512.png', lado: 512, escala: 0.8 },
];

const navegador = await chromium.launch();
try {
  for (const { nombre, lado, escala } of salidas) {
    const pagina = await navegador.newPage({ viewport: { width: lado, height: lado } });
    const interior = Math.round(lado * escala);
    await pagina.setContent(
      `<body style="margin:0;background:#000;display:grid;place-items:center;height:${lado}px">
         <div style="width:${interior}px;height:${interior}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div>
       </body>`,
    );
    await pagina.screenshot({ path: `public/iconos/${nombre}` });
    await pagina.close();
    console.log(`generado public/iconos/${nombre}`);
  }
} finally {
  await navegador.close();
}
