import { EXEMPLOS } from '@/engine/exemplos';
import { buildTrace } from '@/engine/programa';
import type { Step, Trace } from '@/engine/types';

export function traceDoExemplo(id: string): Trace {
  const exemplo = EXEMPLOS.find((item) => item.id === id);
  if (!exemplo) {
    throw new Error(`exemplo ${id} inexistente`);
  }
  const resultado = buildTrace(exemplo.entrada);
  if (!resultado.ok) {
    throw new Error(resultado.erro);
  }
  return resultado.trace;
}

/** Primeiro passo que satisfaz o predicado (falha o teste se não existir). */
export function passoOnde(trace: Trace, predicado: (passo: Step) => boolean): Step {
  const passo = trace.passos.find(predicado);
  if (!passo) {
    throw new Error('passo não encontrado');
  }
  return passo;
}
