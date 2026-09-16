import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Scripts de linha de comando imprimem progresso; testes controlam os spies de console.
    files: ['scripts/**', '**/__tests__/**', 'jest.setup.ts'],
    rules: { 'no-console': 'off' },
  },
  { ignores: ['.next/**', 'out/**', 'coverage/**', 'next-env.d.ts'] },
];

export default config;
