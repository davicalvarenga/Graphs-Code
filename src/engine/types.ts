/** Módulos do programa, na ordem em que main() os chama. */
export type Modulo = 'entrada' | 'transformacoes' | 'classificacao' | 'cliques' | 'conectividade' | 'fim';

/**
 * Granularidade do passo:
 * 1 = chamadas, retornos e resultados; 2 = iterações externas e mutações; 3 = toda linha.
 */
export type Nivel = 1 | 2 | 3;

export type Valor = number | boolean | string | null;

/** Registro de ativação: função em execução e suas variáveis locais visíveis. */
export interface Frame {
  readonly fn: string;
  readonly locais: Readonly<Record<string, Valor>>;
}

export type Matriz = ReadonlyArray<ReadonlyArray<number>>;

export type Euleriano = 'ciclo' | 'caminho' | 'nao';

export interface Clique {
  readonly membros: readonly number[];
  readonly tamanho: number;
}

/** Conclusões já impressas pelo programa (derivadas da saída, para a visualização). */
export interface Resultados {
  readonly valida?: boolean;
  readonly erro?: string;
  readonly completo?: boolean;
  readonly ciclo?: boolean;
  readonly roda?: boolean;
  readonly centro?: number;
  readonly euleriano?: Euleriano;
  readonly bipartido?: { readonly X: readonly number[]; readonly Y: readonly number[] } | false;
  readonly triangulos: ReadonlyArray<readonly [number, number, number]>;
  readonly cliques: readonly Clique[];
  readonly conexo?: boolean;
  /** S = A + A² + … + Aⁿ⁻¹ ao fim do módulo de conectividade. */
  readonly somaCaminhos?: Matriz;
}

/**
 * Matrizes locais de moduloConectividade enquanto a função está na pilha.
 * `proxima` começa com lixo de memória (null) e guarda o produto anterior entre as rodadas.
 */
export interface EstadoConectividade {
  /** Potência já contida em `potencia`: Aʳ. */
  readonly r: number;
  readonly potencia: Matriz;
  readonly proxima: ReadonlyArray<ReadonlyArray<number | null>>;
  readonly soma: Matriz;
}

/**
 * Espelho imutável de `struct Grafo` mais os vetores locais relevantes
 * (visitado[], cor[]) enquanto existem na pilha do C.
 */
export interface EstadoGrafo {
  readonly v: number;
  readonly e: number;
  /** null = ainda não alocada; célula null = memória alocada mas não lida (lixo). */
  readonly incidencia: ReadonlyArray<ReadonlyArray<number | null>> | null;
  readonly adjacencia: Matriz | null;
  /** Cada lista na ordem de encadeamento (cabeça primeiro). */
  readonly lista: Matriz | null;
  readonly grau: ReadonlyArray<number | null> | null;
  readonly visitado: readonly boolean[] | null;
  readonly cor: readonly number[] | null;
  readonly conectividade: EstadoConectividade | null;
  readonly liberado: boolean;
  readonly resultados: Resultados;
}

export type MatrizDestacavel = 'incidencia' | 'adjacencia' | 'potencia' | 'proxima' | 'soma';

export type TipoDestaque = 'atual' | 'comparado' | 'sucesso' | 'falha';

export interface Destaque {
  readonly vertices?: ReadonlyArray<{ readonly id: number; readonly tipo: TipoDestaque }>;
  readonly arestas?: ReadonlyArray<{ readonly u: number; readonly w: number; readonly tipo: TipoDestaque }>;
  readonly celulas?: ReadonlyArray<{
    readonly matriz: MatrizDestacavel;
    readonly i: number;
    readonly j: number;
    readonly tipo: TipoDestaque;
  }>;
  /** Nó da lista de adjacência em foco: lista[u][indice]. */
  readonly no?: { readonly u: number; readonly indice: number };
  /** Vértice ignorado pela DFS (centro da roda). */
  readonly ignorado?: number;
}

export interface Step {
  /** Linha (1-based) de grafos-geral.c em execução. */
  readonly linha: number;
  readonly modulo: Modulo;
  readonly nivel: Nivel;
  readonly pilha: readonly Frame[];
  readonly estado: EstadoGrafo;
  readonly destaque: Destaque;
  /** Quantos caracteres do stdout já foram impressos neste passo. */
  readonly stdoutFim: number;
  /** Explicação em português do que a linha faz. */
  readonly nota: string;
}

export interface Trace {
  readonly passos: readonly Step[];
  readonly stdout: string;
  readonly exitCode: 0 | 1;
  /** Nível máximo efetivamente gravado (reduzido quando o trace excede o limite). */
  readonly nivelGravado: Nivel;
}

export type ResultadoTrace = { readonly ok: true; readonly trace: Trace } | { readonly ok: false; readonly erro: string };
