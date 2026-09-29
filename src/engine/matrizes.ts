import { lineOf } from '@/c-source/source';
import { comCelula, type Recorder } from './recorder';
import type { Destaque, Matriz, MatrizViva } from './types';

/** Mesmo teto do `#define LIMITE` do programa C: evita estouro de int em grafos densos. */
export const LIMITE = 1_000_000;

const CA = {
  assinatura: lineOf('copiarAdjacencia', 'void copiarAdjacencia'),
  copia: lineOf('copiarAdjacencia', 'a[i][j] = g->adjacencia[i][j];'),
};

const MU = {
  assinatura: lineOf('multiplicar', 'void multiplicar'),
  zera: lineOf('multiplicar', 'c[i][j] = 0;'),
  acumula: lineOf('multiplicar', 'c[i][j] += a[i][k] * b[k][j];'),
  teste: lineOf('multiplicar', 'if(c[i][j] > LIMITE)'),
  limita: lineOf('multiplicar', 'c[i][j] = LIMITE;'),
};

const IQ = {
  cabecalho: lineOf('imprimirQuadrada', 'printf("\\n");', 1),
  linha: lineOf('imprimirQuadrada', 'printf("%-4d", m[i][j]);'),
};

const SOBRESCRITOS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** Aʳ com o expoente sobrescrito, como se escreve à mão: potenciaDeA(12) = "A¹²". */
export function potenciaDeA(r: number): string {
  return `A${[...String(r)].map((digito) => SOBRESCRITOS[Number(digito)]).join('')}`;
}

/** printf("%-3d") / printf("%-4d"): alinha à esquerda completando com espaços (nunca corta). */
function esquerda(valor: number, largura: number): string {
  return String(valor).padEnd(largura, ' ');
}

function vazia(n: number): (number | null)[][] {
  return Array.from({ length: n }, () => new Array<number | null>(n).fill(null));
}

/** Declara uma matriz local: aparece no painel com lixo de memória até ser preenchida. */
export function declarar(rec: Recorder, nome: string, rotulo: string, n: number): void {
  const nova: MatrizViva = { nome, rotulo, celulas: vazia(n) };
  rec.mutar((g) => ({ ...g, matrizes: [...(g.matrizes ?? []).filter((m) => m.nome !== nome), nova] }));
}

/** As matrizes locais somem quando a função que as declarou retorna. */
export function liberarMatrizes(rec: Recorder, ...nomes: string[]): void {
  rec.mutar((g) => {
    const restantes = (g.matrizes ?? []).filter((m) => !nomes.includes(m.nome));
    return { ...g, matrizes: restantes.length > 0 ? restantes : null };
  });
}

function escrever(rec: Recorder, nome: string, i: number, j: number, valor: number): void {
  rec.mutar((g) => ({
    ...g,
    matrizes: (g.matrizes ?? []).map((m) => (m.nome === nome ? { ...m, celulas: comCelula(m.celulas, i, j, valor) } : m)),
  }));
}

function valores(rec: Recorder, nome: string): Matriz {
  const matriz = rec.estado.matrizes?.find((m) => m.nome === nome);
  return (matriz?.celulas ?? []).map((linha) => linha.map((valor) => valor ?? 0));
}

/** copiarAdjacencia: leva a matriz de adjacência para uma matriz local. */
export function copiarAdjacencia(rec: Recorder, nome: string, rotulo: string): Matriz {
  const n = rec.estado.v;
  const adjacencia = rec.estado.adjacencia ?? [];
  declarar(rec, nome, rotulo, n);
  rec.entrar('copiarAdjacencia', { n });
  rec.passo(2, CA.assinatura, `Copia a matriz de adjacência para ${nome}.`);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const valor = adjacencia[i]?.[j] ?? 0;
      rec.local({ i, j });
      escrever(rec, nome, i, j, valor);
      rec.passo(3, CA.copia, `${nome}[${i}][${j}] = ${valor}.`, {
        celulas: [
          { matriz: 'adjacencia', i, j, tipo: 'comparado' },
          { matriz: nome, i, j, tipo: 'atual' },
        ],
      });
    }
  }
  rec.sair();
  return valores(rec, nome);
}

interface Fator {
  readonly nome: string;
  readonly valores: Matriz;
}

/**
 * multiplicar: c = a × b, com o teto LIMITE por célula.
 * c[i][j] soma, para cada k, os caminhos que chegam a k por `a` e seguem por `b`.
 */
/**
 * `mapa` traduz índice da matriz para o vértice do grafo: nas submatrizes da busca
 * de cliques as linhas são um subconjunto de vértices, não 0..v-1.
 */
export function multiplicar(
  rec: Recorder,
  a: Fator,
  b: Fator,
  destino: { nome: string; rotulo: string },
  mapa?: readonly number[],
): Matriz {
  const n = a.valores.length;
  const vertice = (indice: number) => mapa?.[indice] ?? indice;
  declarar(rec, destino.nome, destino.rotulo, n);
  rec.entrar('multiplicar', { n });
  rec.passo(2, MU.assinatura, `${destino.nome} = ${a.nome} × ${b.nome}.`);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      rec.local({ i, j, k: null });
      escrever(rec, destino.nome, i, j, 0);
      rec.passo(3, MU.zera, `${destino.nome}[${i}][${j}] = 0: vai somar as contribuições de cada k.`, {
        celulas: [{ matriz: destino.nome, i, j, tipo: 'atual' }],
        vertices: [
          { id: vertice(i), tipo: 'atual' },
          { id: vertice(j), tipo: 'atual' },
        ],
      });

      let acumulado = 0;
      for (let k = 0; k < n; k++) {
        const esquerdo = a.valores[i]?.[k] ?? 0;
        const direito = b.valores[k]?.[j] ?? 0;
        acumulado += esquerdo * direito;
        rec.local({ k });
        escrever(rec, destino.nome, i, j, acumulado);
        const contribui = esquerdo * direito > 0;
        const destaque: Destaque = {
          celulas: [
            { matriz: a.nome, i, j: k, tipo: contribui ? 'sucesso' : 'comparado' },
            { matriz: b.nome, i: k, j, tipo: contribui ? 'sucesso' : 'comparado' },
            { matriz: destino.nome, i, j, tipo: 'atual' },
          ],
          vertices: [
            { id: vertice(i), tipo: 'atual' },
            { id: vertice(j), tipo: 'atual' },
            { id: vertice(k), tipo: contribui ? 'sucesso' : 'comparado' },
          ],
          arestas: contribui ? [{ u: vertice(k), w: vertice(j), tipo: 'sucesso' }] : [],
        };
        rec.passo(
          3,
          MU.acumula,
          contribui
            ? `${a.nome}[${i}][${k}] × ${b.nome}[${k}][${j}] = ${esquerdo} × ${direito}: passando por ${k}, ${destino.nome}[${i}][${j}] = ${acumulado}.`
            : `${a.nome}[${i}][${k}] × ${b.nome}[${k}][${j}] = ${esquerdo} × ${direito} = 0: nada passa por ${k}.`,
          destaque,
        );
      }

      const estourou = acumulado > LIMITE;
      // Nível 2: em grafos grandes só as células concluídas aparecem, uma a uma.
      rec.passo(2, MU.teste, `${destino.nome}[${i}][${j}] = ${acumulado}${estourou ? ': passou do LIMITE' : ''}.`, {
        celulas: [{ matriz: destino.nome, i, j, tipo: estourou ? 'falha' : 'sucesso' }],
        vertices: [
          { id: vertice(i), tipo: 'atual' },
          { id: vertice(j), tipo: acumulado > 0 ? 'sucesso' : 'comparado' },
        ],
      });
      if (estourou) {
        escrever(rec, destino.nome, i, j, LIMITE);
        rec.passo(2, MU.limita, `${destino.nome}[${i}][${j}] = ${LIMITE}: o valor exato não importa, só se é zero ou positivo.`, {
          celulas: [{ matriz: destino.nome, i, j, tipo: 'falha' }],
        });
      }
    }
  }
  rec.descartar('i', 'j', 'k');
  rec.sair();
  return valores(rec, destino.nome);
}

/** imprimirQuadrada: imprime uma matriz n×n com os rótulos v0, v1, … */
export function imprimirQuadrada(rec: Recorder, matriz: Matriz, nome: string): void {
  const n = matriz.length;
  rec.entrar('imprimirQuadrada', { n });
  rec.printf(`    ${Array.from({ length: n }, (_, j) => `v${esquerda(j, 3)}`).join('')}\n`);
  rec.passo(3, IQ.cabecalho, 'Imprime o cabeçalho das colunas.');
  matriz.forEach((linha, i) => {
    rec.printf(`v${esquerda(i, 3)}${linha.map((valor) => esquerda(valor, 4)).join('')}\n`);
    rec.local({ i });
    rec.passo(3, IQ.linha, `Imprime a linha ${i} de ${nome}.`, {
      celulas: linha.map((_, j) => ({ matriz: nome, i, j, tipo: 'comparado' as const })),
      vertices: [{ id: i, tipo: 'atual' }],
    });
  });
  rec.sair();
}
