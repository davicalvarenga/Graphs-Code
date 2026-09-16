import { Fragment, type ReactNode } from 'react';

// Trechos que devem sair em monoespaçada dentro da frase: acessos a vetores
// (grau[2]), chamadas (dfs(4)) e nomes de coluna/vértice (e5, v3).
const CODIGO = /([A-Za-z_]\w*(?:\[[^\]]*\])+|[A-Za-z_]\w*\([^)]*\)|\b[ev]\d+\b)/g;

/** Quebra a nota do passo em texto comum e trechos de código. */
export function partesDaNota(nota: string): Array<{ texto: string; codigo: boolean }> {
  // split com grupo de captura alterna texto comum e trecho capturado, então a
  // paridade do índice precisa ser lida antes de descartar as partes vazias.
  return nota
    .split(CODIGO)
    .map((parte, indice) => ({ texto: parte, codigo: indice % 2 === 1 }))
    .filter((parte) => parte.texto !== '');
}

/** A frase do passo, com os trechos de código em monoespaçada. */
export function Nota({ nota }: { nota: string }): ReactNode {
  return partesDaNota(nota).map((parte, indice) => (
    <Fragment key={indice}>
      {parte.codigo ? <span className="font-mono text-[0.88em] text-acento-700">{parte.texto}</span> : parte.texto}
    </Fragment>
  ));
}
