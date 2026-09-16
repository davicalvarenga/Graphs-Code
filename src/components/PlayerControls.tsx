'use client';

import type { Modulo, Nivel } from '@/engine/types';

export const VELOCIDADES: ReadonlyArray<{ ms: number; rotulo: string }> = [
  { ms: 1200, rotulo: '0,5×' },
  { ms: 600, rotulo: '1×' },
  { ms: 250, rotulo: '2×' },
  { ms: 80, rotulo: '5×' },
  { ms: 16, rotulo: 'máx.' },
];

const NIVEIS: ReadonlyArray<{ nivel: Nivel; rotulo: string }> = [
  { nivel: 3, rotulo: 'toda linha' },
  { nivel: 2, rotulo: 'iterações' },
  { nivel: 1, rotulo: 'chamadas' },
];

export const NOME_MODULO: Record<Modulo, string> = {
  entrada: 'entrada',
  transformacoes: 'transformações',
  classificacao: 'classificação',
  cliques: 'cliques',
  fim: 'encerramento',
};

export interface AtalhoDeModulo {
  modulo: Modulo;
  /** Índice do primeiro passo visível desse módulo. */
  indice: number;
}

interface PlayerControlsProps {
  indice: number;
  total: number;
  tocando: boolean;
  modulo: Modulo;
  modulos: readonly AtalhoDeModulo[];
  intervaloMs: number;
  detalhe: Nivel;
  nivelGravado: Nivel;
  onAlternar: () => void;
  onAvancar: () => void;
  onVoltar: () => void;
  onIr: (indice: number) => void;
  onIntervalo: (ms: number) => void;
  onDetalhe: (nivel: Nivel) => void;
}

export function PlayerControls(props: PlayerControlsProps) {
  const { indice, total, tocando, modulo, modulos, intervaloMs, detalhe, nivelGravado } = props;
  const ultimo = total - 1;

  return (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-divisor px-5 pb-6 pt-4 md:px-14 baixa:pb-3 baixa:pt-3">
      <button type="button" className="btn btn-primario min-w-[118px]" onClick={props.onAlternar} aria-label={tocando ? 'Pausar' : 'Executar'} title="Play/pausa (espaço)">
        {tocando ? 'Pausar' : 'Play'}
      </button>

      <div className="flex items-center gap-2" role="group" aria-label="Controles de execução">
        <button type="button" className="btn btn-secundario" onClick={() => props.onIr(0)} disabled={indice === 0} aria-label="Ir para o início" title="Início (Home)">
          início
        </button>
        <button type="button" className="btn btn-secundario" onClick={props.onVoltar} disabled={indice === 0} aria-label="Passo anterior" title="Passo anterior (←)">
          ←
        </button>
        <button type="button" className="btn btn-secundario" onClick={props.onAvancar} disabled={indice >= ultimo} aria-label="Próximo passo" title="Próximo passo (→)">
          →
        </button>
      </div>

      <div className="flex min-w-56 flex-1 flex-col gap-2">
        <input
          type="range"
          min={0}
          max={Math.max(0, ultimo)}
          value={indice}
          onChange={(evento) => props.onIr(Number(evento.target.value))}
          aria-label="Posição na execução"
          className="regua-progresso"
        />
        <div className="flex flex-wrap justify-between gap-x-4 text-xs">
          {modulos.map((atalho) => (
            <button
              key={atalho.modulo}
              type="button"
              className={`btn btn-texto text-xs ${atalho.modulo === modulo ? 'font-bold text-acento-700' : 'text-neutral-700'}`}
              aria-current={atalho.modulo === modulo ? 'step' : undefined}
              onClick={() => props.onIr(atalho.indice)}
            >
              {NOME_MODULO[atalho.modulo]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-neutral-700">
        <label className="flex items-center gap-1.5">
          velocidade
          <select value={intervaloMs} onChange={(evento) => props.onIntervalo(Number(evento.target.value))} className="selecao-discreta">
            {VELOCIDADES.map((v) => (
              <option key={v.ms} value={v.ms}>
                {v.rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          detalhe
          <select value={detalhe} onChange={(evento) => props.onDetalhe(Number(evento.target.value) as Nivel)} className="selecao-discreta">
            {NIVEIS.filter((n) => n.nivel <= nivelGravado).map((n) => (
              <option key={n.nivel} value={n.nivel}>
                {n.rotulo}
              </option>
            ))}
          </select>
        </label>
        <span className="hidden xl:inline">espaço play · ← → passo</span>
      </div>
    </div>
  );
}
