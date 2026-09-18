import { C_SOURCE } from './grafos-geral.generated';

export { C_SOURCE };

/** Linhas do código C (índice 0 = linha 1). */
export const C_LINHAS: readonly string[] = C_SOURCE.split('\n');

function inicioDaFuncao(fn: string): number {
  // Definição de função começa na coluna 0: "tipo nome (" — ignora chamadas indentadas.
  const assinatura = new RegExp(`^[A-Za-z_][\\w\\s*]*\\b${fn}\\s*\\(`);
  const indice = C_LINHAS.findIndex((linha) => assinatura.test(linha));
  if (indice === -1) {
    throw new Error(`Função "${fn}" não encontrada em grafos-geral.c`);
  }
  return indice;
}

/**
 * Número (1-based) da linha que contém `trecho` dentro da função `fn`.
 * Resolve âncoras por conteúdo, e não por número fixo, para que o engine
 * continue correto se grafos-geral.c for reformatado. Lança erro no carregamento
 * do módulo caso a âncora deixe de existir.
 */
export function lineOf(fn: string, trecho: string, ocorrencia = 1): number {
  const inicio = inicioDaFuncao(fn);
  let encontradas = 0;
  for (let i = inicio; i < C_LINHAS.length; i++) {
    const linha = C_LINHAS[i] ?? '';
    if (linha.includes(trecho) && ++encontradas === ocorrencia) {
      return i + 1;
    }
    if (i > inicio && linha === '}') {
      break;
    }
  }
  throw new Error(`Trecho "${trecho}" (ocorrência ${ocorrencia}) não encontrado em ${fn}()`);
}
