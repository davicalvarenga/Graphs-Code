'use client';

import { useState } from 'react';
import { EXEMPLOS, type EntradaPrograma } from '@/engine/exemplos';
import { buildTrace } from '@/engine/programa';
import type { ResultadoTrace } from '@/engine/types';
import { Cabecalho } from './Cabecalho';
import { InputPanel } from './InputPanel';
import { Workspace } from './Workspace';

const ENTRADA_INICIAL: EntradaPrograma = EXEMPLOS[0]?.entrada ?? { vertices: '3', arestas: '0', matriz: '' };

interface Execucao {
  id: number;
  resultado: ResultadoTrace;
}

/** Orquestra a página: entrada → buildTrace → execução passo a passo. */
export function GraphLab() {
  const [entrada, setEntrada] = useState<EntradaPrograma>(ENTRADA_INICIAL);
  const [execucao, setExecucao] = useState<Execucao | null>(null);

  const executar = () => setExecucao((anterior) => ({ id: (anterior?.id ?? 0) + 1, resultado: buildTrace(entrada) }));

  if (execucao?.resultado.ok) {
    return <Workspace key={execucao.id} trace={execucao.resultado.trace} onNovaEntrada={() => setExecucao(null)} />;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Cabecalho situacao="execução linha a linha" />
      {execucao && !execucao.resultado.ok ? (
        <p role="alert" className="border-b border-divisor px-5 py-3 text-[15px] text-acento-700 md:px-14">
          {execucao.resultado.erro}
        </p>
      ) : null}
      <InputPanel entrada={entrada} onChange={setEntrada} onExecutar={executar} />
    </div>
  );
}
