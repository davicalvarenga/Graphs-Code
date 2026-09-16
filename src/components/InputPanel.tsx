'use client';

import { useId, type FormEvent } from 'react';
import { avisosDeEntrada } from '@/engine/avisos';
import { EXEMPLOS, type EntradaPrograma } from '@/engine/exemplos';
import { previaDaEntrada } from '@/engine/previa';
import { MAX_CARACTERES_ENTRADA } from '@/engine/programa';
import { GraphView } from './GraphView';

function mesmaEntrada(a: EntradaPrograma, b: EntradaPrograma): boolean {
  return a.vertices === b.vertices && a.arestas === b.arestas && a.matriz === b.matriz;
}

interface InputPanelProps {
  entrada: EntradaPrograma;
  onChange: (entrada: EntradaPrograma) => void;
  onExecutar: () => void;
}

export function InputPanel({ entrada, onChange, onExecutar }: InputPanelProps) {
  const id = useId();
  const avisos = avisosDeEntrada(entrada);
  const previa = previaDaEntrada(entrada);

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    onExecutar();
  };

  return (
    <main className="flex flex-1 flex-col gap-12 px-5 py-12 md:flex-row md:gap-16 md:px-14">
      <form onSubmit={enviar} className="min-w-0 flex-1 md:max-w-[640px]">
        <h1 className="max-w-[20ch] text-[34px] leading-[1.05] md:text-[46px]">Um grafo, e o programa em C que o lê.</h1>

        <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-neutral-900">
          Comece por um exemplo —{' '}
          {EXEMPLOS.map((exemplo, indice) => (
            <span key={exemplo.id}>
              <button
                type="button"
                title={exemplo.descricao}
                onClick={() => onChange(exemplo.entrada)}
                className={`btn btn-texto text-[17px] ${
                  mesmaEntrada(entrada, exemplo.entrada)
                    ? 'border-b-2 border-acento font-semibold text-tinta'
                    : 'border-b border-neutral-500 text-neutral-900'
                }`}
              >
                {exemplo.nome}
              </button>
              {indice < EXEMPLOS.length - 1 ? ', ' : ' '}
            </span>
          ))}
          — ou digite a sua matriz.
        </p>

        <div className="mt-10 flex flex-wrap gap-10">
          <label className="block">
            <span className="block text-[13px] text-neutral-700">vértices</span>
            <input
              className="campo-linha mt-1.5 w-24 font-mono text-[28px] font-bold"
              inputMode="numeric"
              autoComplete="off"
              maxLength={40}
              value={entrada.vertices}
              onChange={(e) => onChange({ ...entrada, vertices: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="block text-[13px] text-neutral-700">arestas</span>
            <input
              className="campo-linha mt-1.5 w-24 font-mono text-[28px] font-bold"
              inputMode="numeric"
              autoComplete="off"
              maxLength={40}
              value={entrada.arestas}
              onChange={(e) => onChange({ ...entrada, arestas: e.target.value })}
            />
          </label>
        </div>

        <div className="mt-10">
          <label className="block text-[13px] text-neutral-700" htmlFor={`${id}-matriz`}>
            matriz de incidência · uma linha por vértice
          </label>
          <textarea
            id={`${id}-matriz`}
            className="campo-linha mt-2.5 min-h-[170px] w-full resize-y font-mono text-[15px] leading-[1.9]"
            spellCheck={false}
            maxLength={MAX_CARACTERES_ENTRADA}
            value={entrada.matriz}
            onChange={(e) => onChange({ ...entrada, matriz: e.target.value })}
          />
          <p className="mt-3.5 max-w-[56ch] text-[13px] leading-relaxed text-neutral-700">
            Os três campos formam o stdin lido com <span className="font-mono">scanf(&quot;%d&quot;)</span>: espaços e quebras de linha são equivalentes.
          </p>
          {avisos.length > 0 ? (
            <div role="status" className="mt-3 max-w-[56ch] border-l-[3px] border-acento pl-3 text-[13px] leading-relaxed text-acento-700">
              {avisos.map((aviso) => (
                <p key={aviso}>{aviso}</p>
              ))}
              <p className="text-neutral-700">Dica do app, não do C: você pode executar assim mesmo para ver como o programa trata o erro.</p>
            </div>
          ) : null}
        </div>

        <button type="submit" className="btn btn-primario mt-9 px-[26px] py-[15px] text-[16px]">
          Executar programa
        </button>
      </form>

      <aside className="w-full md:w-[330px] md:flex-none">
        <p className="text-[13px] text-neutral-700">prévia</p>
        {previa ? (
          <div className="mt-3.5">
            <div className="h-[280px]">
              <GraphView estado={previa.estado} destaque={{}} previa />
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-neutral-700">{previa.resumo}</p>
          </div>
        ) : (
          <p className="mt-3.5 text-[13px] leading-relaxed text-neutral-700">Informe o número de vértices (1 a 20) e de arestas para ver o desenho.</p>
        )}
      </aside>
    </main>
  );
}
