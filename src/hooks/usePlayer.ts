'use client';

import { useCallback, useEffect, useReducer } from 'react';

interface EstadoPlayer {
  indice: number;
  tocando: boolean;
}

export type AcaoPlayer =
  | { tipo: 'ir'; indice: number }
  | { tipo: 'avancar' }
  | { tipo: 'voltar' }
  | { tipo: 'alternar' }
  | { tipo: 'pausar' };

function limitar(indice: number, total: number): number {
  return Math.max(0, Math.min(indice, total - 1));
}

export function reducerPlayer(estado: EstadoPlayer, acao: AcaoPlayer, total: number): EstadoPlayer {
  const ultimo = total - 1;
  switch (acao.tipo) {
    case 'ir':
      return { indice: limitar(acao.indice, total), tocando: false };
    case 'avancar': {
      const indice = limitar(estado.indice + 1, total);
      return { indice, tocando: estado.tocando && indice < ultimo };
    }
    case 'voltar':
      return { indice: limitar(estado.indice - 1, total), tocando: false };
    case 'alternar':
      if (estado.tocando) {
        return { ...estado, tocando: false };
      }
      // Play parado no fim recomeça do início.
      return { indice: estado.indice >= ultimo ? 0 : estado.indice, tocando: total > 1 };
    case 'pausar':
      return { ...estado, tocando: false };
  }
}

export interface Player {
  indice: number;
  tocando: boolean;
  ir: (indice: number) => void;
  avancar: () => void;
  voltar: () => void;
  alternar: () => void;
}

/** Controla a posição no trace: play/pause com intervalo e navegação passo a passo. */
export function usePlayer(total: number, intervaloMs: number): Player {
  const [estado, despachar] = useReducer(
    (atual: EstadoPlayer, acao: AcaoPlayer) => reducerPlayer(atual, acao, total),
    { indice: 0, tocando: false },
  );

  useEffect(() => {
    if (!estado.tocando) {
      return undefined;
    }
    const timer = window.setTimeout(() => despachar({ tipo: 'avancar' }), intervaloMs);
    return () => window.clearTimeout(timer);
  }, [estado.tocando, estado.indice, intervaloMs]);

  return {
    indice: limitar(estado.indice, total),
    tocando: estado.tocando,
    ir: useCallback((indice: number) => despachar({ tipo: 'ir', indice }), []),
    avancar: useCallback(() => despachar({ tipo: 'avancar' }), []),
    voltar: useCallback(() => despachar({ tipo: 'voltar' }), []),
    alternar: useCallback(() => despachar({ tipo: 'alternar' }), []),
  };
}
