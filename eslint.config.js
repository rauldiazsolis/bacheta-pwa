import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

// Reglas de capas (ver docs/arquitectura.md):
//  - src/core: lógica pura. Prohibido usar APIs del navegador o importar
//    de otras capas.
//  - src/ui: no accede directo al hardware; recibe todo armado desde src/app.
const capasProhibidasEnCore = [
  '**/hardware/**',
  '**/ui/**',
  '**/app/**',
  '**/simulacion/**',
  '**/workers/**',
];

export default tseslint.config(
  { ignores: ['dist/', 'dev-dist/', 'node_modules/', 'playwright-report/', 'test-results/'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['*.{js,ts,mjs}', 'scripts/**'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['src/core/**/*.ts'],
    languageOptions: { globals: { ...globals.es2023 } },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: capasProhibidasEnCore, message: 'src/core no puede depender de otras capas.' },
            { group: ['preact', 'preact/*'], message: 'src/core no puede depender de la UI.' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'indexedDB', 'localStorage', 'fetch', 'performance'].map(
          (name) => ({
            name,
            message: `src/core es lógica pura: inyectá "${name}" a través de un puerto.`,
          }),
        ),
      ],
      // Formatear una fecha recibida está permitido; leer el reloj del sistema, no.
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'src/core es lógica pura: usá el puerto Reloj en lugar de Date.now().',
        },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'src/core es lógica pura: usá el puerto Reloj en lugar de new Date().',
        },
      ],
    },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}', 'spike/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/hardware/**'], message: 'La UI recibe el hardware desde src/app/composicion.ts.' },
          ],
        },
      ],
    },
  },
);
