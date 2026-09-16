'use client';

import { useEffect, useMemo, useState } from 'react';
import { resumoFinal } from '@/engine/resumo';
import type { Modulo, Nivel, Trace } from '@/engine/types';
import { usePlayer } from '@/hooks/usePlayer';
import { Cabecalho } from './Cabecalho';
import { CodePanel } from './CodePanel';
import { DataPanel } from './DataPanel';
import { ErrorBoundary } from './ErrorBoundary';
import { GraphView } from './GraphView';
import { Nota } from './Nota';
import { NOME_MODULO, PlayerControls, VELOCIDADES, type AtalhoDeModulo } from './PlayerControls';

function indicesAte(trace: Trace, nivel: Nivel): number[] {
  return trace.passos.flatMap((passo, indice) => (passo.nivel <= nivel ? [indice] : []));
}

/** Primeiro passo visível de cada módulo, para os atalhos da régua. */
function atalhosDeModulo(trace: Trace, visiveis: readonly number[]): AtalhoDeModulo[] {
  const atalhos: AtalhoDeModulo[] = [];
  visiveis.forEach((original, indice) => {
    const modulo = trace.passos[original]?.modulo;
    if (modulo && atalhos.every((atalho) => atalho.modulo !== modulo)) {
      atalhos.push({ modulo, indice });
    }
  });
  return atalhos;
}

function elementoEditavel(alvo: EventTarget | null): boolean {
  return alvo instanceof HTMLElement && (alvo.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(alvo.tagName));
}

interface WorkspaceProps {
  trace: Trace;
  /** Volta ao formulário de entrada. */
  onNovaEntrada: () => void;
}

export function Workspace({ trace, onNovaEntrada }: WorkspaceProps) {
  const [detalhe, setDetalhe] = useState<Nivel>(trace.nivelGravado);
  const [intervaloMs, setIntervaloMs] = useState(VELOCIDADES[1]?.ms ?? 600);

  const visiveis = useMemo(() => indicesAte(trace, detalhe), [trace, detalhe]);
  const player = usePlayer(visiveis.length, intervaloMs);
  const passo = trace.passos[visiveis[player.indice] ?? 0];

  const { alternar, avancar, voltar, ir } = player;
  const ultimo = visiveis.length - 1;
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (elementoEditavel(evento.target) || evento.ctrlKey || evento.metaKey || evento.altKey) {
        return;
      }
      const acoes: Record<string, () => void> = {
        ' ': alternar,
        ArrowRight: avancar,
        ArrowLeft: voltar,
        Home: () => ir(0),
        End: () => ir(ultimo),
      };
      const acao = acoes[evento.key];
      if (acao) {
        evento.preventDefault();
        acao();
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [alternar, avancar, voltar, ir, ultimo]);

  if (!passo) {
    return null;
  }

  const mudarDetalhe = (nivel: Nivel) => {
    const original = visiveis[player.indice] ?? 0;
    const novos = indicesAte(trace, nivel);
    let posicao = 0;
    novos.forEach((indice, i) => {
      if (indice <= original) {
        posicao = i;
      }
    });
    setDetalhe(nivel);
    ir(posicao);
  };

  const erro = passo.estado.resultados.erro;
  const terminou = passo.modulo === 'fim' && player.indice === ultimo;
  const modulo: Modulo = passo.modulo;

  return (
    // A partir de md a execução ocupa exatamente a janela: só o grafo encolhe e o painel lateral rola por dentro.
    <div className="flex min-h-dvh flex-col md:h-dvh md:overflow-hidden">
      <Cabecalho situacao={`passo ${player.indice + 1} de ${visiveis.length} · ${NOME_MODULO[modulo]}`} onAlterarEntrada={onNovaEntrada} />

      {trace.nivelGravado < 3 ? (
        <p className="border-b border-divisor px-5 py-2 text-[13px] text-acento-700 md:px-14">
          Execução muito longa: o detalhe foi reduzido para manter o navegador responsivo.
        </p>
      ) : null}

      {erro ? (
        <section role="alert" className="flex-none px-5 pt-10 md:px-14 md:pt-6 baixa:pt-3">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <h2 className="max-w-[30ch] text-[26px] md:text-[28px] baixa:text-[22px]">
              <Nota nota={erro} />
            </h2>
            <div className="flex flex-wrap items-center gap-6">
              <button type="button" className="btn btn-primario" onClick={() => ir(0)}>
                Rever do início
              </button>
              <button type="button" className="btn btn-texto" onClick={onNovaEntrada}>
                voltar à entrada
              </button>
            </div>
          </div>
          <p className="mt-2 max-w-[80ch] text-[15px] leading-relaxed text-neutral-900">
            {passo.nota} <span className="font-mono text-[13px] text-neutral-700">o programa parou no passo {player.indice + 1}</span>
          </p>
        </section>
      ) : terminou ? (
        // Título e botões na mesma linha: a tela final não pode roubar a altura do grafo e do painel lateral.
        <section role="status" className="flex-none px-5 pt-10 md:px-14 md:pt-6 baixa:pt-3">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <h2 className="text-[26px] md:text-[28px] baixa:text-[22px]">O programa terminou.</h2>
            <div className="flex flex-wrap items-center gap-6">
              <button type="button" className="btn btn-primario" onClick={() => ir(0)}>
                Rever do início
              </button>
              <button type="button" className="btn btn-texto" onClick={onNovaEntrada}>
                nova entrada
              </button>
            </div>
          </div>
          <p className="mt-2 max-w-[80ch] text-[15px] leading-relaxed text-neutral-900">
            {resumoFinal(passo.estado)} <span className="font-mono text-[13px] text-neutral-700">return {trace.exitCode}</span>
          </p>
        </section>
      ) : (
        <p className="max-w-[34ch] flex-none px-5 pt-10 font-titulo text-[26px] font-extrabold leading-[1.22] tracking-[-0.02em] md:px-14 md:pt-8 md:text-[34px] baixa:pt-3 baixa:text-[24px]">
          <Nota nota={passo.nota} />
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-10 px-5 pt-7 md:flex-row md:gap-14 md:px-14 baixa:pt-3">
        <div className="h-[300px] min-w-0 flex-1 md:h-auto md:min-h-0">
          <ErrorBoundary area="o grafo">
            <GraphView estado={passo.estado} destaque={passo.destaque} rodape={`${passo.estado.v} vértice(s)`} />
          </ErrorBoundary>
        </div>

        <aside className="flex w-full min-w-0 flex-col gap-8 pb-4 md:min-h-0 md:w-[330px] md:flex-none lg:w-[400px] md:overflow-y-auto">
          <ErrorBoundary area="o código">
            <CodePanel linha={passo.linha} pilha={passo.pilha} />
          </ErrorBoundary>
          <ErrorBoundary area="os dados">
            <DataPanel estado={passo.estado} destaque={passo.destaque} pilha={passo.pilha} saida={trace.stdout.slice(0, passo.stdoutFim)} />
          </ErrorBoundary>
        </aside>
      </div>

      <PlayerControls
        indice={player.indice}
        total={visiveis.length}
        tocando={player.tocando}
        modulo={modulo}
        modulos={atalhosDeModulo(trace, visiveis)}
        intervaloMs={intervaloMs}
        detalhe={detalhe}
        nivelGravado={trace.nivelGravado}
        onAlternar={alternar}
        onAvancar={avancar}
        onVoltar={voltar}
        onIr={ir}
        onIntervalo={setIntervaloMs}
        onDetalhe={mudarDetalhe}
      />
    </div>
  );
}
