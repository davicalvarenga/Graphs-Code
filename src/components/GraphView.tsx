'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { arestasVisiveis, chaveAresta, posicoes, TAMANHO_VIEWBOX, type Ponto } from '@/engine/grafoVisual';
import type { Destaque, EstadoGrafo, TipoDestaque } from '@/engine/types';
import { usePosicoesAnimadas } from '@/hooks/usePosicoesAnimadas';

const COR: Record<TipoDestaque, string> = {
  atual: 'var(--color-atual)',
  comparado: 'var(--color-comparado)',
  sucesso: 'var(--color-sucesso)',
  falha: 'var(--color-falha)',
};

const PRIORIDADE: Record<TipoDestaque, number> = { comparado: 1, atual: 2, sucesso: 3, falha: 4 };

/** Um mesmo vértice/aresta pode vir destacado mais de uma vez: vence o tipo mais importante. */
function mapaDeDestaque<T extends { tipo: TipoDestaque }>(itens: readonly T[] | undefined, chave: (item: T) => string) {
  const mapa = new Map<string, TipoDestaque>();
  for (const item of itens ?? []) {
    const atual = mapa.get(chave(item));
    if (!atual || PRIORIDADE[item.tipo] > PRIORIDADE[atual]) {
      mapa.set(chave(item), item.tipo);
    }
  }
  return mapa;
}

/** Arco suave entre dois pontos: as arestas do desenho são curvas, não retas. */
function arco(de: Ponto, para: Ponto): string {
  const dx = para.x - de.x;
  const dy = para.y - de.y;
  const meio = { x: (de.x + para.x) / 2, y: (de.y + para.y) / 2 };
  const distancia = Math.hypot(dx, dy) || 1;
  const curvatura = 0.11;
  const controle = { x: meio.x - (dy / distancia) * distancia * curvatura, y: meio.y + (dx / distancia) * distancia * curvatura };
  return `M ${de.x} ${de.y} Q ${controle.x} ${controle.y} ${para.x} ${para.y}`;
}

function pontoDoArco(de: Ponto, para: Ponto): Ponto {
  const dx = para.x - de.x;
  const dy = para.y - de.y;
  const distancia = Math.hypot(dx, dy) || 1;
  return { x: (de.x + para.x) / 2 - (dy / distancia) * distancia * 0.075, y: (de.y + para.y) / 2 + (dx / distancia) * distancia * 0.075 };
}

function preenchimento(estado: EstadoGrafo, vertice: number, tipo: TipoDestaque | undefined): string {
  if (tipo === 'atual') {
    return 'var(--color-atual)';
  }
  const cor = estado.cor?.[vertice];
  const bipartido = estado.resultados.bipartido;
  if (cor === 0 || (bipartido && bipartido.X.includes(vertice))) {
    return 'var(--color-particao-x)';
  }
  if (cor === 1 || (bipartido && bipartido.Y.includes(vertice))) {
    return 'var(--color-particao-y)';
  }
  if (estado.visitado?.[vertice]) {
    return 'var(--color-visitado)';
  }
  return 'var(--color-fundo)';
}

/** Rótulos escuros pedem texto claro. */
function corDoRotulo(preenchido: string): string {
  return preenchido === 'var(--color-fundo)' || preenchido === 'var(--color-visitado)' ? 'var(--color-tinta)' : '#fff';
}

interface GraphViewProps {
  estado: EstadoGrafo;
  destaque: Destaque;
  /** Texto curto no rodapé; só na execução. */
  rodape?: string;
  /** Na prévia da entrada ainda não existe adjacência: as arestas saem sólidas e sem controles. */
  previa?: boolean;
}

export function GraphView({ estado, destaque, rodape, previa = false }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [transformacao, setTransformacao] = useState('');

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return undefined;
    }
    const comportamento = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on('zoom', (evento: { transform: { toString(): string } }) => setTransformacao(evento.transform.toString()));
    zoomRef.current = comportamento;
    const selecao = select(svg);
    selecao.call(comportamento);
    return () => {
      selecao.on('.zoom', null);
    };
  }, []);

  const resetarZoom = () => {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).call(zoomRef.current.transform, zoomIdentity);
    }
  };

  const alvo = useMemo(() => posicoes(estado), [estado]);
  const pontos = usePosicoesAnimadas(alvo);
  const arestas = useMemo(() => arestasVisiveis(estado), [estado]);
  const verticesDestacados = mapaDeDestaque(destaque.vertices, (item) => String(item.id));
  const arestasDestacadas = mapaDeDestaque(destaque.arestas, (item) => chaveAresta(item.u, item.w));
  const chavesDesenhadas = new Set(arestas.map((aresta) => aresta.chave));
  // Arestas destacadas que não existem (ex.: par de vizinhos não adjacentes num teste de clique).
  const fantasmas = [...arestasDestacadas.entries()].filter(([chave]) => !chavesDesenhadas.has(chave));

  const raio = estado.v > 16 ? 16 : estado.v > 11 ? 20 : 26;
  const centro = estado.resultados.centro;

  if (estado.v === 0) {
    return (
      <p className="m-auto max-w-xs py-10 text-center text-sm text-neutral-700">
        O grafo aparece quando <span className="font-mono">criarGrafo</span> é chamado.
      </p>
    );
  }

  return (
    <figure className="m-0 flex h-full min-h-0 flex-col" aria-label="Visualização do grafo">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${TAMANHO_VIEWBOX} ${TAMANHO_VIEWBOX}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Grafo com ${estado.v} vértice(s) e ${arestas.length} aresta(s) desenhada(s)`}
        className={`mx-auto min-h-0 w-full max-w-[560px] flex-1 touch-none ${estado.liberado ? 'opacity-50' : ''}`}
      >
        <g transform={transformacao || undefined}>
          {arestas.map((aresta) => {
            const de = pontos[aresta.u];
            const para = pontos[aresta.w];
            if (!de || !para) {
              return null;
            }
            const tipo = arestasDestacadas.get(aresta.chave);
            const rotulo = aresta.colunas.map((coluna) => `e${coluna}`).join(', ');
            const meio = tipo ? pontoDoArco(de, para) : null;
            return (
              <g key={aresta.chave}>
                <path
                  data-testid={`aresta-${aresta.chave}`}
                  data-origem={aresta.origem}
                  data-destaque={tipo}
                  d={arco(de, para)}
                  fill="none"
                  stroke={tipo ? COR[tipo] : aresta.origem === 'adjacencia' || previa ? 'var(--color-tinta)' : 'var(--color-neutral-600)'}
                  strokeWidth={tipo ? 5 : 1.5}
                  strokeDasharray={aresta.origem === 'incidencia' && !previa ? '7 6' : undefined}
                  strokeLinecap="round"
                >
                  <title>{`Aresta ${aresta.u}–${aresta.w}${rotulo ? ` (${rotulo})` : ''}`}</title>
                </path>
                {meio && rotulo ? (
                  <text x={meio.x} y={meio.y - 10} textAnchor="middle" className="fill-acento-700 font-mono" fontSize={15}>
                    {rotulo}
                  </text>
                ) : null}
              </g>
            );
          })}

          {fantasmas.map(([chave, tipo]) => {
            const [u, w] = chave.split('-').map(Number) as [number, number];
            const de = pontos[u];
            const para = pontos[w];
            if (!de || !para) {
              return null;
            }
            return (
              <path
                key={`fantasma-${chave}`}
                data-testid={`fantasma-${chave}`}
                d={arco(de, para)}
                fill="none"
                stroke={COR[tipo]}
                strokeWidth={2.5}
                strokeDasharray="2 8"
                strokeLinecap="round"
              >
                <title>{`Par ${u}–${w} (não é aresta)`}</title>
              </path>
            );
          })}

          {pontos.map((ponto, vertice) => {
            const tipo = verticesDestacados.get(String(vertice));
            const grau = estado.grau?.[vertice];
            const ignorado = destaque.ignorado === vertice;
            const fundo = preenchimento(estado, vertice, tipo);
            const raioAtual = tipo === 'atual' ? raio + 4 : raio;
            return (
              <g
                key={vertice}
                data-testid={`vertice-${vertice}`}
                data-destaque={tipo}
                transform={`translate(${ponto.x} ${ponto.y})`}
                opacity={ignorado ? 0.4 : 1}
              >
                <title>{`Vértice ${vertice}${grau !== null && grau !== undefined ? `, grau ${grau}` : ''}${ignorado ? ' (ignorado pela DFS)' : ''}`}</title>
                {centro === vertice ? (
                  <circle r={raio + 9} fill="none" stroke="var(--color-acento)" strokeWidth={2} strokeDasharray="5 5" data-testid="centro-roda" />
                ) : null}
                <circle
                  r={raioAtual}
                  fill={fundo}
                  stroke={tipo ? COR[tipo] : 'var(--color-tinta)'}
                  strokeWidth={tipo && tipo !== 'atual' ? 4 : 1.5}
                  strokeDasharray={ignorado ? '4 4' : undefined}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={raio * 0.7}
                  fontWeight={700}
                  fill={corDoRotulo(fundo)}
                  className="font-titulo"
                >
                  {vertice}
                </text>
                {grau !== null && grau !== undefined ? (
                  <text x={raioAtual + 5} y={-raioAtual + 4} fontSize={13} className="fill-neutral-600 font-mono">
                    g{grau}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>

      {previa ? null : (
        <figcaption className="flex items-baseline justify-between gap-4 pt-2 text-[13px] text-neutral-700">
          <span>{estado.liberado ? 'memória liberada' : rodape}</span>
          <button type="button" onClick={resetarZoom} className="btn btn-texto">
            Centralizar
          </button>
        </figcaption>
      )}
    </figure>
  );
}
