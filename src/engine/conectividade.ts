import { lineOf } from '@/c-source/source';
import { copiarAdjacencia, imprimirQuadrada, liberarMatrizes, multiplicar, potenciaDeA } from './matrizes';
import { comCelula, type Recorder } from './recorder';
import type { Matriz } from './types';

const MC = {
  n: lineOf('moduloConectividade', 'int n = g->v;'),
  cabecalho: lineOf('moduloConectividade', 'printf("\\n===== CONECTIVIDADE'),
  copias: lineOf('moduloConectividade', 'copiarAdjacencia(g, n, soma);'),
  lacoR: lineOf('moduloConectividade', 'for (int r = 2; r <= n - 1; r++)'),
  multiplica: lineOf('moduloConectividade', 'multiplicar(n, potencia, a, proxima);'),
  copiaPotencia: lineOf('moduloConectividade', 'potencia[i][j] = proxima[i][j];'),
  soma: lineOf('moduloConectividade', 'soma[i][j] += potencia[i][j];'),
  titulo: lineOf('moduloConectividade', 'printf("S = A + A^2'),
  imprime: lineOf('moduloConectividade', 'imprimirQuadrada(n, soma);'),
  conexoInicio: lineOf('moduloConectividade', 'bool conexo = true;'),
  testa: lineOf('moduloConectividade', 'if(i != j && soma[i][j] == 0)'),
  falso: lineOf('moduloConectividade', 'conexo = false;'),
  resultado: lineOf('moduloConectividade', 'printf("\\nConexo:'),
};

function escrever(rec: Recorder, nome: string, i: number, j: number, valor: number): void {
  rec.mutar((g) => ({
    ...g,
    matrizes: (g.matrizes ?? []).map((m) => (m.nome === nome ? { ...m, celulas: comCelula(m.celulas, i, j, valor) } : m)),
  }));
}

export function moduloConectividade(rec: Recorder): void {
  const n = rec.estado.v;
  rec.entrar('moduloConectividade', { n });
  rec.passo(1, MC.n, `n = ${n}. Num grafo conexo de n vértices, todo par se liga por um caminho de até n − 1 arestas.`);
  rec.printf('\n===== CONECTIVIDADE =====\n');
  rec.passo(2, MC.cabecalho, `Soma as potências: S = A + ${potenciaDeA(2)} + … + ${potenciaDeA(n - 1)} conta os caminhos de cada comprimento.`);

  rec.passo(2, MC.copias, 'a, potencia e soma começam todas iguais à adjacência.');
  const a = copiarAdjacencia(rec, 'a', 'a · adjacência');
  let potencia: Matriz = copiarAdjacencia(rec, 'potencia', `potencia · ${potenciaDeA(1)}`);
  let soma: Matriz = copiarAdjacencia(rec, 'soma', 'soma · S');

  for (let r = 2; r <= n - 1; r++) {
    rec.local({ r, i: null, j: null });
    rec.passo(1, MC.lacoR, `r = ${r}: calcula ${potenciaDeA(r)} = ${potenciaDeA(r - 1)} × A.`);
    rec.passo(2, MC.multiplica, `Multiplica potencia por a para obter os caminhos de comprimento ${r}.`);
    const proxima = multiplicar(rec, { nome: 'potencia', valores: potencia }, { nome: 'a', valores: a }, { nome: 'proxima', rotulo: `proxima · ${potenciaDeA(r)}` });

    const novaPotencia = proxima.map((linha) => [...linha]);
    const novaSoma = soma.map((linha) => [...linha]);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const valor = proxima[i]?.[j] ?? 0;
        rec.local({ i, j });
        escrever(rec, 'potencia', i, j, valor);
        rec.passo(3, MC.copiaPotencia, `potencia[${i}][${j}] = ${valor}: agora potencia guarda ${potenciaDeA(r)}.`, {
          celulas: [
            { matriz: 'proxima', i, j, tipo: 'comparado' },
            { matriz: 'potencia', i, j, tipo: 'atual' },
          ],
        });
        novaSoma[i]![j] = (novaSoma[i]?.[j] ?? 0) + valor;
        escrever(rec, 'soma', i, j, novaSoma[i]![j] as number);
        rec.passo(3, MC.soma, `soma[${i}][${j}] = ${novaSoma[i]![j]}.`, {
          celulas: [{ matriz: 'soma', i, j, tipo: valor > 0 ? 'sucesso' : 'atual' }],
        });
      }
    }
    potencia = novaPotencia;
    soma = novaSoma;
    liberarMatrizes(rec, 'proxima');
    rec.passo(2, MC.soma, `Agora soma conta os caminhos de comprimento 1 a ${r}.`);
  }
  rec.descartar('r', 'i', 'j');

  rec.printf(`S = A + A^2 + ... + A^${n - 1}:\n`);
  rec.passo(2, MC.titulo, `Imprime S = A + ${potenciaDeA(2)} + … + ${potenciaDeA(n - 1)}.`);
  rec.passo(2, MC.imprime, 'Imprime a matriz soma.');
  imprimirQuadrada(rec, soma, 'soma');

  let conexo = true;
  rec.local({ conexo });
  rec.passo(2, MC.conexoInicio, 'Conexo se todo par de vértices distintos tem pelo menos um caminho: S[i][j] > 0.');
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const valor = soma[i]?.[j] ?? 0;
      rec.local({ i, j });
      if (i === j) {
        rec.passo(3, MC.testa, 'i == j: a diagonal não entra na verificação.', { celulas: [{ matriz: 'soma', i, j, tipo: 'comparado' }] });
        continue;
      }
      rec.passo(3, MC.testa, valor > 0 ? `S[${i}][${j}] = ${valor}: existe caminho de ${i} a ${j}.` : `S[${i}][${j}] = 0: nenhum caminho de ${i} a ${j}.`, {
        celulas: [{ matriz: 'soma', i, j, tipo: valor > 0 ? 'sucesso' : 'falha' }],
        vertices: [
          { id: i, tipo: valor > 0 ? 'atual' : 'falha' },
          { id: j, tipo: valor > 0 ? 'sucesso' : 'falha' },
        ],
      });
      if (valor === 0) {
        conexo = false;
        rec.local({ conexo });
        rec.passo(2, MC.falso, `${i} e ${j} estão em partes separadas: conexo = false.`, {
          celulas: [{ matriz: 'soma', i, j, tipo: 'falha' }],
          vertices: [
            { id: i, tipo: 'falha' },
            { id: j, tipo: 'falha' },
          ],
        });
      }
    }
  }
  rec.descartar('i', 'j');

  rec.printf(`\nConexo: ${conexo ? 'Sim' : 'Não'}\n`);
  rec.mutar((g) => ({ ...g, resultados: { ...g.resultados, conexo, somaCaminhos: soma } }));
  rec.passo(1, MC.resultado, conexo ? 'Conexo: todo par de vértices está ligado por algum caminho.' : 'Não conexo: há vértices sem caminho entre si.');
  // a, potencia e soma são vetores locais: deixam de existir quando a função retorna.
  liberarMatrizes(rec, 'a', 'potencia', 'soma');
  rec.sair();
}
