import type { EntradaPrograma } from './exemplos';
import { ESTADO_INICIAL } from './recorder';
import type { EstadoGrafo } from './types';

export interface Previa {
  /** Estado montado só para desenhar o grafo antes de executar o programa. */
  readonly estado: EstadoGrafo;
  /** Frase curta sobre o que a matriz descreve. */
  readonly resumo: string;
}

const INTEIRO = /^[+-]?\d+$/;

function inteiro(texto: string): number | null {
  const limpo = texto.trim();
  return INTEIRO.test(limpo) ? Number(limpo) : null;
}

/** Quantas partes desconexas o grafo tem, considerando só as colunas válidas. */
function partes(v: number, arestas: ReadonlyArray<readonly [number, number]>): number {
  const raiz = Array.from({ length: v }, (_, i) => i);
  const buscar = (i: number): number => (raiz[i] === i ? i : (raiz[i] = buscar(raiz[i] as number)));
  for (const [a, b] of arestas) {
    raiz[buscar(a)] = buscar(b);
  }
  return new Set(raiz.map((_, i) => buscar(i))).size;
}

/**
 * Prévia do grafo enquanto o usuário digita. Não valida como o programa C:
 * desenha o que já dá para desenhar e resume o resto em uma frase.
 */
export function previaDaEntrada(entrada: EntradaPrograma): Previa | null {
  const v = inteiro(entrada.vertices);
  const e = inteiro(entrada.arestas);
  if (v === null || v < 1 || v > 20 || e === null || e < 0 || e > (v * (v - 1)) / 2) {
    return null;
  }

  const tokens = entrada.matriz.split(/\s+/).filter(Boolean);
  const incidencia = Array.from({ length: v }, (_, i) =>
    Array.from({ length: e }, (_, j) => {
      const token = tokens[i * e + j];
      return token === '0' || token === '1' ? Number(token) : null;
    }),
  );
  const estado: EstadoGrafo = { ...ESTADO_INICIAL, v, e, incidencia };

  if (e === 0) {
    return { estado, resumo: v === 1 ? 'Um vértice, nenhuma aresta.' : `${v} vértices isolados, nenhuma aresta.` };
  }

  const arestas: Array<readonly [number, number]> = [];
  for (let coluna = 0; coluna < e; coluna++) {
    const pontas: number[] = [];
    let completa = true;
    for (let vertice = 0; vertice < v; vertice++) {
      const valor = incidencia[vertice]?.[coluna];
      if (valor === null) {
        completa = false;
      } else if (valor === 1) {
        pontas.push(vertice);
      }
    }
    const [a, b] = pontas;
    if (!completa) {
      return { estado, resumo: `Faltam valores na coluna e${coluna}.` };
    }
    if (pontas.length !== 2 || a === undefined || b === undefined) {
      return { estado, resumo: `A coluna e${coluna} tem ${pontas.length} vértice(s) marcado(s); cada aresta liga dois.` };
    }
    arestas.push([a, b]);
  }

  const componentes = partes(v, arestas);
  return {
    estado,
    resumo: `${e} aresta(s), todas com duas pontas. ${componentes === 1 ? 'Grafo conexo.' : `${componentes} partes separadas.`}`,
  };
}
