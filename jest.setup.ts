import '@testing-library/jest-dom';

// Qualquer console.error/console.warn durante um teste é tratado como falha:
// garante que o app não emita avisos do React (keys, act, props inválidas etc.).
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    throw new Error(`console.error inesperado: ${args.map(String).join(' ')}`);
  });
  jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    throw new Error(`console.warn inesperado: ${args.map(String).join(' ')}`);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});
