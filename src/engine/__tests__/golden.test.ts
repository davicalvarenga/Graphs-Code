import casos from '../../../tests/golden/casos.json';
import { executar } from '../programa';

interface CasoGolden {
  id: string;
  stdin: string;
  stdout: string;
  exitCode: number;
}

const lista = casos as CasoGolden[];

describe('fidelidade ao programa C (saídas geradas pelo gcc)', () => {
  it.each(lista.map((caso) => [caso.id, caso] as const))('%s', (_id, caso) => {
    const trace = executar(caso.stdin, 0);
    expect(trace.stdout).toBe(caso.stdout);
    expect(trace.exitCode).toBe(caso.exitCode);
  });

  it('gravar passos (nível 3) não altera a saída', () => {
    for (const caso of lista.filter((c) => c.id !== 'k20')) {
      expect(executar(caso.stdin, 3).stdout).toBe(caso.stdout);
    }
  });
});
