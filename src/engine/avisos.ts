import type { EntradaPrograma } from './exemplos';

const INTEIRO = /^[+-]?\d+$/;

/**
 * Dicas de preenchimento exibidas no formulário. NÃO fazem parte do programa C:
 * a execução continua permitida para que o estudante veja o caminho de erro real.
 */
export function avisosDeEntrada(entrada: EntradaPrograma): string[] {
  const v = entrada.vertices.trim();
  const e = entrada.arestas.trim();

  if (!INTEIRO.test(v)) {
    return ['Vértices: informe um único número inteiro.'];
  }
  const nv = Number(v);
  if (nv < 1 || nv > 20) {
    return ['Vértices: o programa aceita de 1 a 20.'];
  }
  if (!INTEIRO.test(e)) {
    return ['Arestas: informe um único número inteiro.'];
  }
  const ne = Number(e);
  const maximo = (nv * (nv - 1)) / 2;
  if (ne < 0 || ne > maximo) {
    return [`Arestas: com ${nv} vértice(s) o máximo é ${maximo}.`];
  }

  const avisos: string[] = [];
  const tokens = entrada.matriz.split(/\s+/).filter(Boolean);
  const esperados = nv * ne;
  if (tokens.length !== esperados) {
    avisos.push(`Matriz: esperados ${nv}×${ne} = ${esperados} valores, recebidos ${tokens.length}.`);
  }
  if (tokens.some((token) => token !== '0' && token !== '1')) {
    avisos.push('Matriz: há valores diferentes de 0 e 1.');
  }
  return avisos;
}
