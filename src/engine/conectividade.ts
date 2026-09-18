import { lineOf } from '@/c-source/source';
import { comCelula, type Recorder } from './recorder';
import type { Destaque, EstadoConectividade, Matriz } from './types';

/** Mesmo teto do `#define LIMITE` do programa C: evita estouro em grafos densos. */
export const LIMITE = 1_000_000;

const MC = {
  n: lineOf('moduloConectividade', 'int n = g->v;'),
  cabecalho: lineOf('moduloConectividade', 'printf("\\n===== CONECTIVIDADE'),
  potenciaInicial: lineOf('moduloConectividade', 'potencia[i][j] = g->adjacencia[i][j];'),
  somaInicial: lineOf('moduloConectividade', 'soma[i][j] = g->adjacencia[i][j];'),
  lacoR: lineOf('moduloConectividade', 'for (int r = 2; r <= n - 1; r++)'),
  zera: lineOf('moduloConectividade', 'proxima[i][j] = 0;'),
  acumula: lineOf('moduloConectividade', 'proxima[i][j] += potencia[i][k] * g->adjacencia[k][j];'),
  limita: lineOf('moduloConectividade', 'potencia[i][j] = (proxima[i][j] > LIMITE)'),
  soma: lineOf('moduloConectividade', 'soma[i][j] += potencia[i][j];'),
  titulo: lineOf('moduloConectividade', 'printf("S = A + A^2'),
  linha: lineOf('moduloConectividade', 'printf("%-4d", soma[i][j]);'),
  conexoInicio: lineOf('moduloConectividade', 'bool conexo = true;'),
  testa: lineOf('moduloConectividade', 'if(i != j && soma[i][j] == 0)'),
  falso: lineOf('moduloConectividade', 'conexo = false;'),
  resultado: lineOf('moduloConectividade', 'printf("\\nConexo:'),
};

const SOBRESCRITOS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** Aʳ com o expoente sobrescrito, como se escreve à mão: potenciaDeA(12) = "A¹²". */
export function potenciaDeA(r: number): string {
  return `A${[...String(r)].map((digito) => SOBRESCRITOS[Number(digito)]).join('')}`;
}

/** printf("%-3d") / printf("%-4d"): alinha à esquerda completando com espaços (nunca corta). */
function esquerda(valor: number, largura: number): string {
  return String(valor).padEnd(largura, ' ');
}

function copia(matriz: Matriz): number[][] {
  return matriz.map((linha) => [...linha]);
}

function atualizar(rec: Recorder, mudar: (atual: EstadoConectividade) => EstadoConectividade): void {
  rec.mutar((g) => (g.conectividade ? { ...g, conectividade: mudar(g.conectividade) } : g));
}

/** Aʳ[i][j] conta os caminhos (passeios) de comprimento r entre i e j. */
function caminhos(quantidade: number, r: number, i: number, j: number): string {
  return quantidade === 1 ? `1 caminho de comprimento ${r} de ${i} a ${j}` : `${quantidade} caminhos de comprimento ${r} de ${i} a ${j}`;
}

export function moduloConectividade(rec: Recorder): void {
  const n = rec.estado.v;
  const adjacencia = rec.estado.adjacencia ?? [];
  rec.entrar('moduloConectividade', { n });
  rec.passo(1, MC.n, `n = ${n}. Um grafo com n vértices, se conexo, liga qualquer par por um caminho de até n − 1 arestas.`);
  rec.printf('\n===== CONECTIVIDADE =====\n');
  rec.passo(2, MC.cabecalho, 'Início do módulo de conectividade: S = A + A² + … + Aⁿ⁻¹ conta os caminhos de cada comprimento.');

  // A^1 = A e S começa igual a A
  const potencia = copia(adjacencia);
  const soma = copia(adjacencia);
  rec.mutar((g) => ({
    ...g,
    conectividade: { r: 1, potencia, proxima: Array.from({ length: n }, () => new Array<number | null>(n).fill(null)), soma },
  }));
  rec.passo(2, MC.potenciaInicial, 'potencia começa igual à adjacência: A¹ = A conta os caminhos de comprimento 1 (as próprias arestas).');
  rec.passo(2, MC.somaInicial, 'soma começa igual a A: por enquanto só os caminhos de comprimento 1.');

  // A^r = A^(r-1) x A, para r = 2 até n-1
  for (let r = 2; r <= n - 1; r++) {
    rec.local({ r, i: null, j: null, k: null });
    rec.passo(1, MC.lacoR, `r = ${r}: calcula ${potenciaDeA(r)} = ${potenciaDeA(r - 1)} × A, os caminhos de comprimento ${r}.`);

    const anterior = rec.estado.conectividade?.potencia ?? [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        rec.local({ i, j, k: null });
        atualizar(rec, (c) => ({ ...c, proxima: comCelula(c.proxima, i, j, 0) }));
        rec.passo(3, MC.zera, `proxima[${i}][${j}] = 0: vai somar os caminhos de ${i} a ${j} que passam por cada vértice k.`, {
          celulas: [{ matriz: 'proxima', i, j, tipo: 'atual' }],
          vertices: [
            { id: i, tipo: 'atual' },
            { id: j, tipo: 'atual' },
          ],
        });

        let acumulado = 0;
        for (let k = 0; k < n; k++) {
          const ate = anterior[i]?.[k] ?? 0;
          const aresta = adjacencia[k]?.[j] ?? 0;
          acumulado += ate * aresta;
          const valor = acumulado;
          rec.local({ k });
          atualizar(rec, (c) => ({ ...c, proxima: comCelula(c.proxima, i, j, valor) }));
          const contribui = ate * aresta > 0;
          const destaque: Destaque = {
            celulas: [
              { matriz: 'potencia', i, j: k, tipo: contribui ? 'sucesso' : 'comparado' },
              { matriz: 'proxima', i, j, tipo: 'atual' },
            ],
            vertices: [
              { id: i, tipo: 'atual' },
              { id: j, tipo: 'atual' },
              { id: k, tipo: contribui ? 'sucesso' : 'comparado' },
            ],
            arestas: aresta === 1 ? [{ u: k, w: j, tipo: contribui ? 'sucesso' : 'comparado' }] : [],
          };
          rec.passo(
            3,
            MC.acumula,
            contribui
              ? `potencia[${i}][${k}] × adjacencia[${k}][${j}] = ${ate} × ${aresta}: ${ate === 1 ? 'o caminho' : `os ${ate} caminhos`} até ${k} continuam pela aresta ${k}–${j}. proxima[${i}][${j}] = ${valor}.`
              : `potencia[${i}][${k}] × adjacencia[${k}][${j}] = ${ate} × ${aresta} = 0: ${aresta === 0 ? `${k} e ${j} não são adjacentes` : `nenhum caminho de comprimento ${r - 1} chega de ${i} a ${k}`}.`,
            destaque,
          );
        }
        rec.passo(2, MC.acumula, `${potenciaDeA(r)}[${i}][${j}] = ${acumulado}: ${caminhos(acumulado, r, i, j)}.`, {
          celulas: [{ matriz: 'proxima', i, j, tipo: acumulado > 0 ? 'sucesso' : 'comparado' }],
          vertices: [
            { id: i, tipo: 'atual' },
            { id: j, tipo: acumulado > 0 ? 'sucesso' : 'comparado' },
          ],
        });
      }
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        rec.local({ i, j, k: null });
        const bruto = rec.estado.conectividade?.proxima[i]?.[j] ?? 0;
        const limitado = bruto > LIMITE ? LIMITE : bruto;
        atualizar(rec, (c) => ({ ...c, potencia: comCelula(c.potencia, i, j, limitado) }));
        rec.passo(
          3,
          MC.limita,
          bruto > LIMITE ? `proxima[${i}][${j}] = ${bruto} passou do LIMITE: potencia guarda ${LIMITE} (só importa se é zero ou não).` : `potencia[${i}][${j}] = ${limitado}.`,
          { celulas: [{ matriz: 'potencia', i, j, tipo: 'atual' }] },
        );
        const novaSoma = (rec.estado.conectividade?.soma[i]?.[j] ?? 0) + limitado;
        atualizar(rec, (c) => ({ ...c, soma: comCelula(c.soma, i, j, novaSoma) }));
        rec.passo(3, MC.soma, `soma[${i}][${j}] = ${novaSoma}.`, { celulas: [{ matriz: 'soma', i, j, tipo: limitado > 0 ? 'sucesso' : 'atual' }] });
      }
    }
    atualizar(rec, (c) => ({ ...c, r }));
    rec.passo(2, MC.soma, `Agora soma conta os caminhos de comprimento 1 a ${r}.`);
  }
  rec.descartar('r', 'i', 'j', 'k');

  const somaFinal = rec.estado.conectividade?.soma ?? [];
  rec.printf(`S = A + A^2 + ... + A^${n - 1}:\n`);
  rec.passo(2, MC.titulo, `Imprime S = A + A² + … + ${potenciaDeA(n - 1)}.`);
  rec.printf(`    ${Array.from({ length: n }, (_, j) => `v${esquerda(j, 3)}`).join('')}\n`);
  somaFinal.forEach((linha, i) => {
    rec.printf(`v${esquerda(i, 3)}${linha.map((valor) => esquerda(valor, 4)).join('')}\n`);
    rec.local({ i });
    rec.passo(3, MC.linha, `Imprime a linha do vértice ${i} de S.`, { vertices: [{ id: i, tipo: 'atual' }] });
  });
  rec.descartar('i');

  // Conexo se existe caminho entre todo par de vértices distintos
  let conexo = true;
  rec.local({ conexo });
  rec.passo(2, MC.conexoInicio, 'Conexo se todo par de vértices distintos tem pelo menos um caminho: S[i][j] > 0.');
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const valor = somaFinal[i]?.[j] ?? 0;
      rec.local({ i, j });
      if (i === j) {
        rec.passo(3, MC.testa, `i == j: a diagonal não entra na verificação.`, { celulas: [{ matriz: 'soma', i, j, tipo: 'comparado' }] });
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
  rec.mutar((g) => ({ ...g, resultados: { ...g.resultados, conexo, somaCaminhos: somaFinal } }));
  rec.passo(1, MC.resultado, conexo ? 'Conexo: todo par de vértices está ligado por algum caminho.' : 'Não conexo: há vértices sem caminho entre si.');
  // potencia, proxima e soma são vetores locais: deixam de existir quando a função retorna.
  rec.mutar((g) => ({ ...g, conectividade: null }));
  rec.sair();
}
