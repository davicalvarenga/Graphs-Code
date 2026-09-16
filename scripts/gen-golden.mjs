// Gera tests/golden/casos.json executando o programa C real (gcc) sobre cada entrada.
// Uso: npm run golden   (requer gcc no PATH; o CI usa apenas o JSON commitado)
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXEMPLOS, matrizDeArestas, paraStdin } from '../src/engine/exemplos.ts';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const binDir = join(raiz, 'tests', 'golden', '.bin');
const binario = join(binDir, process.platform === 'win32' ? 'grafos.exe' : 'grafos');

mkdirSync(binDir, { recursive: true });
const compilacao = spawnSync('gcc', ['-std=c99', '-Wall', '-O0', '-o', binario, join(raiz, 'src', 'c-source', 'grafos.c')], {
  encoding: 'utf8',
});
if (compilacao.status !== 0) {
  console.error(compilacao.stderr || compilacao.error);
  process.exit(1);
}

// PRNG determinístico (mulberry32) para que os casos aleatórios sejam reprodutíveis.
function mulberry32(semente) {
  let a = semente;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function completo(v) {
  const arestas = [];
  for (let i = 0; i < v; i++) for (let j = i + 1; j < v; j++) arestas.push([i, j]);
  return arestas;
}

function stdinDeArestas(v, arestas) {
  return `${v}\n${arestas.length}\n${matrizDeArestas(v, arestas)}\n`;
}

const casos = [
  ...EXEMPLOS.map((exemplo) => ({ id: `exemplo-${exemplo.id}`, stdin: paraStdin(exemplo.entrada) })),
  { id: 'v-zero', stdin: '0\n' },
  { id: 'v-texto', stdin: 'abc\n' },
  { id: 'v-vazio', stdin: '' },
  { id: 'v-3abc', stdin: '3abc\n' },
  { id: 'e-negativo', stdin: '3\n-1\n' },
  { id: 'e-excede', stdin: '3\n4\n' },
  { id: 'e-vazio', stdin: '3\n' },
  { id: 'v1-e0', stdin: '1\n0\n' },
  { id: 'v2-e1', stdin: '2\n1\n1\n1\n' },
  { id: 'matriz-incompleta', stdin: '3\n2\n1 1\n1\n' },
  { id: 'matriz-texto', stdin: '2\n1\n1\nx\n' },
  { id: 'coluna-um-vertice', stdin: '3\n1\n1\n0\n0\n' },
  { id: 'coluna-zero-vertices', stdin: '3\n1\n0\n0\n0\n' },
  { id: 'sinais-e-espacos', stdin: '  +3 \n\t+2\n+1 0\n1\t1\n  0 +1  \n' },
  { id: 'tokens-extras', stdin: '2\n1\n1\n1\n9 9 9\n' },
  { id: 'estrela-k14', stdin: stdinDeArestas(5, [[0, 1], [0, 2], [0, 3], [0, 4]]) },
  { id: 'c4', stdin: stdinDeArestas(4, [[0, 1], [1, 2], [2, 3], [3, 0]]) },
  { id: 'dois-ciclos', stdin: stdinDeArestas(6, [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3]]) },
  {
    id: 'petersen',
    stdin: stdinDeArestas(10, [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 5], [1, 6], [2, 7], [3, 8], [4, 9],
      [5, 7], [7, 9], [9, 6], [6, 8], [8, 5],
    ]),
  },
  { id: 'k20', stdin: stdinDeArestas(20, completo(20)) },
];

const aleatorio = mulberry32(2026);
for (let n = 0; n < 40; n++) {
  const v = 1 + Math.floor(aleatorio() * 10);
  const densidade = 0.15 + aleatorio() * 0.8;
  const arestas = completo(v)
    .filter(() => aleatorio() < densidade)
    .map(([a, b]) => (aleatorio() < 0.5 ? [a, b] : [b, a]))
    .sort(() => aleatorio() - 0.5);
  casos.push({ id: `aleatorio-${String(n).padStart(2, '0')}`, stdin: stdinDeArestas(v, arestas) });
}

const resultado = casos.map((caso) => {
  const execucao = spawnSync(binario, [], { input: caso.stdin, maxBuffer: 16 * 1024 * 1024 });
  if (execucao.error) throw execucao.error;
  return {
    ...caso,
    stdout: execucao.stdout.toString('utf8').replace(/\r\n/g, '\n'),
    exitCode: execucao.status,
  };
});

writeFileSync(join(raiz, 'tests', 'golden', 'casos.json'), `${JSON.stringify(resultado, null, 2)}\n`);
console.log(`${resultado.length} casos gravados em tests/golden/casos.json`);
