'use client';

import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { potenciaDeA } from '@/engine/conectividade';
import type { Destaque, EstadoGrafo, Frame, MatrizDestacavel, TipoDestaque } from '@/engine/types';

export type Aba = 'incidencia' | 'adjacencia' | 'lista' | 'graus' | 'conectividade' | 'resultados' | 'saida';

const ABAS: ReadonlyArray<{ id: Aba; rotulo: string }> = [
  { id: 'incidencia', rotulo: 'incidência' },
  { id: 'adjacencia', rotulo: 'adjacência' },
  { id: 'lista', rotulo: 'lista' },
  { id: 'graus', rotulo: 'graus' },
  { id: 'conectividade', rotulo: 'conectividade' },
  { id: 'resultados', rotulo: 'resultados' },
  { id: 'saida', rotulo: 'saída' },
];

const ABA_POR_FUNCAO: Readonly<Record<string, Aba>> = {
  moduloEntrada: 'incidencia',
  criarGrafo: 'incidencia',
  validarColunas: 'incidencia',
  validarParalelas: 'incidencia',
  moduloTransformacoes: 'lista',
  incidenciaParaAdjacencia: 'adjacencia',
  imprimirMatriz: 'adjacencia',
  adjacenciaParaLista: 'lista',
  moduloClassificacao: 'graus',
  ehCompleto: 'graus',
  ehCiclo: 'graus',
  ehRoda: 'graus',
  verificarEuleriano: 'graus',
  contarAlcancados: 'resultados',
  dfs: 'resultados',
  verificarBipartido: 'resultados',
  colorir: 'resultados',
  moduloCliques: 'resultados',
  detectarTriangulos: 'adjacencia',
  detectarCliquesVizinhanca: 'adjacencia',
  imprimirClique: 'resultados',
  moduloConectividade: 'conectividade',
  liberarGrafo: 'saida',
  main: 'saida',
};

/** Aba mais útil para a função em execução no topo da pilha. */
export function abaSugerida(pilha: readonly Frame[]): Aba {
  return ABA_POR_FUNCAO[pilha[pilha.length - 1]?.fn ?? 'main'] ?? 'saida';
}

const CLASSE_CELULA: Record<TipoDestaque, string> = {
  atual: 'bg-acento font-bold text-white',
  comparado: 'bg-neutral-200',
  sucesso: 'bg-sucesso font-bold text-white',
  falha: 'bg-falha font-bold text-white',
};

interface MatrizProps {
  titulo: string;
  prefixoColuna: string;
  linhas: ReadonlyArray<ReadonlyArray<number | null>>;
  destaques: Map<string, TipoDestaque>;
}

function TabelaMatriz({ titulo, prefixoColuna, linhas, destaques }: MatrizProps) {
  const colunas = linhas[0]?.length ?? 0;
  if (colunas === 0) {
    return <p className="text-sm text-neutral-700">{titulo}: sem colunas (e = 0).</p>;
  }
  return (
    <div className="overflow-auto">
      <table className="border-collapse font-mono text-[13px]" aria-label={titulo}>
        <thead>
          <tr>
            <th scope="col" className="px-2" />
            {Array.from({ length: colunas }, (_, j) => (
              <th key={j} scope="col" className="px-2 py-0.5 text-center text-[11px] font-normal text-neutral-600">
                {prefixoColuna}
                {j}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, i) => (
            <tr key={i}>
              <th scope="row" className="px-2 py-0.5 text-left text-[11px] font-normal text-neutral-600">
                v{i}
              </th>
              {linha.map((valor, j) => {
                const tipo = destaques.get(`${i},${j}`);
                return (
                  <td
                    key={j}
                    data-destaque={tipo}
                    title={valor === null ? 'Posição alocada, ainda não lida (lixo de memória)' : undefined}
                    className={`min-w-7 px-2 py-0.5 text-center ${tipo ? CLASSE_CELULA[tipo] : valor === 1 ? 'text-tinta' : 'text-neutral-500'}`}
                  >
                    {valor === null ? '?' : valor}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function celulasDe(destaque: Destaque, matriz: MatrizDestacavel): Map<string, TipoDestaque> {
  return new Map((destaque.celulas ?? []).filter((c) => c.matriz === matriz).map((c) => [`${c.i},${c.j}`, c.tipo] as const));
}

function Situacao({ rotulo, valor, detalhe }: { rotulo: string; valor: boolean | undefined; detalhe?: string }) {
  const texto = valor === undefined ? 'pendente' : valor ? 'Sim' : 'Não';
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-divisor py-1">
      <span>{rotulo}</span>
      <span className={valor === undefined ? 'text-neutral-500' : valor ? 'font-bold text-acento-700' : 'text-neutral-700'}>
        {texto}
        {detalhe ? <span className="ml-1 font-normal text-neutral-700">{detalhe}</span> : null}
      </span>
    </li>
  );
}

function VetorAuxiliar({ titulo, valores, formatar }: { titulo: string; valores: readonly (boolean | number)[]; formatar: (v: boolean | number) => string }) {
  return (
    <div>
      <h4 className="text-[11px] uppercase tracking-[0.12em] text-neutral-700">{titulo}</h4>
      <p className="mt-1 font-mono text-[13px] text-neutral-800">{valores.map((valor, i) => `[${i}] ${formatar(valor)}`).join('  ')}</p>
    </div>
  );
}

function Resultados({ estado }: { estado: EstadoGrafo }) {
  const r = estado.resultados;
  const euleriano = r.euleriano === undefined ? undefined : r.euleriano === 'ciclo';
  const detalheEuleriano = r.euleriano === 'caminho' ? '(possui caminho euleriano)' : r.euleriano === 'ciclo' ? '(ciclo euleriano)' : undefined;
  return (
    <div className="space-y-4 text-sm">
      <ul className="max-w-sm">
        <Situacao rotulo="Matriz válida" valor={r.valida} />
        <Situacao rotulo="Completo" valor={r.completo} />
        <Situacao rotulo="Ciclo" valor={r.ciclo} />
        <Situacao rotulo="Roda" valor={r.roda} detalhe={r.centro !== undefined ? `(centro ${r.centro})` : undefined} />
        <Situacao rotulo="Euleriano" valor={euleriano} detalhe={detalheEuleriano} />
        <Situacao rotulo="Conexo" valor={r.conexo} />
        <Situacao
          rotulo="Bipartido"
          valor={r.bipartido === undefined ? undefined : r.bipartido !== false}
          detalhe={r.bipartido ? `X = {${r.bipartido.X.join(', ')}} · Y = {${r.bipartido.Y.join(', ')}}` : undefined}
        />
      </ul>

      {estado.visitado ? <VetorAuxiliar titulo="visitado[] (DFS)" valores={estado.visitado} formatar={(v) => (v ? 'true' : 'false')} /> : null}
      {estado.cor ? <VetorAuxiliar titulo="cor[] (bipartição)" valores={estado.cor} formatar={(c) => (c === -1 ? '-1' : c === 0 ? 'X' : 'Y')} /> : null}

      <div>
        <h4 className="text-[11px] uppercase tracking-[0.12em] text-neutral-700">Triângulos (K₃): {r.triangulos.length}</h4>
        <p className="mt-1 font-mono text-[13px]">{r.triangulos.map((t) => `{${t.join(' ')}}`).join('  ') || '—'}</p>
      </div>
      <div>
        <h4 className="text-[11px] uppercase tracking-[0.12em] text-neutral-700">Cliques {'{u} ∪ N(u)'}: {r.cliques.length}</h4>
        <p className="mt-1 font-mono text-[13px]">{r.cliques.map((c) => `{${c.membros.join(' ')}} tamanho ${c.tamanho}`).join('  ') || '—'}</p>
      </div>
    </div>
  );
}

/** Matrizes locais de moduloConectividade enquanto executa; depois, só o S final. */
function Conectividade({ estado, destaque }: { estado: EstadoGrafo; destaque: Destaque }) {
  const c = estado.conectividade;
  const { somaCaminhos, conexo } = estado.resultados;
  if (!c) {
    return somaCaminhos ? (
      <div className="space-y-3">
        <TabelaMatriz titulo="S = A + A² + … + Aⁿ⁻¹" prefixoColuna="v" linhas={somaCaminhos} destaques={new Map()} />
        <p className="text-sm">
          Conexo: <span className={conexo ? 'font-bold text-acento-700' : 'text-neutral-700'}>{conexo ? 'Sim' : 'Não'}</span>
        </p>
      </div>
    ) : (
      <Vazio>O módulo de conectividade ainda não foi executado.</Vazio>
    );
  }
  return (
    <div className="space-y-4">
      <Rotulo>potencia · {potenciaDeA(c.r)}</Rotulo>
      <TabelaMatriz titulo="potencia" prefixoColuna="v" linhas={c.potencia} destaques={celulasDe(destaque, 'potencia')} />
      <Rotulo>proxima · {potenciaDeA(c.r + 1)} em construção</Rotulo>
      <TabelaMatriz titulo="proxima" prefixoColuna="v" linhas={c.proxima} destaques={celulasDe(destaque, 'proxima')} />
      <Rotulo>soma · S = A + … + {potenciaDeA(c.r)}</Rotulo>
      <TabelaMatriz titulo="soma" prefixoColuna="v" linhas={c.soma} destaques={celulasDe(destaque, 'soma')} />
    </div>
  );
}

function Rotulo({ children }: { children: ReactNode }) {
  return <h4 className="text-[11px] uppercase tracking-[0.12em] text-neutral-700">{children}</h4>;
}

interface DataPanelProps {
  estado: EstadoGrafo;
  destaque: Destaque;
  pilha: readonly Frame[];
  saida: string;
}

export function DataPanel({ estado, destaque, pilha, saida }: DataPanelProps) {
  const [escolhida, setEscolhida] = useState<Aba | null>(null);
  const prefixo = useId();
  const ativa = escolhida ?? abaSugerida(pilha);

  const navegarComTeclado = (evento: KeyboardEvent<HTMLDivElement>) => {
    const indice = ABAS.findIndex((aba) => aba.id === ativa);
    const delta = evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0;
    if (delta !== 0) {
      evento.preventDefault();
      const proxima = ABAS[(indice + delta + ABAS.length) % ABAS.length];
      if (proxima) {
        setEscolhida(proxima.id);
        document.getElementById(`${prefixo}-aba-${proxima.id}`)?.focus();
      }
    }
  };

  let conteudo: ReactNode;
  switch (ativa) {
    case 'incidencia':
      conteudo = estado.incidencia ? (
        <TabelaMatriz titulo="Matriz de incidência" prefixoColuna="e" linhas={estado.incidencia} destaques={celulasDe(destaque, 'incidencia')} />
      ) : (
        <Vazio>A matriz de incidência ainda não foi alocada.</Vazio>
      );
      break;
    case 'adjacencia':
      conteudo = estado.adjacencia ? (
        <TabelaMatriz titulo="Matriz de adjacência" prefixoColuna="v" linhas={estado.adjacencia} destaques={celulasDe(destaque, 'adjacencia')} />
      ) : (
        <Vazio>A matriz de adjacência ainda não foi alocada.</Vazio>
      );
      break;
    case 'lista':
      conteudo = estado.lista ? (
        <ol className="space-y-0.5 font-mono text-[13px]" aria-label="Lista de adjacência">
          {estado.lista.map((vizinhos, u) => (
            <li key={u} className="flex flex-wrap items-baseline gap-1.5">
              <span className="w-7 text-neutral-600">v{u}</span>
              {vizinhos.map((w, indice) => {
                const foco = destaque.no?.u === u && destaque.no.indice === indice;
                return (
                  <span key={`${indice}-${w}`} className="flex items-baseline gap-1.5">
                    <span data-foco={foco || undefined} className={foco ? 'border-b-2 border-acento font-bold text-acento-700' : ''}>
                      {w}
                    </span>
                    <span aria-hidden className="text-neutral-500">
                      →
                    </span>
                  </span>
                );
              })}
              <span className="text-neutral-500">NULL</span>
            </li>
          ))}
        </ol>
      ) : (
        <Vazio>As listas ainda não foram alocadas.</Vazio>
      );
      break;
    case 'graus':
      conteudo = estado.grau ? (
        <ol className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[13px]" aria-label="Vetor de graus">
          {estado.grau.map((grau, u) => {
            const tipo = destaque.vertices?.find((item) => item.id === u)?.tipo;
            return (
              <li key={u} data-destaque={tipo} className={tipo ? `${CLASSE_CELULA[tipo]} px-1.5` : ''}>
                grau[{u}] = {grau === null ? '?' : grau}
              </li>
            );
          })}
        </ol>
      ) : (
        <Vazio>O vetor de graus ainda não foi alocado.</Vazio>
      );
      break;
    case 'conectividade':
      conteudo = <Conectividade estado={estado} destaque={destaque} />;
      break;
    case 'resultados':
      conteudo = <Resultados estado={estado} />;
      break;
    case 'saida':
      conteudo = (
        <pre aria-label="Saída do programa" className="whitespace-pre-wrap bg-superficie p-3 font-mono text-[12px] leading-5 text-neutral-900">
          {saida || ' '}
        </pre>
      );
      break;
  }

  return (
    <section aria-label="Dados intermediários" className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div id={`${prefixo}-painel`} role="tabpanel" aria-labelledby={`${prefixo}-aba-${ativa}`} className="max-h-[42vh] min-h-0 flex-1 overflow-auto md:max-h-none">
        {conteudo}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px]">
        <div role="tablist" aria-label="Representações" className="flex flex-wrap gap-x-4 gap-y-1" onKeyDown={navegarComTeclado}>
          {ABAS.map((aba) => (
            <button
              key={aba.id}
              id={`${prefixo}-aba-${aba.id}`}
              type="button"
              role="tab"
              aria-selected={ativa === aba.id}
              aria-controls={`${prefixo}-painel`}
              tabIndex={ativa === aba.id ? 0 : -1}
              onClick={() => setEscolhida(aba.id)}
              className={`btn btn-texto ${ativa === aba.id ? 'border-b-2 border-tinta font-bold text-tinta' : 'text-neutral-700'}`}
            >
              {aba.rotulo}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-1.5 text-[13px] text-neutral-700">
          <input type="checkbox" className="accent-acento" checked={escolhida === null} onChange={(e) => setEscolhida(e.target.checked ? null : ativa)} />
          seguir execução
        </label>
      </div>
    </section>
  );
}

function Vazio({ children }: { children: ReactNode }) {
  return <p className="text-sm text-neutral-700">{children}</p>;
}
