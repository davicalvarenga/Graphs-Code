import { lineOf } from '@/c-source/source';
import { moduloClassificacao } from './classificacao';
import { moduloCliques } from './cliques';
import { moduloEntrada } from './entrada';
import { paraStdin, type EntradaPrograma } from './exemplos';
import { comItem, InvarianteError, LimiteDePassosError, Recorder } from './recorder';
import { Stdin } from './scanf';
import { moduloTransformacoes } from './transformacoes';
import type { Nivel, ResultadoTrace, Trace } from './types';

const MAIN = {
  inicio: lineOf('main', 'struct Grafo g = {0};'),
  entrada: lineOf('main', 'if(!moduloEntrada(&g))'),
  liberaErro: lineOf('main', 'liberarGrafo(&g);', 1),
  falha: lineOf('main', 'return EXIT_FAILURE;'),
  transformacoes: lineOf('main', 'moduloTransformacoes(&g);'),
  classificacao: lineOf('main', 'moduloClassificacao(&g);'),
  cliques: lineOf('main', 'moduloCliques(&g);'),
  libera: lineOf('main', 'liberarGrafo(&g);', 2),
  sucesso: lineOf('main', 'return 0;'),
};

const LG = {
  assinatura: lineOf('liberarGrafo', 'void liberarGrafo'),
  linhas: lineOf('liberarGrafo', 'free(g->adjacencia[i]);'),
  no: lineOf('liberarGrafo', 'free(aux);'),
  vetores: lineOf('liberarGrafo', 'free(g->grau);'),
};

/** Limite de passos gravados; acima dele o trace é regravado com menos detalhe. */
export const MAX_PASSOS = 75_000;

/** Tamanho máximo aceito para o texto de entrada (20×190 tokens cabem com folga). */
export const MAX_CARACTERES_ENTRADA = 20_000;

function liberarGrafo(rec: Recorder): void {
  const { v } = rec.estado;
  rec.entrar('liberarGrafo');
  rec.passo(1, LG.assinatura, v > 0 ? 'Libera toda a memória alocada pelo grafo.' : 'g->v = 0: criarGrafo não chegou a ser chamado, nada a liberar nas linhas.');
  for (let i = 0; i < v; i++) {
    rec.local({ i });
    rec.passo(2, LG.linhas, `Libera as linhas ${i} das matrizes de incidência e adjacência.`, { vertices: [{ id: i, tipo: 'atual' }] });
    const tamanho = rec.estado.lista?.[i]?.length ?? 0;
    for (let n = 0; n < tamanho; n++) {
      rec.mutar((g) => ({ ...g, lista: comItem(g.lista ?? [], i, (g.lista?.[i] ?? []).slice(1)) }));
      rec.passo(3, LG.no, `free(aux): remove a cabeça da lista de ${i}.`, { vertices: [{ id: i, tipo: 'atual' }] });
    }
  }
  rec.mutar((g) => ({ ...g, liberado: true }));
  rec.passo(1, LG.vetores, 'Libera os vetores principais da struct.');
  rec.sair();
}

/** Executa main() do programa C gravando os passos até `nivel`. */
export function executar(stdin: string, nivel: Nivel | 0, limite = Number.POSITIVE_INFINITY): Trace {
  const rec = new Recorder(nivel, limite);
  rec.entrar('main');
  rec.passo(1, MAIN.inicio, 'main: declara a struct Grafo zerada.');

  rec.passo(1, MAIN.entrada, 'Chama o módulo de entrada e validação.');
  if (!moduloEntrada(rec, new Stdin(stdin))) {
    rec.passo(1, MAIN.liberaErro, 'A entrada falhou: libera o que foi alocado.');
    liberarGrafo(rec);
    rec.modulo = 'fim';
    rec.passo(1, MAIN.falha, 'Programa termina com EXIT_FAILURE.');
    return { passos: rec.passos, stdout: rec.stdout, exitCode: 1, nivelGravado: nivel === 0 ? 1 : nivel };
  }

  rec.modulo = 'transformacoes';
  rec.passo(1, MAIN.transformacoes, 'Chama o módulo de transformações.');
  moduloTransformacoes(rec);

  rec.modulo = 'classificacao';
  rec.passo(1, MAIN.classificacao, 'Chama o módulo de classificação.');
  moduloClassificacao(rec);

  rec.modulo = 'cliques';
  rec.passo(1, MAIN.cliques, 'Chama o módulo de cliques.');
  moduloCliques(rec);

  rec.modulo = 'fim';
  rec.passo(1, MAIN.libera, 'Libera a memória do grafo.');
  liberarGrafo(rec);
  rec.passo(1, MAIN.sucesso, 'Programa termina com sucesso (return 0).');
  return { passos: rec.passos, stdout: rec.stdout, exitCode: 0, nivelGravado: nivel === 0 ? 1 : nivel };
}

/**
 * Monta o trace completo para a UI. Se o nível 3 exceder MAX_PASSOS, regrava com
 * nível 2 e depois 1. Erros internos viram `{ ok: false }` em vez de exceção.
 */
export function buildTrace(entrada: EntradaPrograma, limite = MAX_PASSOS): ResultadoTrace {
  const stdin = paraStdin(entrada);
  if (stdin.length > MAX_CARACTERES_ENTRADA) {
    return { ok: false, erro: `Entrada muito grande (máximo de ${MAX_CARACTERES_ENTRADA} caracteres).` };
  }
  for (const nivel of [3, 2, 1] as const) {
    try {
      return { ok: true, trace: executar(stdin, nivel, limite) };
    } catch (erro) {
      if (erro instanceof LimiteDePassosError) {
        continue;
      }
      const detalhe = erro instanceof InvarianteError ? erro.message : 'erro inesperado';
      return { ok: false, erro: `Falha interna ao simular o programa: ${detalhe}.` };
    }
  }
  return { ok: false, erro: `A execução gera mais de ${limite} passos mesmo no nível mínimo de detalhe.` };
}
