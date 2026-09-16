import { act, renderHook } from '@testing-library/react';
import { reducerPlayer, usePlayer } from '../usePlayer';
import { usePosicoesAnimadas } from '../usePosicoesAnimadas';

describe('reducerPlayer', () => {
  const parado = { indice: 0, tocando: false };

  it('limita a navegação aos extremos', () => {
    expect(reducerPlayer(parado, { tipo: 'voltar' }, 5)).toEqual(parado);
    expect(reducerPlayer({ indice: 4, tocando: false }, { tipo: 'avancar' }, 5)).toEqual({ indice: 4, tocando: false });
    expect(reducerPlayer(parado, { tipo: 'ir', indice: 99 }, 5)).toEqual({ indice: 4, tocando: false });
    expect(reducerPlayer(parado, { tipo: 'ir', indice: -3 }, 5)).toEqual(parado);
  });

  it('para de tocar ao chegar no último passo', () => {
    expect(reducerPlayer({ indice: 3, tocando: true }, { tipo: 'avancar' }, 5)).toEqual({ indice: 4, tocando: false });
    expect(reducerPlayer({ indice: 1, tocando: true }, { tipo: 'avancar' }, 5)).toEqual({ indice: 2, tocando: true });
  });

  it('play no fim recomeça do início; pausar e alternar desligam', () => {
    expect(reducerPlayer({ indice: 4, tocando: false }, { tipo: 'alternar' }, 5)).toEqual({ indice: 0, tocando: true });
    expect(reducerPlayer({ indice: 2, tocando: true }, { tipo: 'alternar' }, 5)).toEqual({ indice: 2, tocando: false });
    expect(reducerPlayer({ indice: 2, tocando: true }, { tipo: 'pausar' }, 5)).toEqual({ indice: 2, tocando: false });
    expect(reducerPlayer(parado, { tipo: 'alternar' }, 1)).toEqual(parado);
  });
});

describe('usePlayer', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('avança sozinho enquanto toca e para no fim', () => {
    const { result } = renderHook(() => usePlayer(3, 100));
    act(() => result.current.alternar());
    expect(result.current.tocando).toBe(true);
    act(() => jest.advanceTimersByTime(100));
    expect(result.current.indice).toBe(1);
    act(() => jest.advanceTimersByTime(100));
    expect(result.current.indice).toBe(2);
    expect(result.current.tocando).toBe(false);
  });

  it('expõe navegação manual', () => {
    const { result } = renderHook(() => usePlayer(10, 100));
    act(() => result.current.avancar());
    act(() => result.current.avancar());
    act(() => result.current.voltar());
    expect(result.current.indice).toBe(1);
    act(() => result.current.ir(7));
    expect(result.current.indice).toBe(7);
  });
});

describe('usePosicoesAnimadas', () => {
  it('interpola até o destino quando o layout muda', () => {
    const quadros: FrameRequestCallback[] = [];
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => quadros.push(fn));
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    jest.spyOn(performance, 'now').mockReturnValue(0);

    const { result, rerender } = renderHook(({ alvo }) => usePosicoesAnimadas(alvo), { initialProps: { alvo: [{ x: 0, y: 0 }] } });
    rerender({ alvo: [{ x: 100, y: 0 }] });

    act(() => quadros.shift()?.(250));
    expect(result.current[0]?.x).toBeGreaterThan(0);
    expect(result.current[0]?.x).toBeLessThan(100);

    act(() => quadros.shift()?.(500));
    expect(result.current).toEqual([{ x: 100, y: 0 }]);
    expect(quadros).toHaveLength(0);
  });

  it('pula a animação quando o número de vértices muda', () => {
    const espiao = jest.spyOn(window, 'requestAnimationFrame');
    const { result, rerender } = renderHook(({ alvo }) => usePosicoesAnimadas(alvo), { initialProps: { alvo: [{ x: 0, y: 0 }] } });
    rerender({ alvo: [{ x: 1, y: 1 }, { x: 2, y: 2 }] });
    expect(result.current).toEqual([{ x: 1, y: 1 }, { x: 2, y: 2 }]);
    expect(espiao).not.toHaveBeenCalled();
  });
});
