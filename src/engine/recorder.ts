import type { Destaque, EstadoGrafo, Frame, Modulo, Nivel, Step, Valor } from './types';

export const SEM_DESTAQUE: Destaque = {};

export const ESTADO_INICIAL: EstadoGrafo = {
  v: 0,
  e: 0,
  incidencia: null,
  adjacencia: null,
  lista: null,
  grau: null,
  visitado: null,
  cor: null,
  conectividade: null,
  liberado: false,
  resultados: { triangulos: [], cliques: [] },
};

/** O trace ultrapassou o limite de passos para o nível pedido. */
export class LimiteDePassosError extends Error {
  constructor(readonly limite: number) {
    super(`Trace excedeu ${limite} passos`);
    this.name = 'LimiteDePassosError';
  }
}

/** Situação que o programa C garante não acontecer (ex.: aresta sem extremidades após validação). */
export class InvarianteError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'InvarianteError';
  }
}

/**
 * Grava a execução do programa. Mantém o estado atual imutável: cada passo guarda
 * apenas referências, e mutações copiam só o trecho alterado (copy-on-write).
 * Com `nivelMaximo = 0` nada é gravado e o engine roda na velocidade máxima.
 */
export class Recorder {
  readonly passos: Step[] = [];
  estado: EstadoGrafo = ESTADO_INICIAL;
  modulo: Modulo = 'entrada';
  private saida = '';
  private pilha: Frame[] = [];

  constructor(
    private readonly nivelMaximo: Nivel | 0,
    private readonly limite = Number.POSITIVE_INFINITY,
  ) {}

  get stdout(): string {
    return this.saida;
  }

  printf(texto: string): void {
    this.saida += texto;
  }

  entrar(fn: string, locais: Record<string, Valor> = {}): void {
    this.pilha.push({ fn, locais });
  }

  sair(): void {
    this.pilha.pop();
  }

  /** Atualiza variáveis locais do frame no topo da pilha. */
  local(valores: Record<string, Valor>): void {
    const topo = this.pilha[this.pilha.length - 1];
    if (!topo) {
      throw new InvarianteError('local() chamado sem função ativa');
    }
    this.pilha[this.pilha.length - 1] = { fn: topo.fn, locais: { ...topo.locais, ...valores } };
  }

  /** Remove variáveis que saíram de escopo (ex.: contador de um for encerrado). */
  descartar(...nomes: string[]): void {
    const topo = this.pilha[this.pilha.length - 1];
    if (topo) {
      this.pilha[this.pilha.length - 1] = {
        fn: topo.fn,
        locais: Object.fromEntries(Object.entries(topo.locais).filter(([nome]) => !nomes.includes(nome))),
      };
    }
  }

  mutar(atualizar: (estado: EstadoGrafo) => EstadoGrafo): void {
    this.estado = atualizar(this.estado);
  }

  passo(nivel: Nivel, linha: number, nota: string, destaque: Destaque = SEM_DESTAQUE): void {
    if (nivel > this.nivelMaximo) {
      return;
    }
    if (this.passos.length >= this.limite) {
      throw new LimiteDePassosError(this.limite);
    }
    this.passos.push({
      linha,
      modulo: this.modulo,
      nivel,
      pilha: [...this.pilha],
      estado: this.estado,
      destaque,
      stdoutFim: this.saida.length,
      nota,
    });
  }
}

/** Copia a matriz alterando uma única célula (as demais linhas são compartilhadas). */
export function comCelula<T>(matriz: ReadonlyArray<ReadonlyArray<T>>, i: number, j: number, valor: T): T[][] {
  return matriz.map((linha, indice) => (indice === i ? linha.map((atual, col) => (col === j ? valor : atual)) : (linha as T[])));
}

/** Copia o vetor alterando uma posição. */
export function comItem<T>(vetor: readonly T[], i: number, valor: T): T[] {
  return vetor.map((atual, indice) => (indice === i ? valor : atual));
}
