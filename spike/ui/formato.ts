/** Formato de números para las tablas. `null` o no finito se muestra como "—". */
export function num(valor: number | null | undefined, decimales = 1, unidad = ''): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—';
  const texto = valor.toLocaleString('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
  return unidad ? `${texto} ${unidad}` : texto;
}

export const ms = (valor: number | null | undefined) => num(valor, 0, 'ms');
export const megabytes = (bytes: number | null | undefined) =>
  num(bytes === null || bytes === undefined ? null : bytes / 1e6, 1, 'MB');
export const fps = (msPorCuadro: number | null | undefined) =>
  num(msPorCuadro ? 1000 / msPorCuadro : null, 1, 'fps');

export function duracion(totalMs: number): string {
  const s = Math.max(0, Math.round(totalMs / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
