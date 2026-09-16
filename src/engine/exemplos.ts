// Exemplos prontos para o formulário e casos fixos dos testes golden.
// Arquivo sem imports para poder ser carregado direto pelo Node (scripts/gen-golden.mjs).

export interface EntradaPrograma {
  vertices: string;
  arestas: string;
  matriz: string;
}

export interface Exemplo {
  id: string;
  nome: string;
  descricao: string;
  entrada: EntradaPrograma;
  /** Entrada propositalmente inválida, para mostrar a validação do programa C. */
  invalido?: true;
}

/** Monta o texto da matriz de incidência (uma linha por vértice) a partir de uma lista de arestas. */
export function matrizDeArestas(v: number, arestas: ReadonlyArray<readonly [number, number]>): string {
  const linhas: string[] = [];
  for (let vertice = 0; vertice < v; vertice++) {
    linhas.push(arestas.map(([a, b]) => (a === vertice || b === vertice ? '1' : '0')).join(' '));
  }
  return linhas.join('\n');
}

function deArestas(v: number, arestas: ReadonlyArray<readonly [number, number]>): EntradaPrograma {
  return { vertices: String(v), arestas: String(arestas.length), matriz: matrizDeArestas(v, arestas) };
}

/** Converte os três campos no fluxo de stdin lido pelos scanf do programa C. */
export function paraStdin(entrada: EntradaPrograma): string {
  return `${entrada.vertices}\n${entrada.arestas}\n${entrada.matriz}\n`;
}

export const EXEMPLOS: readonly Exemplo[] = [
  {
    id: 'roda-w5',
    nome: 'Roda W5',
    descricao: 'Centro 0 ligado a um ciclo 1-2-3-4.',
    entrada: deArestas(5, [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 3], [3, 4], [1, 4]]),
  },
  {
    id: 'completo-k4',
    nome: 'Completo K4',
    descricao: 'Todo par de vértices é adjacente. Também é roda (centro = último vértice de grau 3).',
    entrada: deArestas(4, [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]),
  },
  {
    id: 'ciclo-c5',
    nome: 'Ciclo C5',
    descricao: 'Todos os vértices com grau 2 e conexos.',
    entrada: deArestas(5, [[0, 1], [1, 2], [2, 3], [3, 4], [0, 4]]),
  },
  {
    id: 'bipartido-k23',
    nome: 'Bipartido K2,3',
    descricao: 'Partições X = {0, 1} e Y = {2, 3, 4}; possui caminho euleriano.',
    entrada: deArestas(5, [[0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4]]),
  },
  {
    id: 'caminho-p4',
    nome: 'Caminho P4',
    descricao: 'Dois vértices de grau ímpar: caminho euleriano, sem ciclo.',
    entrada: deArestas(4, [[0, 1], [1, 2], [2, 3]]),
  },
  {
    id: 'triangulo-isolado',
    nome: 'Triângulo + isolado',
    descricao: 'Vértice isolado não impede o ciclo euleriano.',
    entrada: deArestas(4, [[0, 1], [1, 2], [0, 2]]),
  },
  {
    id: 'desconexo',
    nome: 'Desconexo',
    descricao: 'Duas arestas disjuntas: não euleriano.',
    entrada: deArestas(5, [[0, 1], [2, 3]]),
  },
  {
    id: 'sem-arestas',
    nome: 'Sem arestas',
    descricao: 'e = 0: nenhuma matriz é lida.',
    entrada: { vertices: '3', arestas: '0', matriz: '' },
  },
  {
    id: 'erro-paralelas',
    nome: 'arestas paralelas',
    invalido: true,
    descricao: 'As colunas e0 e e2 são idênticas.',
    entrada: { vertices: '3', arestas: '3', matriz: '1 0 1\n1 1 1\n0 1 0' },
  },
  {
    id: 'erro-coluna',
    nome: 'aresta com 3 vértices',
    invalido: true,
    descricao: 'A aresta e1 incide em três vértices.',
    entrada: { vertices: '3', arestas: '2', matriz: '1 1\n1 1\n0 1' },
  },
  {
    id: 'erro-valor',
    nome: 'valor 2 na matriz',
    invalido: true,
    descricao: 'A matriz só aceita 0 ou 1.',
    entrada: { vertices: '2', arestas: '1', matriz: '1\n2' },
  },
  {
    id: 'erro-vertices',
    nome: '21 vértices',
    invalido: true,
    descricao: 'Fora do intervalo 1..20.',
    entrada: { vertices: '21', arestas: '0', matriz: '' },
  },
];
