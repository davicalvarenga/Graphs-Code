'use client';

import { useEffect, useRef, useState } from 'react';
import type { Ponto } from '@/engine/grafoVisual';

const DURACAO_MS = 500;

function suavizar(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function movimentoReduzido(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Interpola as posições dos vértices quando o layout muda (ex.: centro da roda
 * indo para o meio). Vértices e arestas usam os mesmos pontos, então andam juntos.
 */
export function usePosicoesAnimadas(alvo: readonly Ponto[]): readonly Ponto[] {
  const chave = alvo.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(';');
  const [quadro, setQuadro] = useState<{ chave: string; pontos: readonly Ponto[] } | null>(null);
  const exibidoRef = useRef<readonly Ponto[]>(alvo);

  useEffect(() => {
    const origem = exibidoRef.current;
    const destino = alvo;
    const parado = origem.every((p, i) => p.x === destino[i]?.x && p.y === destino[i]?.y);
    if (parado || origem.length !== destino.length || movimentoReduzido() || typeof window.requestAnimationFrame !== 'function') {
      exibidoRef.current = destino;
      return undefined;
    }

    const inicio = performance.now();
    let frame = 0;
    const animar = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / DURACAO_MS);
      const k = suavizar(t);
      const pontos = destino.map((p, i) => {
        const de = origem[i] ?? p;
        return { x: de.x + (p.x - de.x) * k, y: de.y + (p.y - de.y) * k };
      });
      exibidoRef.current = pontos;
      setQuadro(t < 1 ? { chave, pontos } : null);
      if (t < 1) {
        frame = window.requestAnimationFrame(animar);
      }
    };
    frame = window.requestAnimationFrame(animar);
    return () => window.cancelAnimationFrame(frame);
    // `chave` resume o conteúdo de `alvo`; a referência do array muda a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  return quadro?.chave === chave ? quadro.pontos : alvo;
}
