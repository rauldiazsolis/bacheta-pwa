import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

// Verifica que las reglas de capas de eslint.config.js se aplican de verdad:
// si alguien las rompe o las borra, este test falla.
const eslint = new ESLint();

async function erroresDe(codigo: string, archivo: string): Promise<string[]> {
  const [resultado] = await eslint.lintText(codigo, { filePath: archivo });
  return (resultado?.messages ?? []).map((m) => m.ruleId ?? m.message);
}

describe('reglas de capas', () => {
  it('src/core no puede usar APIs del navegador', async () => {
    const errores = await erroresDe('export const v = navigator.userAgent;\n', 'src/core/x.ts');
    expect(errores).toContain('no-restricted-globals');
  });

  it('src/core no puede leer el reloj del sistema directamente', async () => {
    const errores = await erroresDe('export const t = Date.now();\n', 'src/core/x.ts');
    expect(errores).toContain('no-restricted-globals');
  });

  it('src/core no puede importar de hardware ni de ui', async () => {
    const codigo =
      "import { a } from '../hardware/a';\nimport { b } from '../ui/b';\nexport const c = [a, b];\n";
    const errores = await erroresDe(codigo, 'src/core/x.ts');
    expect(errores.filter((e) => e === 'no-restricted-imports')).toHaveLength(2);
  });

  it('src/ui no puede importar de hardware', async () => {
    const errores = await erroresDe(
      "import { a } from '../hardware/a';\nexport const b = a;\n",
      'src/ui/x.ts',
    );
    expect(errores).toContain('no-restricted-imports');
  });

  it('el código puro de core pasa sin errores', async () => {
    const errores = await erroresDe('export const doble = (n: number): number => n * 2;\n', 'src/core/x.ts');
    expect(errores).toEqual([]);
  });
});
