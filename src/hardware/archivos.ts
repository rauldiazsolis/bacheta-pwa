/** Descarga un texto como archivo (en Android queda en "Descargas"). */
export function descargarTexto(nombre: string, contenido: string, tipo = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Borra los archivos del modelo guardados por Transformers.js. Devuelve cuántas cachés borró. */
export async function borrarCacheModelo(): Promise<number> {
  if (!('caches' in globalThis)) return 0;
  const nombres = (await caches.keys()).filter((n) => /transformers/i.test(n));
  await Promise.all(nombres.map((n) => caches.delete(n)));
  return nombres.length;
}
