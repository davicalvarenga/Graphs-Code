import type { EstadoGrafo } from './types';

const EULERIANO: Record<string, string> = {
  ciclo: 'ciclo euleriano',
  caminho: 'caminho euleriano',
};

/** Frase final: o que o programa concluiu sobre o grafo. */
export function resumoFinal(estado: EstadoGrafo): string {
  const { v, e, resultados } = estado;
  const partes: string[] = [`Grafo com ${v} vértice(s) e ${e} aresta(s).`];

  const classificacoes = [
    resultados.completo ? 'completo' : null,
    resultados.ciclo ? 'ciclo' : null,
    resultados.roda ? `roda de centro ${resultados.centro}` : null,
    resultados.euleriano ? EULERIANO[resultados.euleriano] ?? null : null,
    resultados.bipartido ? 'bipartido' : null,
  ].filter((item): item is string => item !== null);

  partes.push(classificacoes.length > 0 ? `É ${classificacoes.join(', ')}.` : 'Não é completo, ciclo, roda, euleriano nem bipartido.');
  partes.push(`${resultados.triangulos.length} triângulo(s) e ${resultados.cliques.length} clique(s) {u} ∪ N(u).`);
  if (resultados.conexo !== undefined) {
    partes.push(resultados.conexo ? 'Conexo: há caminho entre todo par de vértices.' : 'Não conexo: há vértices sem caminho entre si.');
  }
  return partes.join(' ');
}
