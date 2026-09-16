import type { EstadoGrafo } from './types';

export interface Ponto {
  readonly x: number;
  readonly y: number;
}

export interface ArestaVisual {
  /** Chave estável "u-w" com u < w. */
  readonly chave: string;
  readonly u: number;
  readonly w: number;
  /** 'adjacencia' = já está na matriz de adjacência; 'incidencia' = só lida da entrada. */
  readonly origem: 'adjacencia' | 'incidencia';
  /** Colunas da incidência que representam a aresta (mais de uma = paralelas). */
  readonly colunas: readonly number[];
}

export const TAMANHO_VIEWBOX = 600;
const CENTRO = TAMANHO_VIEWBOX / 2;
const RAIO = 230;

export function chaveAresta(u: number, w: number): string {
  return u < w ? `${u}-${w}` : `${w}-${u}`;
}

function circulo(ids: readonly number[]): Map<number, Ponto> {
  const mapa = new Map<number, Ponto>();
  ids.forEach((id, indice) => {
    const angulo = -Math.PI / 2 + (2 * Math.PI * indice) / ids.length;
    mapa.set(id, { x: CENTRO + RAIO * Math.cos(angulo), y: CENTRO + RAIO * Math.sin(angulo) });
  });
  return mapa;
}

/**
 * Posição de cada vértice. Circular por padrão; destaca as classificações já
 * impressas: centro da roda no meio, partições bipartidas em duas colunas.
 */
export function posicoes(estado: EstadoGrafo): Ponto[] {
  const { v, resultados } = estado;
  const ids = Array.from({ length: v }, (_, i) => i);
  if (v === 1) {
    return [{ x: CENTRO, y: CENTRO }];
  }

  let mapa: Map<number, Ponto>;
  if (resultados.bipartido) {
    const particoes = [resultados.bipartido.X, resultados.bipartido.Y];
    mapa = new Map();
    particoes.forEach((particao, coluna) => {
      const espaco = TAMANHO_VIEWBOX / (particao.length + 1);
      particao.forEach((id, indice) => mapa.set(id, { x: coluna === 0 ? 170 : 430, y: espaco * (indice + 1) }));
    });
  } else if (resultados.centro !== undefined) {
    const centro = resultados.centro;
    mapa = circulo(ids.filter((id) => id !== centro));
    mapa.set(centro, { x: CENTRO, y: CENTRO });
  } else {
    mapa = circulo(ids);
  }
  return ids.map((id) => mapa.get(id) ?? { x: CENTRO, y: CENTRO });
}

/** Arestas a desenhar: as da adjacência (sólidas) e as colunas de incidência completas ainda não convertidas. */
export function arestasVisiveis(estado: EstadoGrafo): ArestaVisual[] {
  const arestas = new Map<string, ArestaVisual>();
  const { adjacencia, incidencia, v, e } = estado;

  if (incidencia) {
    for (let coluna = 0; coluna < e; coluna++) {
      const extremidades: number[] = [];
      let completa = true;
      for (let vertice = 0; vertice < v; vertice++) {
        const valor = incidencia[vertice]?.[coluna];
        if (valor === null || valor === undefined) {
          completa = false;
        } else if (valor === 1) {
          extremidades.push(vertice);
        }
      }
      const [u, w] = extremidades;
      if (!completa || extremidades.length !== 2 || u === undefined || w === undefined) {
        continue;
      }
      const chave = chaveAresta(u, w);
      const existente = arestas.get(chave);
      arestas.set(chave, { chave, u, w, origem: 'incidencia', colunas: existente ? [...existente.colunas, coluna] : [coluna] });
    }
  }

  adjacencia?.forEach((linha, u) =>
    linha.forEach((valor, w) => {
      if (valor === 1 && u < w) {
        const chave = chaveAresta(u, w);
        arestas.set(chave, { chave, u, w, origem: 'adjacencia', colunas: arestas.get(chave)?.colunas ?? [] });
      }
    }),
  );
  return [...arestas.values()];
}
