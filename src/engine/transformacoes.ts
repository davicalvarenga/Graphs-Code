import { lineOf } from '@/c-source/source';
import { comCelula, comItem, InvarianteError, type Recorder } from './recorder';
import type { Matriz } from './types';

const IA = {
  assinatura: lineOf('incidenciaParaAdjacencia', 'void incidenciaParaAdjacencia'),
  inicio: lineOf('incidenciaParaAdjacencia', 'int u = -1;'),
  teste: lineOf('incidenciaParaAdjacencia', 'if(g->incidencia[vertice][aresta] == 1)'),
  primeiro: lineOf('incidenciaParaAdjacencia', 'u = vertice;'),
  segundo: lineOf('incidenciaParaAdjacencia', 'w = vertice;'),
  uw: lineOf('incidenciaParaAdjacencia', 'g->adjacencia[u][w] = 1;'),
  wu: lineOf('incidenciaParaAdjacencia', 'g->adjacencia[w][u] = 1;'),
};

const AL = {
  assinatura: lineOf('adjacenciaParaLista', 'void adjacenciaParaLista'),
  lacoU: lineOf('adjacenciaParaLista', 'for (int u = 0'),
  teste: lineOf('adjacenciaParaLista', 'if(g->adjacencia[u][w] == 1)'),
  malloc: lineOf('adjacenciaParaLista', 'struct No *novo'),
  vertice: lineOf('adjacenciaParaLista', 'novo->vertice = w;'),
  prox: lineOf('adjacenciaParaLista', 'novo->prox = g->listaAdjacencia[u];'),
  cabeca: lineOf('adjacenciaParaLista', 'g->listaAdjacencia[u] = novo;'),
};

const IM = {
  cabecalho: lineOf('imprimirMatriz', 'printf("\\n");', 1),
  linha: lineOf('imprimirMatriz', 'printf("\\n");', 2),
};

const MT = {
  cabecalho: lineOf('moduloTransformacoes', 'printf("\\n===== TRANSFORMAÇÕES'),
  chamaAdj: lineOf('moduloTransformacoes', 'incidenciaParaAdjacencia(g);'),
  chamaImprimir: lineOf('moduloTransformacoes', 'imprimirMatriz(g->v'),
  chamaLista: lineOf('moduloTransformacoes', 'adjacenciaParaLista(g);'),
  imprimeLista: lineOf('moduloTransformacoes', 'printf("NULL\\n");'),
};

export function incidenciaParaAdjacencia(rec: Recorder): void {
  const { v, e } = rec.estado;
  rec.entrar('incidenciaParaAdjacencia');
  rec.passo(2, IA.assinatura, 'Para cada coluna da incidência, encontra as duas extremidades e marca a adjacência.');
  for (let aresta = 0; aresta < e; aresta++) {
    let u = -1;
    let w = -1;
    rec.local({ aresta, u, w, vertice: null });
    rec.passo(2, IA.inicio, `Aresta e${aresta}: u e w começam em -1 (não encontrados).`, {
      celulas: Array.from({ length: v }, (_, i) => ({ matriz: 'incidencia' as const, i, j: aresta, tipo: 'atual' as const })),
    });
    for (let vertice = 0; vertice < v; vertice++) {
      const valor = rec.estado.incidencia?.[vertice]?.[aresta];
      rec.local({ vertice });
      rec.passo(3, IA.teste, `incidencia[${vertice}][${aresta}] = ${valor}.`, {
        celulas: [{ matriz: 'incidencia', i: vertice, j: aresta, tipo: 'atual' }],
        vertices: [{ id: vertice, tipo: valor === 1 ? 'sucesso' : 'comparado' }],
      });
      if (valor === 1) {
        if (u === -1) {
          u = vertice;
          rec.local({ u });
          rec.passo(3, IA.primeiro, `Primeira extremidade: u = ${u}.`, { vertices: [{ id: u, tipo: 'sucesso' }] });
        } else {
          w = vertice;
          rec.local({ w });
          rec.passo(3, IA.segundo, `Segunda extremidade: w = ${w}.`, { vertices: [{ id: w, tipo: 'sucesso' }] });
        }
      }
    }
    if (u === -1 || w === -1) {
      throw new InvarianteError(`A aresta e${aresta} não tem duas extremidades após a validação`);
    }
    const [origem, destino] = [u, w];
    rec.mutar((g) => ({ ...g, adjacencia: comCelula(g.adjacencia ?? [], origem, destino, 1) }));
    rec.passo(2, IA.uw, `adjacencia[${u}][${w}] = 1: a aresta ${u}–${w} entra na matriz de adjacência.`, {
      celulas: [{ matriz: 'adjacencia', i: u, j: w, tipo: 'sucesso' }],
      arestas: [{ u, w, tipo: 'sucesso' }],
      vertices: [
        { id: u, tipo: 'atual' },
        { id: w, tipo: 'atual' },
      ],
    });
    rec.mutar((g) => ({ ...g, adjacencia: comCelula(g.adjacencia ?? [], destino, origem, 1) }));
    rec.passo(3, IA.wu, `adjacencia[${w}][${u}] = 1: grafo não direcionado, a matriz é simétrica.`, {
      celulas: [{ matriz: 'adjacencia', i: w, j: u, tipo: 'sucesso' }],
      arestas: [{ u, w, tipo: 'sucesso' }],
    });
  }
  rec.sair();
}

export function adjacenciaParaLista(rec: Recorder): void {
  const { v } = rec.estado;
  rec.entrar('adjacenciaParaLista');
  rec.passo(2, AL.assinatura, 'Percorre cada linha da adjacência de trás para frente, inserindo na cabeça: a lista sai em ordem crescente.');
  for (let u = 0; u < v; u++) {
    rec.local({ u, w: null });
    rec.passo(2, AL.lacoU, `Monta a lista do vértice ${u}.`, { vertices: [{ id: u, tipo: 'atual' }] });
    for (let w = v - 1; w >= 0; w--) {
      const valor = rec.estado.adjacencia?.[u]?.[w];
      rec.local({ w });
      rec.passo(3, AL.teste, `adjacencia[${u}][${w}] = ${valor}.`, {
        celulas: [{ matriz: 'adjacencia', i: u, j: w, tipo: 'atual' }],
        vertices: [
          { id: u, tipo: 'atual' },
          { id: w, tipo: 'comparado' },
        ],
      });
      if (valor === 1) {
        rec.passo(3, AL.malloc, `Aloca um novo nó para o vizinho ${w}.`);
        rec.local({ novo: `No{vertice=${w}}` });
        rec.passo(3, AL.vertice, `novo->vertice = ${w}.`);
        rec.passo(3, AL.prox, 'novo->prox aponta para a cabeça atual da lista.', { no: { u, indice: 0 } });
        rec.mutar((g) => ({ ...g, lista: comItem<readonly number[]>(g.lista ?? [], u, [w, ...(g.lista?.[u] ?? [])]) }));
        rec.passo(2, AL.cabeca, `O nó ${w} vira a nova cabeça da lista de ${u}.`, {
          no: { u, indice: 0 },
          arestas: [{ u, w, tipo: 'sucesso' }],
          vertices: [
            { id: u, tipo: 'atual' },
            { id: w, tipo: 'sucesso' },
          ],
        });
        rec.descartar('novo');
      }
    }
  }
  rec.sair();
}

/** printf("%-3d") / printf("%-4d"): alinha à esquerda completando com espaços. */
function esquerda(valor: number | string, largura: number): string {
  return String(valor).padEnd(largura, ' ');
}

function imprimirMatriz(rec: Recorder, matriz: Matriz, rotulo: string): void {
  const linhas = matriz.length;
  rec.entrar('imprimirMatriz', { linhas, colunas: linhas, rotulo: `'${rotulo}'` });
  rec.printf('    ');
  rec.printf(matriz[0]?.map((_, j) => `${rotulo}${esquerda(j, 3)}`).join('') ?? '');
  rec.printf('\n');
  rec.passo(3, IM.cabecalho, 'Imprime o cabeçalho das colunas.');
  matriz.forEach((linha, i) => {
    rec.printf(`v${esquerda(i, 3)}${linha.map((valor) => esquerda(valor, 4)).join('')}\n`);
    rec.local({ i });
    rec.passo(3, IM.linha, `Imprime a linha do vértice ${i}.`, { vertices: [{ id: i, tipo: 'atual' }] });
  });
  rec.sair();
}

export function moduloTransformacoes(rec: Recorder): void {
  rec.entrar('moduloTransformacoes');
  rec.printf('\n===== TRANSFORMAÇÕES =====\n');
  rec.passo(1, MT.cabecalho, 'Início do módulo de transformações.');

  rec.passo(1, MT.chamaAdj, 'Converte a matriz de incidência em matriz de adjacência.');
  incidenciaParaAdjacencia(rec);
  rec.printf('Matriz de adjacência:\n');
  rec.passo(2, MT.chamaImprimir, 'Imprime a matriz de adjacência.');
  imprimirMatriz(rec, rec.estado.adjacencia ?? [], 'v');
  rec.passo(1, MT.chamaImprimir, 'Matriz de adjacência pronta e impressa.');

  rec.passo(1, MT.chamaLista, 'Converte a matriz de adjacência em listas encadeadas.');
  adjacenciaParaLista(rec);
  rec.printf('\nLista de adjacência:\n');
  (rec.estado.lista ?? []).forEach((vizinhos, u) => {
    rec.printf(`Vértice ${u}: ${vizinhos.map((w) => `${w} -> `).join('')}NULL\n`);
    rec.local({ u });
    rec.passo(3, MT.imprimeLista, `Imprime a lista do vértice ${u} percorrendo p = p->prox até NULL.`, { vertices: [{ id: u, tipo: 'atual' }] });
  });
  rec.descartar('u');
  rec.passo(1, MT.imprimeLista, 'Listas de adjacência prontas e impressas.');
  rec.sair();
}
