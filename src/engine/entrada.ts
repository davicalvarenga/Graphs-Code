import { lineOf } from '@/c-source/source';
import { comCelula, InvarianteError, type Recorder } from './recorder';
import type { Stdin } from './scanf';

const CG = {
  assinatura: lineOf('criarGrafo', 'void criarGrafo'),
  v: lineOf('criarGrafo', 'g->v = v;'),
  e: lineOf('criarGrafo', 'g->e = e;'),
  mallocInc: lineOf('criarGrafo', 'g->incidencia = (int **)malloc'),
  mallocAdj: lineOf('criarGrafo', 'g->adjacencia = (int **)malloc'),
  mallocLista: lineOf('criarGrafo', 'g->listaAdjacencia = (struct No **)malloc'),
  mallocGrau: lineOf('criarGrafo', 'g->grau = (int *)malloc'),
  laco: lineOf('criarGrafo', 'for (int i = 0; i < v; i++)'),
  linhaInc: lineOf('criarGrafo', 'g->incidencia[i] = (int *)malloc'),
  linhaAdj: lineOf('criarGrafo', 'g->adjacencia[i] = (int *)calloc'),
  linhaLista: lineOf('criarGrafo', 'g->listaAdjacencia[i] = NULL;'),
};

const VC = {
  assinatura: lineOf('validarColunas', 'bool validarColunas'),
  cont: lineOf('validarColunas', 'int cont = 0;'),
  soma: lineOf('validarColunas', 'cont += g->incidencia[vertice][aresta];'),
  teste: lineOf('validarColunas', 'if(cont != 2)'),
  erro: lineOf('validarColunas', 'printf("Erro'),
  retornaFalso: lineOf('validarColunas', 'return false;'),
  retornaVerdadeiro: lineOf('validarColunas', 'return true;'),
};

const VP = {
  assinatura: lineOf('validarParalelas', 'bool validarParalelas'),
  par: lineOf('validarParalelas', 'for (int b = a + 1'),
  i0: lineOf('validarParalelas', 'int i = 0;'),
  enquanto: lineOf('validarParalelas', 'while (i < g->v'),
  incremento: lineOf('validarParalelas', 'i++;'),
  teste: lineOf('validarParalelas', 'if(i == g->v)'),
  erro: lineOf('validarParalelas', 'printf("Erro'),
  retornaFalso: lineOf('validarParalelas', 'return false;'),
  retornaVerdadeiro: lineOf('validarParalelas', 'return true;'),
};

const ME = {
  assinatura: lineOf('moduloEntrada', 'bool moduloEntrada'),
  cabecalho: lineOf('moduloEntrada', 'printf("===== ENTRADA'),
  promptV: lineOf('moduloEntrada', 'printf("Digite o número de vértices'),
  lerV: lineOf('moduloEntrada', 'scanf("%d", &v)'),
  erroV: lineOf('moduloEntrada', 'printf("Erro: o número de vértices'),
  promptE: lineOf('moduloEntrada', 'printf("Digite o número de arestas'),
  lerE: lineOf('moduloEntrada', 'scanf("%d", &e)'),
  erroE: lineOf('moduloEntrada', 'printf("Erro: o número de arestas'),
  retornaFalsoV: lineOf('moduloEntrada', 'return false;', 1),
  retornaFalsoE: lineOf('moduloEntrada', 'return false;', 2),
  criar: lineOf('moduloEntrada', 'criarGrafo(g, v, e);'),
  seTemArestas: lineOf('moduloEntrada', 'if(e > 0)'),
  promptMatriz: lineOf('moduloEntrada', 'printf("Digite a matriz'),
  promptVertice: lineOf('moduloEntrada', 'printf("Vértice %d: ", i);'),
  lerCelula: lineOf('moduloEntrada', 'scanf("%d", &g->incidencia[i][j])'),
  erroMatriz: lineOf('moduloEntrada', 'printf("\\nErro: a matriz'),
  retornaFalsoMatriz: lineOf('moduloEntrada', 'return false;', 3),
  validar: lineOf('moduloEntrada', 'if(!validarColunas(g) || !validarParalelas(g))'),
  retornaFalsoValidacao: lineOf('moduloEntrada', 'return false;', 4),
  sucesso: lineOf('moduloEntrada', 'printf("\\nMatriz válida!'),
  retornaVerdadeiro: lineOf('moduloEntrada', 'return true;'),
};

function criarGrafo(rec: Recorder, v: number, e: number): void {
  rec.entrar('criarGrafo', { v, e });
  rec.passo(2, CG.assinatura, `criarGrafo aloca as estruturas para ${v} vértice(s) e ${e} aresta(s).`);
  rec.mutar((g) => ({ ...g, v }));
  rec.passo(3, CG.v, 'Guarda o número de vértices na struct.');
  rec.mutar((g) => ({ ...g, e }));
  rec.passo(3, CG.e, 'Guarda o número de arestas na struct.');
  rec.passo(3, CG.mallocInc, 'Aloca o vetor de ponteiros das linhas da matriz de incidência.');
  rec.passo(3, CG.mallocAdj, 'Aloca o vetor de ponteiros das linhas da matriz de adjacência.');
  rec.passo(3, CG.mallocLista, 'Aloca o vetor de cabeças das listas de adjacência.');
  rec.passo(3, CG.mallocGrau, 'Aloca o vetor de graus (ainda com lixo de memória).');
  rec.mutar((g) => ({ ...g, grau: new Array<number | null>(v).fill(null) }));

  const incidencia: (number | null)[][] = [];
  const adjacencia: number[][] = [];
  const lista: number[][] = [];
  for (let i = 0; i < v; i++) {
    rec.local({ i });
    rec.passo(3, CG.laco, `Iteração i = ${i}: prepara a linha do vértice ${i}.`, { vertices: [{ id: i, tipo: 'atual' }] });
    incidencia.push(new Array<number | null>(e).fill(null));
    rec.passo(3, CG.linhaInc, `malloc: linha ${i} da incidência com ${e} posição(ões) não inicializadas.`);
    adjacencia.push(new Array<number>(v).fill(0));
    rec.passo(3, CG.linhaAdj, `calloc: linha ${i} da adjacência zerada.`);
    lista.push([]);
    rec.mutar((g) => ({ ...g, incidencia: [...incidencia], adjacencia: [...adjacencia], lista: [...lista] }));
    rec.passo(3, CG.linhaLista, `A lista do vértice ${i} começa vazia (NULL).`, { vertices: [{ id: i, tipo: 'atual' }] });
  }
  rec.mutar((g) => ({ ...g, incidencia, adjacencia, lista }));
  rec.sair();
}

function incidencia(rec: Recorder, i: number, j: number): number {
  const valor = rec.estado.incidencia?.[i]?.[j];
  if (valor === null || valor === undefined) {
    throw new InvarianteError(`incidencia[${i}][${j}] lida antes de ser preenchida`);
  }
  return valor;
}

function colunaInteira(rec: Recorder, aresta: number, tipo: 'atual' | 'falha' | 'comparado') {
  return Array.from({ length: rec.estado.v }, (_, i) => ({ matriz: 'incidencia' as const, i, j: aresta, tipo }));
}

export function validarColunas(rec: Recorder): boolean {
  const { v, e } = rec.estado;
  rec.entrar('validarColunas');
  rec.passo(2, VC.assinatura, 'Verifica se cada coluna (aresta) tem exatamente dois 1s.');
  for (let aresta = 0; aresta < e; aresta++) {
    rec.local({ aresta, cont: 0 });
    rec.passo(2, VC.cont, `Coluna e${aresta}: zera o contador.`, { celulas: colunaInteira(rec, aresta, 'atual') });
    let cont = 0;
    for (let vertice = 0; vertice < v; vertice++) {
      cont += incidencia(rec, vertice, aresta);
      rec.local({ vertice, cont });
      rec.passo(3, VC.soma, `Soma incidencia[${vertice}][${aresta}] = ${incidencia(rec, vertice, aresta)} ⇒ cont = ${cont}.`, {
        celulas: [{ matriz: 'incidencia', i: vertice, j: aresta, tipo: 'atual' }],
        vertices: [{ id: vertice, tipo: 'atual' }],
      });
    }
    rec.passo(3, VC.teste, `cont = ${cont}: ${cont === 2 ? 'a aresta liga dois vértices' : 'coluna inválida'}.`, {
      celulas: colunaInteira(rec, aresta, cont === 2 ? 'comparado' : 'falha'),
    });
    if (cont !== 2) {
      const mensagem = `Erro: a aresta e${aresta} tem ${cont} vértice(s), deveria ter 2\n`;
      rec.printf(mensagem);
      rec.mutar((g) => ({ ...g, resultados: { ...g.resultados, valida: false, erro: mensagem.trim() } }));
      rec.passo(1, VC.erro, `A aresta e${aresta} incide em ${cont} vértice(s); toda aresta precisa de exatamente 2.`, {
        celulas: colunaInteira(rec, aresta, 'falha'),
      });
      rec.passo(1, VC.retornaFalso, 'validarColunas retorna false.');
      rec.sair();
      return false;
    }
  }
  rec.local({ aresta: e });
  rec.passo(1, VC.retornaVerdadeiro, 'Todas as colunas têm exatamente dois 1s: retorna true.');
  rec.sair();
  return true;
}

export function validarParalelas(rec: Recorder): boolean {
  const { v, e } = rec.estado;
  rec.entrar('validarParalelas');
  rec.passo(2, VP.assinatura, 'Compara cada par de colunas: colunas iguais são arestas paralelas.');
  for (let a = 0; a < e; a++) {
    for (let b = a + 1; b < e; b++) {
      rec.local({ a, b, i: 0 });
      rec.passo(2, VP.par, `Compara as colunas e${a} e e${b}.`, {
        celulas: [...colunaInteira(rec, a, 'atual'), ...colunaInteira(rec, b, 'comparado')],
      });
      let i = 0;
      rec.passo(3, VP.i0, 'Começa a comparação pela linha 0.');
      while (i < v && incidencia(rec, i, a) === incidencia(rec, i, b)) {
        rec.passo(3, VP.enquanto, `Linha ${i}: ambos valem ${incidencia(rec, i, a)}, continua.`, {
          celulas: [
            { matriz: 'incidencia', i, j: a, tipo: 'atual' },
            { matriz: 'incidencia', i, j: b, tipo: 'atual' },
          ],
        });
        i++;
        rec.local({ i });
        rec.passo(3, VP.incremento, `i = ${i}.`);
      }
      rec.passo(3, VP.teste, i === v ? `As ${v} linhas coincidem.` : `Diferem na linha ${i}: não são paralelas.`, {
        celulas:
          i < v
            ? [
                { matriz: 'incidencia', i, j: a, tipo: 'comparado' },
                { matriz: 'incidencia', i, j: b, tipo: 'comparado' },
              ]
            : [],
      });
      if (i === v) {
        const mensagem = `Erro: as arestas e${a} e e${b} são paralelas\n`;
        rec.printf(mensagem);
        rec.mutar((g) => ({ ...g, resultados: { ...g.resultados, valida: false, erro: mensagem.trim() } }));
        rec.passo(1, VP.erro, `As colunas e${a} e e${b} são idênticas: arestas paralelas não são permitidas.`, {
          celulas: [...colunaInteira(rec, a, 'falha'), ...colunaInteira(rec, b, 'falha')],
        });
        rec.passo(1, VP.retornaFalso, 'validarParalelas retorna false.');
        rec.sair();
        return false;
      }
    }
  }
  rec.passo(1, VP.retornaVerdadeiro, 'Nenhum par de colunas idênticas: retorna true.');
  rec.sair();
  return true;
}

function falhar(rec: Recorder, linhaErro: number, mensagem: string, linhaRetorno: number, nota: string): false {
  rec.printf(mensagem);
  rec.mutar((g) => ({ ...g, resultados: { ...g.resultados, valida: false, erro: mensagem.trim() } }));
  rec.passo(1, linhaErro, nota);
  rec.passo(1, linhaRetorno, 'moduloEntrada retorna false: o programa vai encerrar com erro.');
  rec.sair();
  return false;
}

function descreverLeitura(motivo: 'eof' | 'invalido'): string {
  return motivo === 'eof' ? 'a entrada acabou (scanf retornou EOF)' : 'o próximo token não é um inteiro (scanf retornou 0)';
}

export function moduloEntrada(rec: Recorder, stdin: Stdin): boolean {
  rec.entrar('moduloEntrada', { v: null, e: null });
  rec.passo(1, ME.assinatura, 'Início do módulo de entrada e validação.');
  rec.printf('===== ENTRADA E VALIDAÇÃO =====\n');
  rec.passo(3, ME.cabecalho, 'Imprime o cabeçalho do módulo.');
  rec.printf('Digite o número de vértices: ');
  rec.passo(3, ME.promptV, 'Pede o número de vértices.');

  const leituraV = stdin.lerInt();
  if (leituraV.ok) {
    rec.local({ v: leituraV.valor });
  }
  if (!leituraV.ok || leituraV.valor < 1 || leituraV.valor > 20) {
    rec.passo(1, ME.lerV, leituraV.ok ? `v = ${leituraV.valor} está fora do intervalo 1..20.` : `Falha na leitura: ${descreverLeitura(leituraV.motivo)}.`);
    return falhar(rec, ME.erroV, 'Erro: o número de vértices deve estar entre 1 e 20\n', ME.retornaFalsoV, 'Número de vértices inválido.');
  }
  const v = leituraV.valor;
  rec.passo(2, ME.lerV, `scanf leu v = ${v} (válido: 1 ≤ v ≤ 20).`);

  const maxArestas = (v * (v - 1)) / 2;
  rec.printf('Digite o número de arestas: ');
  rec.passo(3, ME.promptE, 'Pede o número de arestas.');
  const leituraE = stdin.lerInt();
  if (leituraE.ok) {
    rec.local({ e: leituraE.valor });
  }
  if (!leituraE.ok || leituraE.valor < 0 || leituraE.valor > maxArestas) {
    rec.passo(
      1,
      ME.lerE,
      leituraE.ok
        ? `e = ${leituraE.valor} está fora do intervalo 0..${maxArestas} (máximo de um grafo simples com ${v} vértices).`
        : `Falha na leitura: ${descreverLeitura(leituraE.motivo)}.`,
    );
    return falhar(rec, ME.erroE, `Erro: o número de arestas deve estar entre 0 e ${maxArestas}\n`, ME.retornaFalsoE, 'Número de arestas inválido.');
  }
  const e = leituraE.valor;
  rec.passo(2, ME.lerE, `scanf leu e = ${e} (válido: 0 ≤ e ≤ v(v-1)/2 = ${maxArestas}).`);

  rec.passo(2, ME.criar, 'Chama criarGrafo para alocar a struct.');
  criarGrafo(rec, v, e);
  rec.passo(1, ME.criar, `Grafo alocado: incidência ${v}×${e}, adjacência ${v}×${v} zerada, listas vazias.`);

  rec.passo(3, ME.seTemArestas, e > 0 ? 'Há arestas: pede a matriz.' : 'e = 0: nenhuma matriz será lida.');
  if (e > 0) {
    rec.printf(`Digite a matriz de incidência (${v}x${e}), uma linha por vértice:\n`);
    rec.passo(3, ME.promptMatriz, 'Pede a matriz de incidência.');
  }
  for (let i = 0; i < v && e > 0; i++) {
    rec.local({ i });
    rec.printf(`Vértice ${i}: `);
    rec.passo(2, ME.promptVertice, `Lê a linha do vértice ${i}.`, { vertices: [{ id: i, tipo: 'atual' }] });
    for (let j = 0; j < e; j++) {
      rec.local({ j });
      const leitura = stdin.lerInt();
      if (leitura.ok) {
        rec.mutar((g) => ({ ...g, incidencia: comCelula(g.incidencia ?? [], i, j, leitura.valor) }));
      }
      const celula = { matriz: 'incidencia' as const, i, j };
      if (!leitura.ok || (leitura.valor !== 0 && leitura.valor !== 1)) {
        rec.passo(
          1,
          ME.lerCelula,
          leitura.ok ? `incidencia[${i}][${j}] = ${leitura.valor}: só 0 ou 1 são permitidos.` : `Falha na leitura de incidencia[${i}][${j}]: ${descreverLeitura(leitura.motivo)}.`,
          { celulas: [{ ...celula, tipo: 'falha' }], vertices: [{ id: i, tipo: 'falha' }] },
        );
        return falhar(rec, ME.erroMatriz, '\nErro: a matriz só pode ter valores 0 ou 1\n', ME.retornaFalsoMatriz, 'Valor inválido na matriz de incidência.');
      }
      rec.passo(3, ME.lerCelula, `incidencia[${i}][${j}] = ${leitura.valor}${leitura.valor === 1 ? `: vértice ${i} é extremidade de e${j}` : ''}.`, {
        celulas: [{ ...celula, tipo: 'atual' }],
        vertices: [{ id: i, tipo: 'atual' }],
      });
    }
  }

  rec.descartar('i', 'j');
  rec.passo(1, ME.validar, 'Valida a matriz: primeiro as colunas, depois as arestas paralelas (curto-circuito do ||).');
  const valida = validarColunas(rec) && validarParalelas(rec);
  if (!valida) {
    rec.passo(1, ME.retornaFalsoValidacao, 'Validação falhou: moduloEntrada retorna false.');
    rec.sair();
    return false;
  }

  rec.printf(`\nMatriz válida! Grafo com ${v} vértice(s) e ${e} aresta(s).\n`);
  rec.mutar((g) => ({ ...g, resultados: { ...g.resultados, valida: true } }));
  rec.passo(1, ME.sucesso, 'Matriz válida.');
  rec.passo(1, ME.retornaVerdadeiro, 'moduloEntrada retorna true.');
  rec.sair();
  return true;
}
