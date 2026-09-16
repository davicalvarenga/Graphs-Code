import { lineOf } from '@/c-source/source';
import { comItem, InvarianteError, type Recorder } from './recorder';
import type { Euleriano, Resultados } from './types';

const DFS = {
  inicio: lineOf('dfs', 'int cont = 1;'),
  visita: lineOf('dfs', 'visitado[u] = true;'),
  teste: lineOf('dfs', 'if(p->vertice != ignorar'),
  recursao: lineOf('dfs', 'cont += dfs('),
  retorno: lineOf('dfs', 'return cont;'),
};

const CA = {
  assinatura: lineOf('contarAlcancados', 'int contarAlcancados'),
  zera: lineOf('contarAlcancados', 'visitado[i] = false;'),
  chamada: lineOf('contarAlcancados', 'return dfs('),
};

const EC = {
  teste: lineOf('ehCompleto', 'if(g->grau[u] != g->v - 1)'),
  falso: lineOf('ehCompleto', 'return false;'),
  verdadeiro: lineOf('ehCompleto', 'return true;'),
};

const CI = {
  menorQue3: lineOf('ehCiclo', 'if(g->v < 3)'),
  falsoV: lineOf('ehCiclo', 'return false;', 1),
  teste: lineOf('ehCiclo', 'if(g->grau[u] != 2)'),
  falsoGrau: lineOf('ehCiclo', 'return false;', 2),
  conexo: lineOf('ehCiclo', 'return contarAlcancados'),
};

const RO = {
  centro: lineOf('ehRoda', 'if(g->grau[u] == g->v - 1)'),
  atribui: lineOf('ehRoda', 'centro = u;'),
  pre: lineOf('ehRoda', 'if(g->v < 4 || centro == -1)'),
  falsoPre: lineOf('ehRoda', 'return false;', 1),
  teste: lineOf('ehRoda', 'if(u != centro && g->grau[u] != 3)'),
  falsoGrau: lineOf('ehRoda', 'return false;', 2),
  borda: lineOf('ehRoda', 'int borda ='),
  conexo: lineOf('ehRoda', 'return contarAlcancados'),
};

const EU = {
  assinatura: lineOf('verificarEuleriano', 'void verificarEuleriano'),
  impar: lineOf('verificarEuleriano', 'impares++;'),
  comArestas: lineOf('verificarEuleriano', 'inicio = u;'),
  teste: lineOf('verificarEuleriano', 'if(g->grau[u] % 2 != 0)'),
  conexo: lineOf('verificarEuleriano', 'if(g->e == 0 || contarAlcancados'),
  naoConexo: lineOf('verificarEuleriano', 'printf("Euleriano: Não\\n");', 1),
  ciclo: lineOf('verificarEuleriano', 'printf("Euleriano: Sim'),
  caminho: lineOf('verificarEuleriano', 'printf("Euleriano: Não, mas'),
  nao: lineOf('verificarEuleriano', 'printf("Euleriano: Não\\n");', 2),
};

const CO = {
  atribui: lineOf('colorir', 'cor[u] = c;'),
  vizinho: lineOf('colorir', 'int w = p->vertice;'),
  teste: lineOf('colorir', 'if(cor[w] == c ||'),
  falso: lineOf('colorir', 'return false;'),
  verdadeiro: lineOf('colorir', 'return true;'),
};

const VB = {
  assinatura: lineOf('verificarBipartido', 'void verificarBipartido'),
  zera: lineOf('verificarBipartido', 'cor[i] = -1;'),
  teste: lineOf('verificarBipartido', 'if(cor[i] == -1 && !colorir'),
  nao: lineOf('verificarBipartido', 'printf("Bipartido: Não\\n");'),
  sim: lineOf('verificarBipartido', 'printf("Bipartido: Sim\\n");'),
  particao: lineOf('verificarBipartido', 'printf("}\\n");'),
};

const MC = {
  cabecalho: lineOf('moduloClassificacao', 'printf("\\n===== CLASSIFICAÇÃO'),
  zeraGrau: lineOf('moduloClassificacao', 'g->grau[u] = 0;'),
  incrementa: lineOf('moduloClassificacao', 'g->grau[u]++;'),
  imprimeGrau: lineOf('moduloClassificacao', 'printf("Vértice %d: Grau %d'),
  completo: lineOf('moduloClassificacao', 'ehCompleto(g)'),
  ciclo: lineOf('moduloClassificacao', 'ehCiclo(g)'),
  roda: lineOf('moduloClassificacao', 'ehRoda(g)'),
  euleriano: lineOf('moduloClassificacao', 'verificarEuleriano(g);'),
  bipartido: lineOf('moduloClassificacao', 'verificarBipartido(g);'),
};

function grauDe(rec: Recorder, u: number): number {
  const grau = rec.estado.grau?.[u];
  if (grau === null || grau === undefined) {
    throw new InvarianteError(`grau[${u}] usado antes de ser calculado`);
  }
  return grau;
}

function vizinhos(rec: Recorder, u: number): readonly number[] {
  return rec.estado.lista?.[u] ?? [];
}

function registrar(rec: Recorder, resultado: Partial<Resultados>): void {
  rec.mutar((g) => ({ ...g, resultados: { ...g.resultados, ...resultado } }));
}

function dfs(rec: Recorder, u: number, ignorar: number): number {
  let cont = 1;
  rec.entrar('dfs', { u, ignorar, cont });
  rec.passo(3, DFS.inicio, `dfs(${u}): conta o próprio vértice.`, { vertices: [{ id: u, tipo: 'atual' }], ignorado: ignorar });
  rec.mutar((g) => ({ ...g, visitado: comItem(g.visitado ?? [], u, true) }));
  rec.passo(2, DFS.visita, `Marca ${u} como visitado.`, { vertices: [{ id: u, tipo: 'atual' }], ignorado: ignorar });

  const lista = vizinhos(rec, u);
  for (let indice = 0; indice < lista.length; indice++) {
    const w = lista[indice] as number;
    const visitado = rec.estado.visitado?.[w] ?? false;
    const desce = w !== ignorar && !visitado;
    rec.local({ 'p->vertice': w });
    rec.passo(
      3,
      DFS.teste,
      w === ignorar ? `${w} é o vértice ignorado: não atravessa.` : visitado ? `${w} já foi visitado.` : `${w} ainda não foi visitado: desce.`,
      {
        vertices: [
          { id: u, tipo: 'atual' },
          { id: w, tipo: desce ? 'sucesso' : 'comparado' },
        ],
        arestas: [{ u, w, tipo: desce ? 'sucesso' : 'comparado' }],
        no: { u, indice },
        ignorado: ignorar,
      },
    );
    if (desce) {
      rec.passo(3, DFS.recursao, `Chamada recursiva dfs(${w}).`, { arestas: [{ u, w, tipo: 'atual' }], ignorado: ignorar });
      cont += dfs(rec, w, ignorar);
      rec.local({ cont });
      rec.passo(3, DFS.recursao, `dfs(${w}) retornou; cont de ${u} = ${cont}.`, {
        vertices: [{ id: u, tipo: 'atual' }],
        arestas: [{ u, w, tipo: 'comparado' }],
        ignorado: ignorar,
      });
    }
  }
  rec.passo(2, DFS.retorno, `dfs(${u}) retorna ${cont}.`, { vertices: [{ id: u, tipo: 'sucesso' }], ignorado: ignorar });
  rec.sair();
  return cont;
}

function contarAlcancados(rec: Recorder, inicio: number, ignorar: number): number {
  rec.entrar('contarAlcancados', { inicio, ignorar });
  rec.passo(2, CA.assinatura, `Conta quantos vértices a DFS alcança a partir de ${inicio}${ignorar >= 0 ? `, sem passar por ${ignorar}` : ''}.`, {
    vertices: [{ id: inicio, tipo: 'atual' }],
    ignorado: ignorar,
  });
  rec.mutar((g) => ({ ...g, visitado: new Array<boolean>(g.v).fill(false) }));
  rec.passo(3, CA.zera, 'Zera o vetor visitado[].', { ignorado: ignorar });
  rec.passo(3, CA.chamada, `Chama dfs(${inicio}).`, { vertices: [{ id: inicio, tipo: 'atual' }], ignorado: ignorar });
  const alcancados = dfs(rec, inicio, ignorar);
  rec.passo(2, CA.chamada, `A DFS alcançou ${alcancados} vértice(s).`, { ignorado: ignorar });
  rec.mutar((g) => ({ ...g, visitado: null }));
  rec.sair();
  return alcancados;
}

function ehCompleto(rec: Recorder): boolean {
  const { v } = rec.estado;
  rec.entrar('ehCompleto');
  for (let u = 0; u < v; u++) {
    const grau = grauDe(rec, u);
    rec.local({ u });
    rec.passo(3, EC.teste, `grau[${u}] = ${grau}; um grafo completo exige ${v - 1}.`, {
      vertices: [{ id: u, tipo: grau === v - 1 ? 'sucesso' : 'falha' }],
    });
    if (grau !== v - 1) {
      rec.passo(2, EC.falso, `O vértice ${u} não é adjacente a todos: não é completo.`, { vertices: [{ id: u, tipo: 'falha' }] });
      rec.sair();
      return false;
    }
  }
  rec.passo(2, EC.verdadeiro, `Todos os vértices têm grau ${v - 1}: completo.`);
  rec.sair();
  return true;
}

function ehCiclo(rec: Recorder): boolean {
  const { v } = rec.estado;
  rec.entrar('ehCiclo');
  rec.passo(3, CI.menorQue3, `v = ${v}; um ciclo precisa de pelo menos 3 vértices.`);
  if (v < 3) {
    rec.passo(2, CI.falsoV, 'Menos de 3 vértices: não é ciclo.');
    rec.sair();
    return false;
  }
  for (let u = 0; u < v; u++) {
    const grau = grauDe(rec, u);
    rec.local({ u });
    rec.passo(3, CI.teste, `grau[${u}] = ${grau}; um ciclo exige grau 2.`, { vertices: [{ id: u, tipo: grau === 2 ? 'sucesso' : 'falha' }] });
    if (grau !== 2) {
      rec.passo(2, CI.falsoGrau, `grau[${u}] ≠ 2: não é ciclo.`, { vertices: [{ id: u, tipo: 'falha' }] });
      rec.sair();
      return false;
    }
  }
  rec.passo(2, CI.conexo, 'Todos têm grau 2; falta verificar se é conexo (um único ciclo).');
  const alcancados = contarAlcancados(rec, 0, -1);
  rec.passo(2, CI.conexo, `Alcançou ${alcancados} de ${v}: ${alcancados === v ? 'é ciclo' : 'são vários ciclos disjuntos'}.`);
  rec.sair();
  return alcancados === v;
}

function ehRoda(rec: Recorder): boolean {
  const { v } = rec.estado;
  let centro = -1;
  rec.entrar('ehRoda', { centro });
  for (let u = 0; u < v; u++) {
    const grau = grauDe(rec, u);
    rec.local({ u });
    rec.passo(3, RO.centro, `grau[${u}] = ${grau}; o centro teria grau ${v - 1}.`, { vertices: [{ id: u, tipo: grau === v - 1 ? 'sucesso' : 'comparado' }] });
    if (grau === v - 1) {
      centro = u;
      rec.local({ centro });
      rec.passo(2, RO.atribui, `centro = ${u} (o último candidato encontrado prevalece).`, { vertices: [{ id: u, tipo: 'sucesso' }] });
    }
  }
  rec.passo(3, RO.pre, `v = ${v}, centro = ${centro}.`);
  if (v < 4 || centro === -1) {
    rec.passo(2, RO.falsoPre, v < 4 ? 'Uma roda precisa de pelo menos 4 vértices.' : 'Nenhum vértice é adjacente a todos: não há centro.');
    rec.sair();
    return false;
  }
  for (let u = 0; u < v; u++) {
    const grau = grauDe(rec, u);
    rec.local({ u });
    rec.passo(3, RO.teste, u === centro ? `${u} é o centro: pulado.` : `grau[${u}] = ${grau}; vértices da borda precisam de grau 3.`, {
      vertices: [
        { id: centro, tipo: 'atual' },
        { id: u, tipo: u === centro || grau === 3 ? 'sucesso' : 'falha' },
      ],
    });
    if (u !== centro && grau !== 3) {
      rec.passo(2, RO.falsoGrau, `grau[${u}] ≠ 3: não é roda.`, { vertices: [{ id: u, tipo: 'falha' }] });
      rec.sair();
      return false;
    }
  }
  const borda = centro === 0 ? 1 : 0;
  rec.local({ borda });
  rec.passo(2, RO.borda, `Escolhe o vértice ${borda} da borda para iniciar a DFS.`, {
    vertices: [
      { id: centro, tipo: 'atual' },
      { id: borda, tipo: 'sucesso' },
    ],
  });
  rec.passo(2, RO.conexo, `A borda sem o centro ${centro} deve formar um único ciclo com ${v - 1} vértices.`, { ignorado: centro });
  const alcancados = contarAlcancados(rec, borda, centro);
  const roda = alcancados === v - 1;
  if (roda) {
    registrar(rec, { centro });
  }
  rec.passo(2, RO.conexo, `Alcançou ${alcancados} de ${v - 1}: ${roda ? 'é roda' : 'não é roda'}.`, { ignorado: centro });
  rec.sair();
  return roda;
}

function verificarEuleriano(rec: Recorder): void {
  const { v, e } = rec.estado;
  let impares = 0;
  let comArestas = 0;
  let inicio = -1;
  rec.entrar('verificarEuleriano', { impares, comArestas, inicio });
  rec.passo(2, EU.assinatura, 'Conta vértices de grau ímpar e vértices com arestas.');
  for (let u = 0; u < v; u++) {
    const grau = grauDe(rec, u);
    rec.local({ u });
    rec.passo(3, EU.teste, `grau[${u}] = ${grau} (${grau % 2 === 0 ? 'par' : 'ímpar'}).`, {
      vertices: [{ id: u, tipo: grau % 2 === 0 ? 'sucesso' : 'falha' }],
    });
    if (grau % 2 !== 0) {
      impares++;
      rec.local({ impares });
      rec.passo(3, EU.impar, `impares = ${impares}.`, { vertices: [{ id: u, tipo: 'falha' }] });
    }
    if (grau > 0) {
      comArestas++;
      inicio = u;
      rec.local({ comArestas, inicio });
      rec.passo(3, EU.comArestas, `comArestas = ${comArestas}; inicio = ${u}.`, { vertices: [{ id: u, tipo: 'atual' }] });
    }
  }

  rec.passo(2, EU.conexo, e === 0 ? 'e = 0: o || curto-circuita e a DFS não é chamada.' : `Verifica se os ${comArestas} vértice(s) com arestas estão conectados.`);
  const desconexo = e === 0 || contarAlcancados(rec, inicio, -1) !== comArestas;
  let resultado: Euleriano;
  if (desconexo) {
    resultado = 'nao';
    rec.printf('Euleriano: Não\n');
    registrar(rec, { euleriano: resultado });
    rec.passo(1, EU.naoConexo, e === 0 ? 'Sem arestas: não euleriano.' : 'As arestas não formam um único componente: não euleriano.');
  } else if (impares === 0) {
    resultado = 'ciclo';
    rec.printf('Euleriano: Sim (possui ciclo euleriano)\n');
    registrar(rec, { euleriano: resultado });
    rec.passo(1, EU.ciclo, 'Conexo e todos os graus pares: possui ciclo euleriano.');
  } else if (impares === 2) {
    resultado = 'caminho';
    rec.printf('Euleriano: Não, mas possui caminho euleriano\n');
    registrar(rec, { euleriano: resultado });
    rec.passo(1, EU.caminho, 'Exatamente 2 vértices ímpares: caminho euleriano entre eles.');
  } else {
    resultado = 'nao';
    rec.printf('Euleriano: Não\n');
    registrar(rec, { euleriano: resultado });
    rec.passo(1, EU.nao, `${impares} vértices de grau ímpar: nem ciclo nem caminho euleriano.`);
  }
  rec.sair();
}

function colorir(rec: Recorder, u: number, c: number): boolean {
  rec.entrar('colorir', { u, c });
  rec.mutar((g) => ({ ...g, cor: comItem(g.cor ?? [], u, c) }));
  rec.passo(2, CO.atribui, `Pinta ${u} com a cor ${c === 0 ? 'X' : 'Y'}.`, { vertices: [{ id: u, tipo: 'atual' }] });

  const lista = vizinhos(rec, u);
  for (let indice = 0; indice < lista.length; indice++) {
    const w = lista[indice] as number;
    rec.local({ w });
    rec.passo(3, CO.vizinho, `Vizinho w = ${w}.`, { arestas: [{ u, w, tipo: 'atual' }], no: { u, indice } });
    const corW = rec.estado.cor?.[w] ?? -1;
    if (corW === c) {
      rec.passo(2, CO.teste, `${w} já tem a mesma cor de ${u}: conflito.`, {
        vertices: [
          { id: u, tipo: 'falha' },
          { id: w, tipo: 'falha' },
        ],
        arestas: [{ u, w, tipo: 'falha' }],
      });
      rec.passo(2, CO.falso, `colorir(${u}) retorna false.`);
      rec.sair();
      return false;
    }
    if (corW === -1) {
      rec.passo(3, CO.teste, `${w} ainda sem cor: chama colorir(${w}, ${1 - c}).`, { arestas: [{ u, w, tipo: 'atual' }] });
      if (!colorir(rec, w, 1 - c)) {
        rec.passo(2, CO.falso, `A coloração a partir de ${w} falhou: colorir(${u}) retorna false.`, { vertices: [{ id: u, tipo: 'falha' }] });
        rec.sair();
        return false;
      }
    } else {
      rec.passo(3, CO.teste, `${w} já tem a cor oposta: ok.`, { arestas: [{ u, w, tipo: 'sucesso' }] });
    }
  }
  rec.passo(2, CO.verdadeiro, `colorir(${u}) retorna true.`, { vertices: [{ id: u, tipo: 'sucesso' }] });
  rec.sair();
  return true;
}

function verificarBipartido(rec: Recorder): void {
  const { v } = rec.estado;
  rec.entrar('verificarBipartido');
  rec.passo(2, VB.assinatura, 'Tenta colorir o grafo com 2 cores de modo que vizinhos tenham cores diferentes.');
  rec.mutar((g) => ({ ...g, cor: new Array<number>(v).fill(-1) }));
  rec.passo(3, VB.zera, 'Todos os vértices começam sem cor (-1).');

  for (let i = 0; i < v; i++) {
    const cor = rec.estado.cor?.[i] ?? -1;
    rec.local({ i });
    rec.passo(3, VB.teste, cor === -1 ? `${i} sem cor: inicia uma coloração com X.` : `${i} já colorido.`, { vertices: [{ id: i, tipo: 'atual' }] });
    if (cor === -1 && !colorir(rec, i, 0)) {
      rec.printf('Bipartido: Não\n');
      registrar(rec, { bipartido: false });
      rec.passo(1, VB.nao, 'Encontrou vizinhos com a mesma cor: não bipartido.');
      rec.mutar((g) => ({ ...g, cor: null }));
      rec.sair();
      return;
    }
  }

  const cores = rec.estado.cor ?? [];
  const X = cores.flatMap((cor, i) => (cor === 0 ? [i] : []));
  const Y = cores.flatMap((cor, i) => (cor === 1 ? [i] : []));
  rec.printf('Bipartido: Sim\n');
  registrar(rec, { bipartido: { X, Y } });
  rec.passo(1, VB.sim, 'Coloração válida: bipartido.');
  [X, Y].forEach((particao, c) => {
    rec.printf(`  ${c === 0 ? 'X' : 'Y'} = { ${particao.map((i) => `${i} `).join('')}}\n`);
    rec.local({ c });
    rec.passo(2, VB.particao, `Partição ${c === 0 ? 'X' : 'Y'} = { ${particao.join(', ')} }.`, {
      vertices: particao.map((id) => ({ id, tipo: 'sucesso' as const })),
    });
  });
  rec.mutar((g) => ({ ...g, cor: null }));
  rec.sair();
}

export function moduloClassificacao(rec: Recorder): void {
  const { v } = rec.estado;
  rec.entrar('moduloClassificacao');
  rec.printf('\n===== CLASSIFICAÇÃO =====\n');
  rec.printf('Vetor de graus:\n');
  rec.passo(1, MC.cabecalho, 'Início do módulo de classificação: primeiro calcula os graus.');

  for (let u = 0; u < v; u++) {
    rec.mutar((g) => ({ ...g, grau: comItem(g.grau ?? [], u, 0) }));
    rec.local({ u });
    rec.passo(2, MC.zeraGrau, `grau[${u}] = 0.`, { vertices: [{ id: u, tipo: 'atual' }] });
    const lista = vizinhos(rec, u);
    for (let indice = 0; indice < lista.length; indice++) {
      const w = lista[indice] as number;
      rec.mutar((g) => ({ ...g, grau: comItem(g.grau ?? [], u, indice + 1) }));
      rec.passo(3, MC.incrementa, `Percorre o nó ${w}: grau[${u}] = ${indice + 1}.`, {
        vertices: [{ id: u, tipo: 'atual' }],
        arestas: [{ u, w, tipo: 'atual' }],
        no: { u, indice },
      });
    }
    rec.printf(`Vértice ${u}: Grau ${grauDe(rec, u)}\n`);
    rec.passo(2, MC.imprimeGrau, `O vértice ${u} tem grau ${grauDe(rec, u)}.`, { vertices: [{ id: u, tipo: 'sucesso' }] });
  }

  rec.descartar('u');
  rec.passo(1, MC.completo, 'Verifica se o grafo é completo.');
  const completo = ehCompleto(rec);
  rec.printf(`\nCompleto:  ${completo ? 'Sim' : 'Não'}\n`);
  registrar(rec, { completo });
  rec.passo(1, MC.completo, `Completo: ${completo ? 'Sim' : 'Não'}.`);

  rec.passo(1, MC.ciclo, 'Verifica se o grafo é um ciclo.');
  const ciclo = ehCiclo(rec);
  rec.printf(`Ciclo:     ${ciclo ? 'Sim' : 'Não'}\n`);
  registrar(rec, { ciclo });
  rec.passo(1, MC.ciclo, `Ciclo: ${ciclo ? 'Sim' : 'Não'}.`);

  rec.passo(1, MC.roda, 'Verifica se o grafo é uma roda.');
  const roda = ehRoda(rec);
  rec.printf(`Roda:      ${roda ? 'Sim' : 'Não'}\n`);
  registrar(rec, { roda });
  rec.passo(1, MC.roda, roda ? `Roda: Sim (centro ${rec.estado.resultados.centro}).` : 'Roda: Não.');

  rec.passo(1, MC.euleriano, 'Verifica ciclo/caminho euleriano.');
  verificarEuleriano(rec);

  rec.passo(1, MC.bipartido, 'Verifica se o grafo é bipartido.');
  verificarBipartido(rec);
  rec.sair();
}
