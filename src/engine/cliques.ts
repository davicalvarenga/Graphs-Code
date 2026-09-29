import { lineOf } from '@/c-source/source';
import { copiarAdjacencia, imprimirQuadrada, liberarMatrizes, multiplicar, potenciaDeA } from './matrizes';
import type { Recorder } from './recorder';
import type { Matriz } from './types';

const IC = {
  imprime: lineOf('imprimirClique', 'printf("} tamanho'),
};

const DT = {
  traco: lineOf('detectarTriangulos', 'traco += a3[i][i];'),
  cabecalho: lineOf('detectarTriangulos', 'printf("\\nTriângulos'),
  par: lineOf('detectarTriangulos', 'if(a[i][j] == 0 || a2[i][j] == 0)'),
  continua: lineOf('detectarTriangulos', 'continue;'),
  teste: lineOf('detectarTriangulos', 'if(a[i][k] == 1 && a[j][k] == 1)'),
  imprime: lineOf('detectarTriangulos', 'printf("  { %d %d %d }'),
  total: lineOf('detectarTriangulos', 'printf("Total de triângulos'),
};

const DC = {
  cabecalho: lineOf('detectarCliquesVizinhanca', 'printf("\\nCliques'),
  membroLaco: lineOf('detectarCliquesVizinhanca', 'membro[i] = (g->adjacencia[u][i] == 1);'),
  membroU: lineOf('detectarCliquesVizinhanca', 'membro[u] = true;'),
  ehClique: lineOf('detectarCliquesVizinhanca', 'bool ehClique = '),
  teste: lineOf('detectarCliquesVizinhanca', 'if(a2[u][p->vertice] != g->grau[u] - 1)'),
  falso: lineOf('detectarCliquesVizinhanca', 'ehClique = false;'),
  repetidoInicio: lineOf('detectarCliquesVizinhanca', 'bool repetido = false;'),
  compara: lineOf('detectarCliquesVizinhanca', 'while (i < n && encontrados[c][i] == membro[i])'),
  repetido: lineOf('detectarCliquesVizinhanca', 'repetido = true;'),
  decide: lineOf('detectarCliquesVizinhanca', 'if(ehClique && !repetido)'),
  guarda: lineOf('detectarCliquesVizinhanca', 'encontrados[total][i] = membro[i];'),
  imprime: lineOf('detectarCliquesVizinhanca', 'imprimirClique(n, membro'),
  total: lineOf('detectarCliquesVizinhanca', 'printf("Total de cliques'),
};

const AT = {
  pequeno: lineOf('acharTriangulo', 'if(n < 3)'),
  submatriz: lineOf('acharTriangulo', 'a[i][j] = g->adjacencia[vertices[i]][vertices[j]];'),
  potencias: lineOf('acharTriangulo', 'multiplicar(n, a2, a, a3);'),
  diagonal: lineOf('acharTriangulo', 'if(a3[i][i] == 0)'),
  par: lineOf('acharTriangulo', 'if(a[i][j] == 0 || a2[i][j] == 0)'),
  teste: lineOf('acharTriangulo', 'if(a[i][k] == 1 && a[j][k] == 1)'),
  achou: lineOf('acharTriangulo', 'return true;'),
  falhou: lineOf('acharTriangulo', 'return false;', 2),
};

const BC = {
  base: lineOf('buscarClique', 'if(k == 3)'),
  laco: lineOf('buscarClique', 'int u = vertices[i];'),
  vizinho: lineOf('buscarClique', 'vizinhos[m++] = vertices[j];'),
  recursao: lineOf('buscarClique', 'if(m >= k - 1 && buscarClique'),
  achou: lineOf('buscarClique', 'clique[0] = u;'),
  falhou: lineOf('buscarClique', 'return false;'),
};

const VC = {
  assinatura: lineOf('verificarClique', 'bool verificarClique'),
  busca: lineOf('verificarClique', 'if(!buscarClique'),
  nao: lineOf('verificarClique', 'printf("Possui clique de tamanho %d: Não'),
  ordena: lineOf('verificarClique', 'int aux = clique[j];'),
  sim: lineOf('verificarClique', 'printf("Possui clique de tamanho %d: Sim'),
};

const VT = {
  maior: lineOf('verificarTamanhosClique', 'int maior = '),
  laco: lineOf('verificarTamanhosClique', 'for (int k = 3; verificarClique(g, k); k++)'),
  resultado: lineOf('verificarTamanhosClique', 'printf("Maior clique'),
};

const MQ = {
  cabecalho: lineOf('moduloCliques', 'printf("\\n===== CLIQUES'),
  copia: lineOf('moduloCliques', 'copiarAdjacencia(g, n, a);'),
  a2: lineOf('moduloCliques', 'multiplicar(n, a, a, a2);'),
  a3: lineOf('moduloCliques', 'multiplicar(n, a2, a, a3);'),
  imprimeA2: lineOf('moduloCliques', 'printf("A^2 (vizinhos em comum)'),
  imprimeA3: lineOf('moduloCliques', 'printf("\\nA^3 (diagonal'),
  triangulos: lineOf('moduloCliques', 'detectarTriangulos(n, a, a2, a3);'),
  vizinhanca: lineOf('moduloCliques', 'detectarCliquesVizinhanca(g, n, a2);'),
  tamanhos: lineOf('moduloCliques', 'verificarTamanhosClique(g);'),
};

function conjunto(membro: readonly boolean[]): string {
  return `{ ${membro.flatMap((m, i) => (m ? [i] : [])).join(' ')} }`;
}

function detectarTriangulos(rec: Recorder, a: Matriz, a2: Matriz, a3: Matriz): void {
  const n = rec.estado.v;
  let traco = 0;
  rec.entrar('detectarTriangulos', { n, traco });
  for (let i = 0; i < n; i++) {
    traco += a3[i]?.[i] ?? 0;
    rec.local({ i, traco });
    rec.passo(3, DT.traco, `${potenciaDeA(3)}[${i}][${i}] = ${a3[i]?.[i] ?? 0}: passeios de comprimento 3 que saem de ${i} e voltam. traço = ${traco}.`, {
      celulas: [{ matriz: 'a3', i, j: i, tipo: 'atual' }],
      vertices: [{ id: i, tipo: 'atual' }],
    });
  }
  rec.printf('\nTriângulos (K_3):\n');
  rec.passo(1, DT.cabecalho, `traço(${potenciaDeA(3)}) = ${traco}: cada triângulo é contado 6 vezes (3 vértices × 2 sentidos).`);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const aresta = a[i]?.[j] === 1;
      const vizinhosComuns = a2[i]?.[j] ?? 0;
      const segue = aresta && vizinhosComuns > 0;
      rec.local({ i, j, k: null });
      rec.passo(segue ? 2 : 3, DT.par, `a[${i}][${j}] = ${aresta ? 1 : 0} e ${potenciaDeA(2)}[${i}][${j}] = ${vizinhosComuns}: ${segue ? `${i} e ${j} são adjacentes e têm ${vizinhosComuns} vizinho(s) em comum` : 'sem triângulo possível nesse par'}.`, {
        celulas: [
          { matriz: 'a', i, j, tipo: aresta ? 'sucesso' : 'falha' },
          { matriz: 'a2', i, j, tipo: vizinhosComuns > 0 ? 'sucesso' : 'falha' },
        ],
        vertices: [
          { id: i, tipo: 'atual' },
          { id: j, tipo: segue ? 'atual' : 'comparado' },
        ],
        arestas: aresta ? [{ u: i, w: j, tipo: segue ? 'atual' : 'comparado' }] : [],
      });
      if (!segue) {
        rec.passo(3, DT.continua, `Pula o par ${i}–${j}.`);
        continue;
      }
      for (let k = j + 1; k < n; k++) {
        const ik = a[i]?.[k] === 1;
        const jk = a[j]?.[k] === 1;
        const triangulo = ik && jk;
        rec.local({ k });
        rec.passo(3, DT.teste, `Testa { ${i} ${j} ${k} }: ${i}–${k} ${ik ? '✓' : '✗'}, ${j}–${k} ${jk ? '✓' : '✗'}.`, {
          celulas: [
            { matriz: 'a', i, j: k, tipo: ik ? 'sucesso' : 'falha' },
            { matriz: 'a', i: j, j: k, tipo: jk ? 'sucesso' : 'falha' },
          ],
          vertices: [
            { id: i, tipo: 'atual' },
            { id: j, tipo: 'atual' },
            { id: k, tipo: triangulo ? 'sucesso' : 'comparado' },
          ],
          arestas: [
            { u: i, w: j, tipo: 'atual' },
            ...(ik ? [{ u: i, w: k, tipo: 'atual' as const }] : []),
            ...(jk ? [{ u: j, w: k, tipo: 'atual' as const }] : []),
          ],
        });
        if (triangulo) {
          rec.printf(`  { ${i} ${j} ${k} }\n`);
          rec.mutar((g) => ({ ...g, resultados: { ...g.resultados, triangulos: [...g.resultados.triangulos, [i, j, k] as const] } }));
          rec.passo(2, DT.imprime, `Triângulo encontrado: { ${i} ${j} ${k} }.`, {
            vertices: [i, j, k].map((id) => ({ id, tipo: 'sucesso' as const })),
            arestas: [
              { u: i, w: j, tipo: 'sucesso' },
              { u: j, w: k, tipo: 'sucesso' },
              { u: i, w: k, tipo: 'sucesso' },
            ],
          });
        }
      }
    }
  }
  rec.printf(`Total de triângulos: traço(A^3) / 6 = ${traco} / 6 = ${Math.trunc(traco / 6)}\n`);
  rec.mutar((g) => ({ ...g, resultados: { ...g.resultados, tracoA3: traco } }));
  rec.descartar('i', 'j', 'k');
  rec.passo(1, DT.total, `Total de triângulos: ${traco} / 6 = ${Math.trunc(traco / 6)}.`);
  rec.sair();
}

function detectarCliquesVizinhanca(rec: Recorder, a2: Matriz): void {
  const n = rec.estado.v;
  const encontrados: boolean[][] = [];
  let total = 0;
  rec.entrar('detectarCliquesVizinhanca', { n, total });
  rec.printf('\nCliques da forma {u} U N(u):\n');
  rec.passo(1, DC.cabecalho, `Para cada u, testa se u e seus vizinhos formam um clique — agora pelo ${potenciaDeA(2)}, sem comparar os pares um a um.`);

  for (let u = 0; u < n; u++) {
    const membro: boolean[] = [];
    rec.local({ u, membro: '{ }', ehClique: null, repetido: null });
    for (let i = 0; i < n; i++) {
      membro[i] = rec.estado.adjacencia?.[u]?.[i] === 1;
      rec.local({ i, membro: conjunto(membro) });
      rec.passo(3, DC.membroLaco, `membro[${i}] = ${membro[i] ? 'true' : 'false'}.`, {
        celulas: [{ matriz: 'adjacencia', i: u, j: i, tipo: membro[i] ? 'sucesso' : 'comparado' }],
        vertices: [{ id: i, tipo: membro[i] ? 'sucesso' : 'comparado' }],
      });
    }
    membro[u] = true;
    const membros = membro.flatMap((m, i) => (m ? [i] : []));
    rec.local({ membro: conjunto(membro) });
    rec.passo(2, DC.membroU, `Candidato {${u}} ∪ N(${u}) = ${conjunto(membro)}.`, {
      vertices: membros.map((id) => ({ id, tipo: id === u ? ('atual' as const) : ('comparado' as const) })),
    });

    const grau = rec.estado.grau?.[u] ?? 0;
    let ehClique = grau > 0;
    rec.local({ ehClique });
    rec.passo(3, DC.ehClique, grau > 0 ? `grau[${u}] = ${grau} > 0: começa assumindo clique.` : `${u} é isolado: não conta como clique.`);

    for (const w of rec.estado.lista?.[u] ?? []) {
      const comuns = a2[u]?.[w] ?? 0;
      const completo = comuns === grau - 1;
      rec.local({ 'p->vertice': w });
      rec.passo(3, DC.teste, `${potenciaDeA(2)}[${u}][${w}] = ${comuns}: ${w} tem ${comuns} vizinho(s) em comum com ${u}; num clique precisaria de ${grau - 1}.`, {
        celulas: [{ matriz: 'a2', i: u, j: w, tipo: completo ? 'sucesso' : 'falha' }],
        vertices: [
          { id: u, tipo: 'atual' },
          { id: w, tipo: completo ? 'sucesso' : 'falha' },
        ],
        arestas: [{ u, w, tipo: completo ? 'sucesso' : 'falha' }],
      });
      if (!completo) {
        ehClique = false;
        rec.local({ ehClique });
        rec.passo(3, DC.falso, `${w} não se liga a todos os outros vizinhos de ${u}: não é clique.`);
      }
    }

    let repetido = false;
    rec.local({ repetido });
    rec.passo(3, DC.repetidoInicio, `Verifica se ${conjunto(membro)} já foi listado (${total} clique(s) guardado(s)).`);
    for (let c = 0; c < total; c++) {
      const guardado = encontrados[c] ?? [];
      let i = 0;
      while (i < n && guardado[i] === membro[i]) {
        i++;
      }
      rec.local({ c, i });
      rec.passo(3, DC.compara, i === n ? `Igual ao clique ${conjunto(guardado)}.` : `Difere de ${conjunto(guardado)} na posição ${i}.`);
      if (i === n) {
        repetido = true;
        rec.local({ repetido });
        rec.passo(3, DC.repetido, 'Já listado: repetido = true.');
      }
    }

    const novo = ehClique && !repetido;
    rec.passo(2, DC.decide, novo ? `${conjunto(membro)} é um clique novo.` : ehClique ? 'Clique repetido: não imprime.' : 'Não é clique.', {
      vertices: membros.map((id) => ({ id, tipo: novo ? ('sucesso' as const) : ehClique ? ('comparado' as const) : ('falha' as const) })),
    });
    if (novo) {
      encontrados[total] = [...membro];
      rec.passo(3, DC.guarda, 'Guarda o conjunto em encontrados[total].');
      const tamanho = grau + 1;
      rec.passo(3, DC.imprime, `Chama imprimirClique com tamanho ${tamanho}.`);
      rec.entrar('imprimirClique', { v: n, tamanho });
      rec.printf(`  { ${membros.map((i) => `${i} `).join('')}} tamanho ${tamanho}\n`);
      rec.mutar((g) => ({ ...g, resultados: { ...g.resultados, cliques: [...g.resultados.cliques, { membros, tamanho }] } }));
      rec.passo(2, IC.imprime, `Clique ${conjunto(membro)} de tamanho ${tamanho}.`, {
        vertices: membros.map((id) => ({ id, tipo: 'sucesso' as const })),
        arestas: membros.flatMap((x, ia) => membros.slice(ia + 1).map((y) => ({ u: x, w: y, tipo: 'sucesso' as const }))),
      });
      rec.sair();
      total++;
      rec.local({ total });
    }
  }
  rec.printf(`Total de cliques: ${total}\n`);
  rec.passo(1, DC.total, `Total de cliques: ${total}.`);
  rec.sair();
}

/** acharTriangulo: procura um triângulo dentro do subconjunto `vertices`, via A³ da submatriz. */
function acharTriangulo(rec: Recorder, vertices: readonly number[], nivel: number): number[] | null {
  const n = vertices.length;
  rec.entrar('acharTriangulo', { n, vertices: `{ ${vertices.join(' ')} }` });
  rec.passo(3, AT.pequeno, n < 3 ? `Só ${n} vértice(s): não cabe triângulo.` : `${n} vértices candidatos: monta a submatriz de adjacência.`);
  if (n < 3) {
    rec.sair();
    return null;
  }

  const sufixo = `_${nivel}`;
  const a = vertices.map((u) => vertices.map((w) => (rec.estado.adjacencia?.[u]?.[w] ?? 0)));
  rec.mutar((g) => ({
    ...g,
    matrizes: [
      ...(g.matrizes ?? []).filter((m) => m.nome !== `sub${sufixo}`),
      { nome: `sub${sufixo}`, rotulo: `submatriz de { ${vertices.join(' ')} }`, celulas: a },
    ],
  }));
  rec.passo(2, AT.submatriz, `Submatriz com as arestas entre { ${vertices.join(' ')} }.`, {
    vertices: vertices.map((id) => ({ id, tipo: 'comparado' as const })),
  });

  const a2 = multiplicar(rec, { nome: `sub${sufixo}`, valores: a }, { nome: `sub${sufixo}`, valores: a }, { nome: `sub2${sufixo}`, rotulo: 'submatriz²' }, vertices);
  const a3 = multiplicar(rec, { nome: `sub2${sufixo}`, valores: a2 }, { nome: `sub${sufixo}`, valores: a }, { nome: `sub3${sufixo}`, rotulo: 'submatriz³' }, vertices);
  rec.passo(2, AT.potencias, 'Com as potências prontas, procura um vértice com triângulo na diagonal.');

  for (let i = 0; i < n; i++) {
    const diagonal = a3[i]?.[i] ?? 0;
    rec.local({ i, j: null, k: null });
    rec.passo(3, AT.diagonal, diagonal === 0 ? `Nenhum triângulo passa por ${vertices[i]}.` : `${diagonal} passeio(s) de volta a ${vertices[i]}: pode haver triângulo.`, {
      vertices: [{ id: vertices[i] as number, tipo: diagonal === 0 ? 'falha' : 'atual' }],
    });
    if (diagonal === 0) {
      continue;
    }
    for (let j = 0; j < n; j++) {
      const adjacentes = a[i]?.[j] === 1 && (a2[i]?.[j] ?? 0) > 0;
      rec.local({ j });
      rec.passo(3, AT.par, adjacentes ? `${vertices[i]} e ${vertices[j]} são adjacentes e têm vizinho em comum.` : `Par ${vertices[i]}–${vertices[j]} descartado.`);
      if (!adjacentes) {
        continue;
      }
      for (let k = 0; k < n; k++) {
        const fecha = a[i]?.[k] === 1 && a[j]?.[k] === 1;
        rec.local({ k });
        rec.passo(3, AT.teste, fecha ? `${vertices[k]} fecha o triângulo.` : `${vertices[k]} não fecha o triângulo.`, {
          vertices: [
            { id: vertices[i] as number, tipo: 'atual' },
            { id: vertices[j] as number, tipo: 'atual' },
            { id: vertices[k] as number, tipo: fecha ? 'sucesso' : 'comparado' },
          ],
        });
        if (fecha) {
          const triangulo = [vertices[i] as number, vertices[j] as number, vertices[k] as number];
          rec.passo(1, AT.achou, `Triângulo { ${triangulo.join(' ')} } encontrado.`, {
            vertices: triangulo.map((id) => ({ id, tipo: 'sucesso' as const })),
            arestas: [
              { u: triangulo[0] as number, w: triangulo[1] as number, tipo: 'sucesso' },
              { u: triangulo[1] as number, w: triangulo[2] as number, tipo: 'sucesso' },
              { u: triangulo[0] as number, w: triangulo[2] as number, tipo: 'sucesso' },
            ],
          });
          liberarMatrizes(rec, `sub${sufixo}`, `sub2${sufixo}`, `sub3${sufixo}`);
          rec.sair();
          return triangulo;
        }
      }
    }
  }
  rec.passo(2, AT.falhou, 'Nenhum triângulo nesse subconjunto.');
  liberarMatrizes(rec, `sub${sufixo}`, `sub2${sufixo}`, `sub3${sufixo}`);
  rec.sair();
  return null;
}

/** buscarClique: escolhe u, reduz o problema à vizinhança de u e procura um clique de k-1 lá dentro. */
function buscarClique(rec: Recorder, vertices: readonly number[], k: number, nivel: number): number[] | null {
  const n = vertices.length;
  rec.entrar('buscarClique', { n, k, vertices: `{ ${vertices.join(' ')} }` });
  rec.passo(2, BC.base, k === 3 ? 'k = 3: cai no caso base, procurar um triângulo.' : `k = ${k}: escolhe um vértice e procura um clique de ${k - 1} entre os vizinhos dele.`);
  if (k === 3) {
    const triangulo = acharTriangulo(rec, vertices, nivel);
    rec.sair();
    return triangulo;
  }

  for (let i = 0; i < n; i++) {
    const u = vertices[i] as number;
    const vizinhos = vertices.slice(i + 1).filter((w) => rec.estado.adjacencia?.[u]?.[w] === 1);
    rec.local({ i, u, m: vizinhos.length });
    rec.passo(2, BC.laco, `Tenta ${u}: vizinhos depois dele = { ${vizinhos.join(' ')} }.`, {
      vertices: [{ id: u, tipo: 'atual' }, ...vizinhos.map((id) => ({ id, tipo: 'comparado' as const }))],
      arestas: vizinhos.map((w) => ({ u, w, tipo: 'comparado' as const })),
    });
    rec.passo(3, BC.vizinho, `${vizinhos.length} vizinho(s) candidatos.`);
    rec.passo(3, BC.recursao, vizinhos.length >= k - 1 ? `Há candidatos suficientes: busca um clique de ${k - 1} entre eles.` : `Só ${vizinhos.length} vizinho(s): menos que os ${k - 1} necessários.`);
    if (vizinhos.length >= k - 1) {
      const resto = buscarClique(rec, vizinhos, k - 1, nivel + 1);
      if (resto) {
        rec.passo(1, BC.achou, `${u} entra no clique: { ${[u, ...resto].join(' ')} }.`, {
          vertices: [u, ...resto].map((id) => ({ id, tipo: 'sucesso' as const })),
        });
        rec.sair();
        return [u, ...resto];
      }
    }
  }
  rec.passo(2, BC.falhou, `Nenhum clique de tamanho ${k} entre { ${vertices.join(' ')} }.`);
  rec.sair();
  return null;
}

function verificarClique(rec: Recorder, k: number): boolean {
  const n = rec.estado.v;
  rec.entrar('verificarClique', { k });
  rec.passo(1, VC.assinatura, `Procura um clique de tamanho ${k}.`);
  const clique = buscarClique(rec, Array.from({ length: n }, (_, i) => i), k, 0);
  rec.passo(2, VC.busca, clique ? `Busca encontrou { ${clique.join(' ')} }.` : `Nenhum clique de tamanho ${k}.`);

  if (!clique) {
    rec.printf(`Possui clique de tamanho ${k}: Não\n`);
    rec.mutar((g) => ({ ...g, resultados: { ...g.resultados, cliquesPorTamanho: [...(g.resultados.cliquesPorTamanho ?? []), { k, membros: null }] } }));
    rec.passo(1, VC.nao, `Possui clique de tamanho ${k}: Não.`);
    rec.sair();
    return false;
  }

  const ordenado = [...clique].sort((x, y) => x - y);
  rec.passo(3, VC.ordena, `Ordena o clique por inserção: { ${ordenado.join(' ')} }.`);
  rec.printf(`Possui clique de tamanho ${k}: Sim { ${ordenado.map((i) => `${i} `).join('')}}\n`);
  rec.mutar((g) => ({ ...g, resultados: { ...g.resultados, cliquesPorTamanho: [...(g.resultados.cliquesPorTamanho ?? []), { k, membros: ordenado }] } }));
  rec.passo(1, VC.sim, `Possui clique de tamanho ${k}: { ${ordenado.join(' ')} }.`, {
    vertices: ordenado.map((id) => ({ id, tipo: 'sucesso' as const })),
    arestas: ordenado.flatMap((x, ia) => ordenado.slice(ia + 1).map((y) => ({ u: x, w: y, tipo: 'sucesso' as const }))),
  });
  rec.sair();
  return true;
}

function verificarTamanhosClique(rec: Recorder): void {
  let maior = rec.estado.e > 0 ? 2 : 1;
  rec.entrar('verificarTamanhosClique', { maior });
  rec.printf('\n');
  rec.passo(1, VT.maior, `Com ${rec.estado.e} aresta(s), o maior clique começa valendo ${maior}: sobe enquanto houver clique maior.`);
  for (let k = 3; verificarClique(rec, k); k++) {
    maior = k;
    rec.local({ k, maior });
    rec.passo(2, VT.laco, `Achou clique de ${k}: tenta ${k + 1}.`);
  }
  rec.printf(`Maior clique: tamanho ${maior}\n`);
  rec.mutar((g) => ({ ...g, resultados: { ...g.resultados, maiorClique: maior } }));
  rec.passo(1, VT.resultado, `Maior clique: tamanho ${maior}.`);
  rec.sair();
}

export function moduloCliques(rec: Recorder): void {
  rec.entrar('moduloCliques', { n: rec.estado.v });
  rec.printf('\n===== CLIQUES =====\n');
  rec.passo(1, MQ.cabecalho, `Início do módulo de cliques: as potências ${potenciaDeA(2)} e ${potenciaDeA(3)} respondem quase tudo.`);

  rec.passo(2, MQ.copia, 'Copia a adjacência para a matriz local a.');
  const a = copiarAdjacencia(rec, 'a', 'a · adjacência');
  rec.passo(2, MQ.a2, `${potenciaDeA(2)} = a × a: quantos vizinhos em comum cada par tem.`);
  const a2 = multiplicar(rec, { nome: 'a', valores: a }, { nome: 'a', valores: a }, { nome: 'a2', rotulo: `${potenciaDeA(2)} · vizinhos em comum` });
  rec.passo(2, MQ.a3, `${potenciaDeA(3)} = ${potenciaDeA(2)} × a: a diagonal conta os passeios de comprimento 3 que voltam ao próprio vértice.`);
  const a3 = multiplicar(rec, { nome: 'a2', valores: a2 }, { nome: 'a', valores: a }, { nome: 'a3', rotulo: `${potenciaDeA(3)} · diagonal = 2 × triângulos` });

  rec.printf('A^2 (vizinhos em comum):\n');
  rec.passo(2, MQ.imprimeA2, `Imprime ${potenciaDeA(2)}.`);
  imprimirQuadrada(rec, a2, 'a2');
  rec.printf('\nA^3 (diagonal = 2 x triângulos do vértice):\n');
  rec.passo(2, MQ.imprimeA3, `Imprime ${potenciaDeA(3)}.`);
  imprimirQuadrada(rec, a3, 'a3');

  rec.passo(1, MQ.triangulos, 'Detecta os triângulos.');
  detectarTriangulos(rec, a, a2, a3);
  rec.passo(1, MQ.vizinhanca, 'Detecta os cliques formados por um vértice e sua vizinhança.');
  detectarCliquesVizinhanca(rec, a2);
  rec.passo(1, MQ.tamanhos, 'Procura cliques por tamanho, do 3 em diante.');
  verificarTamanhosClique(rec);

  liberarMatrizes(rec, 'a', 'a2', 'a3');
  rec.sair();
}
