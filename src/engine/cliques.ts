import { lineOf } from '@/c-source/source';
import type { Recorder } from './recorder';

const DT = {
  cabecalho: lineOf('detectarTriangulos', 'printf("Triângulos'),
  par: lineOf('detectarTriangulos', 'if(g->adjacencia[i][j] == 0)'),
  continua: lineOf('detectarTriangulos', 'continue;'),
  teste: lineOf('detectarTriangulos', 'if(g->adjacencia[j][k] == 1 && g->adjacencia[i][k] == 1)'),
  imprime: lineOf('detectarTriangulos', 'printf("  { %d %d %d }'),
  total: lineOf('detectarTriangulos', 'printf("Total de triângulos'),
};

const DC = {
  cabecalho: lineOf('detectarCliquesVizinhanca', 'printf("\\nCliques'),
  membroLaco: lineOf('detectarCliquesVizinhanca', 'membro[i] = (g->adjacencia[u][i] == 1);'),
  membroU: lineOf('detectarCliquesVizinhanca', 'membro[u] = true;'),
  ehClique: lineOf('detectarCliquesVizinhanca', 'bool ehClique = '),
  teste: lineOf('detectarCliquesVizinhanca', 'if(g->adjacencia[a->vertice][b->vertice] == 0)'),
  falso: lineOf('detectarCliquesVizinhanca', 'ehClique = false;'),
  repetidoInicio: lineOf('detectarCliquesVizinhanca', 'bool repetido = false;'),
  compara: lineOf('detectarCliquesVizinhanca', 'while (i < g->v && encontrados[c][i] == membro[i])'),
  repetido: lineOf('detectarCliquesVizinhanca', 'repetido = true;'),
  decide: lineOf('detectarCliquesVizinhanca', 'if(ehClique && !repetido)'),
  guarda: lineOf('detectarCliquesVizinhanca', 'encontrados[total][i] = membro[i];'),
  imprime: lineOf('detectarCliquesVizinhanca', 'imprimirClique(g->v, membro'),
  total: lineOf('detectarCliquesVizinhanca', 'printf("Total de cliques'),
};

const MQ = {
  cabecalho: lineOf('moduloCliques', 'printf("\\n===== CLIQUES'),
  triangulos: lineOf('moduloCliques', 'detectarTriangulos(g);'),
  vizinhanca: lineOf('moduloCliques', 'detectarCliquesVizinhanca(g);'),
};

const IC = {
  imprime: lineOf('imprimirClique', 'printf("} tamanho'),
};

function adjacente(rec: Recorder, i: number, j: number): boolean {
  return rec.estado.adjacencia?.[i]?.[j] === 1;
}

function detectarTriangulos(rec: Recorder): void {
  const { v } = rec.estado;
  let total = 0;
  rec.entrar('detectarTriangulos', { total });
  rec.printf('Triângulos (K_3):\n');
  rec.passo(1, DT.cabecalho, 'Testa todo trio i < j < k: é triângulo se os três pares forem adjacentes.');

  for (let i = 0; i < v; i++) {
    for (let j = i + 1; j < v; j++) {
      rec.local({ i, j, k: null });
      const ij = adjacente(rec, i, j);
      rec.passo(ij ? 2 : 3, DT.par, `adjacencia[${i}][${j}] = ${ij ? 1 : 0}.`, {
        vertices: [
          { id: i, tipo: 'atual' },
          { id: j, tipo: 'atual' },
        ],
        arestas: ij ? [{ u: i, w: j, tipo: 'atual' }] : [],
        celulas: [{ matriz: 'adjacencia', i, j, tipo: ij ? 'sucesso' : 'falha' }],
      });
      if (!ij) {
        rec.passo(3, DT.continua, `${i} e ${j} não são adjacentes: nenhum triângulo contém esse par.`);
        continue;
      }
      for (let k = j + 1; k < v; k++) {
        const jk = adjacente(rec, j, k);
        const ik = adjacente(rec, i, k);
        const triangulo = jk && ik;
        rec.local({ k });
        rec.passo(3, DT.teste, `Testa { ${i} ${j} ${k} }: ${j}–${k} ${jk ? '✓' : '✗'}, ${i}–${k} ${ik ? '✓' : '✗'}.`, {
          vertices: [
            { id: i, tipo: 'atual' },
            { id: j, tipo: 'atual' },
            { id: k, tipo: triangulo ? 'sucesso' : 'comparado' },
          ],
          arestas: [
            { u: i, w: j, tipo: 'atual' },
            ...(jk ? [{ u: j, w: k, tipo: 'atual' as const }] : []),
            ...(ik ? [{ u: i, w: k, tipo: 'atual' as const }] : []),
          ],
          celulas: [
            { matriz: 'adjacencia', i: j, j: k, tipo: jk ? 'sucesso' : 'falha' },
            { matriz: 'adjacencia', i, j: k, tipo: ik ? 'sucesso' : 'falha' },
          ],
        });
        if (triangulo) {
          rec.printf(`  { ${i} ${j} ${k} }\n`);
          total++;
          rec.local({ total });
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
  rec.printf(`Total de triângulos: ${total}\n`);
  rec.passo(1, DT.total, `Total de triângulos: ${total}.`);
  rec.sair();
}

function conjunto(membro: readonly boolean[]): string {
  return `{ ${membro.flatMap((m, i) => (m ? [i] : [])).join(' ')} }`;
}

function detectarCliquesVizinhanca(rec: Recorder): void {
  const { v } = rec.estado;
  const encontrados: boolean[][] = [];
  let total = 0;
  rec.entrar('detectarCliquesVizinhanca', { total });
  rec.printf('\nCliques da forma {u} U N(u):\n');
  rec.passo(1, DC.cabecalho, 'Para cada u, testa se u com todos os seus vizinhos forma um clique.');

  for (let u = 0; u < v; u++) {
    const membro: boolean[] = [];
    rec.local({ u, membro: '{ }', ehClique: null, repetido: null });
    for (let i = 0; i < v; i++) {
      membro[i] = adjacente(rec, u, i);
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

    const lista = rec.estado.lista?.[u] ?? [];
    for (let ia = 0; ia < lista.length; ia++) {
      for (let ib = ia + 1; ib < lista.length; ib++) {
        const a = lista[ia] as number;
        const b = lista[ib] as number;
        const ligados = adjacente(rec, a, b);
        rec.local({ 'a->vertice': a, 'b->vertice': b });
        rec.passo(3, DC.teste, `Vizinhos ${a} e ${b} ${ligados ? 'são' : 'não são'} adjacentes.`, {
          vertices: [
            { id: u, tipo: 'atual' },
            { id: a, tipo: ligados ? 'sucesso' : 'falha' },
            { id: b, tipo: ligados ? 'sucesso' : 'falha' },
          ],
          arestas: [{ u: a, w: b, tipo: ligados ? 'sucesso' : 'falha' }],
          celulas: [{ matriz: 'adjacencia', i: a, j: b, tipo: ligados ? 'sucesso' : 'falha' }],
        });
        if (!ligados) {
          ehClique = false;
          rec.local({ ehClique });
          rec.passo(3, DC.falso, `Falta a aresta ${a}–${b}: não é clique.`, { arestas: [{ u: a, w: b, tipo: 'falha' }] });
        }
      }
    }

    let repetido = false;
    rec.local({ repetido });
    rec.passo(3, DC.repetidoInicio, `Verifica se ${conjunto(membro)} já foi listado (${total} clique(s) guardado(s)).`);
    for (let c = 0; c < total; c++) {
      const guardado = encontrados[c] ?? [];
      let i = 0;
      while (i < v && guardado[i] === membro[i]) {
        i++;
      }
      rec.local({ c, i });
      rec.passo(3, DC.compara, i === v ? `Igual ao clique ${conjunto(guardado)}.` : `Difere de ${conjunto(guardado)} na posição ${i}.`);
      if (i === v) {
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
      rec.entrar('imprimirClique', { v, tamanho });
      rec.printf(`  { ${membros.map((i) => `${i} `).join('')}} tamanho ${tamanho}\n`);
      rec.mutar((g) => ({ ...g, resultados: { ...g.resultados, cliques: [...g.resultados.cliques, { membros, tamanho }] } }));
      rec.passo(2, IC.imprime, `Clique ${conjunto(membro)} de tamanho ${tamanho}.`, {
        vertices: membros.map((id) => ({ id, tipo: 'sucesso' as const })),
        arestas: membros.flatMap((a, ia) => membros.slice(ia + 1).map((b) => ({ u: a, w: b, tipo: 'sucesso' as const }))),
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

export function moduloCliques(rec: Recorder): void {
  rec.entrar('moduloCliques');
  rec.printf('\n===== CLIQUES =====\n');
  rec.passo(1, MQ.cabecalho, 'Início do módulo de cliques.');
  rec.passo(1, MQ.triangulos, 'Detecta triângulos (K_3).');
  detectarTriangulos(rec);
  rec.passo(1, MQ.vizinhanca, 'Detecta cliques formados por um vértice e sua vizinhança.');
  detectarCliquesVizinhanca(rec);
  rec.sair();
}
