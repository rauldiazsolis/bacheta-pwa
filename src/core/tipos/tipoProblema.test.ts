import { describe, expect, it } from 'vitest';
import { DESCRIPCION_TIPOS, TIPOS_PROBLEMA, esTipoProblema, tiposMarcables } from './tipoProblema';

describe('catálogo de tipos de problema', () => {
  it('tiene una descripción con etiqueta para cada tipo', () => {
    for (const tipo of TIPOS_PROBLEMA) {
      expect(DESCRIPCION_TIPOS[tipo].etiqueta.length).toBeGreaterThan(0);
    }
  });

  it('valida valores desconocidos', () => {
    expect(esTipoProblema('bache')).toBe(true);
    expect(esTipoProblema('vereda-rota')).toBe(true);
    expect(esTipoProblema('pozo')).toBe(false);
    expect(esTipoProblema(3)).toBe(false);
    expect(esTipoProblema(undefined)).toBe(false);
  });

  it('el esquive solo lo genera el detector, no se marca a mano', () => {
    expect(tiposMarcables()).toEqual(['bache', 'agua', 'vereda-rota', 'obstaculo']);
  });
});
