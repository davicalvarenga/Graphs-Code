'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { C_LINHAS } from '@/c-source/source';
import type { Frame } from '@/engine/types';

/** Linhas de contexto mostradas antes e depois da linha em execução. */
const VIZINHAS = 2;

/** Linhas de folga: a linha ativa é recentralizada antes de encostar na borda. */
const MARGEM_EM_LINHAS = 3;

interface LinhaProps {
  numero: number;
  texto: string;
  ativa: boolean;
  numerada: boolean;
}

const LinhaCodigo = memo(function LinhaCodigo({ numero, texto, ativa, numerada }: LinhaProps) {
  return (
    <div
      data-linha={numero}
      aria-current={ativa ? 'step' : undefined}
      className={`flex min-w-max border-l-[3px] pr-3 ${ativa ? 'border-acento font-bold text-tinta' : 'border-transparent text-neutral-700'}`}
    >
      {numerada ? (
        <span className={`w-11 shrink-0 select-none pr-3 text-right ${ativa ? 'linha-ativa text-acento-700' : 'text-neutral-500'}`}>{numero}</span>
      ) : null}
      <code className="whitespace-pre pl-3">{texto || ' '}</code>
    </div>
  );
});

function formatarValor(valor: Frame['locais'][string]): string {
  return valor === null ? '?' : String(valor);
}

interface CodePanelProps {
  linha: number;
  pilha: readonly Frame[];
}

/**
 * Código C do passo atual. Por padrão mostra só as linhas vizinhas à que está
 * executando; o link abre o arquivo inteiro, numerado e com rolagem automática.
 */
export function CodePanel({ linha, pilha }: CodePanelProps) {
  const [completo, setCompleto] = useState(false);
  const rolagemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = rolagemRef.current;
    const alvo = container?.querySelector<HTMLElement>(`[data-linha="${linha}"]`);
    if (!completo || !container || !alvo) {
      return;
    }
    // Medidas pela viewport: não dependem de qual ancestral é o offsetParent das linhas.
    const caixa = container.getBoundingClientRect();
    const caixaLinha = alvo.getBoundingClientRect();
    const margem = caixaLinha.height * MARGEM_EM_LINHAS;
    const visivel = caixaLinha.top >= caixa.top + margem && caixaLinha.bottom <= caixa.bottom - margem;
    if (!visivel && typeof container.scrollTo === 'function') {
      const topoNoConteudo = caixaLinha.top - caixa.top + container.scrollTop;
      container.scrollTo({ top: topoNoConteudo - (caixa.height - caixaLinha.height) / 2 });
    }
  }, [linha, completo]);

  const topo = pilha[pilha.length - 1];
  const inicio = Math.max(0, linha - 1 - VIZINHAS);
  const visiveis = completo ? C_LINHAS : C_LINHAS.slice(inicio, linha + VIZINHAS);
  const deslocamento = completo ? 0 : inicio;
  const locais = Object.entries(topo?.locais ?? {});

  return (
    <section aria-label="Código C" className="flex min-h-0 min-w-0 flex-col gap-3">
      <p className="font-mono text-xs text-neutral-700">
        <span className="text-acento-700">{topo?.fn ?? 'main'}</span> · linha {linha}
      </p>

      <div ref={rolagemRef} className={`font-mono text-[12px] leading-[24px] ${completo ? 'max-h-80 overflow-auto' : 'overflow-x-auto'}`}>
        {visiveis.map((texto, indice) => {
          const numero = deslocamento + indice + 1;
          return <LinhaCodigo key={numero} numero={numero} texto={texto} ativa={numero === linha} numerada={completo} />;
        })}
      </div>

      <button type="button" className="btn btn-texto self-start text-acento-700" onClick={() => setCompleto((atual) => !atual)}>
        {completo ? 'ver só as linhas vizinhas' : 'ver a função inteira'}
      </button>

      <div className="font-mono text-[13px] leading-6 text-neutral-800">
        {pilha.length > 1 ? <p className="text-neutral-600">{pilha.map((frame) => frame.fn).join(' › ')}</p> : null}
        <p aria-label="Variáveis locais">
          {locais.length > 0 ? locais.map(([nome, valor]) => `${nome} ${formatarValor(valor)}`).join(' · ') : 'sem variáveis locais'}
        </p>
      </div>
    </section>
  );
}
