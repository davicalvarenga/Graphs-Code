import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { C_LINHAS, C_SOURCE, lineOf } from '@/c-source/source';
import { avisosDeEntrada } from '../avisos';
import { EXEMPLOS, matrizDeArestas, paraStdin, type EntradaPrograma } from '../exemplos';
import { arestasVisiveis, chaveAresta, posicoes } from '../grafoVisual';
import { buildTrace, executar, MAX_CARACTERES_ENTRADA } from '../programa';
import { comCelula, comItem, ESTADO_INICIAL, InvarianteError, LimiteDePassosError, Recorder } from '../recorder';
import { Stdin } from '../scanf';
import type { EstadoGrafo, Trace } from '../types';

function exemplo(id: string): EntradaPrograma {
  const encontrado = EXEMPLOS.find((item) => item.id === id);
  if (!encontrado) {
    throw new Error(`exemplo ${id} inexistente`);
  }
  return encontrado.entrada;
}

function ultimoEstado(trace: Trace): EstadoGrafo {
  const ultimo = trace.passos[trace.passos.length - 1];
  if (!ultimo) {
    throw new Error('trace vazio');
  }
  return ultimo.estado;
}

describe('código-fonte C', () => {
  it('grafos-geral.generated.ts está sincronizado com grafos-geral.c', () => {
    const arquivo = readFileSync(join(process.cwd(), 'src', 'c-source', 'grafos-geral.c'), 'utf8').replace(/\r\n/g, '\n');
    expect(C_SOURCE).toBe(arquivo);
  });

  it('lineOf encontra trechos dentro da função certa', () => {
    const linha = lineOf('ehRoda', 'int borda =');
    expect(C_LINHAS[linha - 1]).toContain('int borda = (centro == 0) ? 1 : 0;');
    // "return false;" aparece em várias funções: a busca começa na assinatura pedida.
    expect(lineOf('ehCiclo', 'return false;', 2)).toBeGreaterThan(lineOf('ehCiclo', 'return false;', 1));
  });

  it('lineOf falha cedo para âncoras inexistentes', () => {
    expect(() => lineOf('naoExiste', 'x')).toThrow('Função "naoExiste"');
    expect(() => lineOf('ehCompleto', 'trecho que não existe')).toThrow('não encontrado em ehCompleto()');
    expect(() => lineOf('ehCompleto', 'return true;', 2)).toThrow('ocorrência 2');
  });
});

describe('Stdin (semântica de scanf("%d"))', () => {
  it('ignora espaços e quebras de linha e aceita sinal', () => {
    const stdin = new Stdin('  +3\n\t-2   0');
    expect(stdin.lerInt()).toEqual({ ok: true, valor: 3 });
    expect(stdin.lerInt()).toEqual({ ok: true, valor: -2 });
    expect(stdin.lerInt()).toEqual({ ok: true, valor: 0 });
    expect(stdin.lerInt()).toEqual({ ok: false, motivo: 'eof' });
  });

  it('consome só o prefixo numérico e falha no token seguinte', () => {
    const stdin = new Stdin('3abc');
    expect(stdin.lerInt()).toEqual({ ok: true, valor: 3 });
    expect(stdin.lerInt()).toEqual({ ok: false, motivo: 'invalido' });
  });

  it('sinal sem dígitos é falha de casamento', () => {
    expect(new Stdin('-x').lerInt()).toEqual({ ok: false, motivo: 'invalido' });
    expect(new Stdin('-0').lerInt()).toEqual({ ok: true, valor: 0 });
  });
});

describe('Recorder', () => {
  it('não grava passos acima do nível pedido', () => {
    const rec = new Recorder(1);
    rec.entrar('main');
    rec.passo(1, 10, 'grava');
    rec.passo(2, 11, 'ignora');
    expect(rec.passos.map((p) => p.linha)).toEqual([10]);
  });

  it('lança LimiteDePassosError ao exceder o teto', () => {
    const rec = new Recorder(3, 1);
    rec.passo(1, 1, 'a');
    expect(() => rec.passo(1, 2, 'b')).toThrow(LimiteDePassosError);
  });

  it('passos antigos não são afetados por mutações posteriores (copy-on-write)', () => {
    const rec = new Recorder(3);
    rec.entrar('f', { x: 1 });
    rec.mutar((g) => ({ ...g, v: 2, adjacencia: [[0, 0], [0, 0]] }));
    rec.passo(1, 1, 'antes');
    rec.mutar((g) => ({ ...g, adjacencia: comCelula(g.adjacencia ?? [], 0, 1, 1) }));
    rec.local({ x: 2 });
    rec.descartar('inexistente');
    rec.passo(1, 2, 'depois');
    const [antes, depois] = rec.passos;
    expect(antes?.estado.adjacencia?.[0]).toEqual([0, 0]);
    expect(depois?.estado.adjacencia?.[0]).toEqual([0, 1]);
    expect(antes?.estado.adjacencia?.[1]).toBe(depois?.estado.adjacencia?.[1]);
    expect(antes?.pilha[0]?.locais).toEqual({ x: 1 });
    expect(depois?.pilha[0]?.locais).toEqual({ x: 2 });
  });

  it('descartar remove variáveis fora de escopo', () => {
    const rec = new Recorder(1);
    rec.entrar('f', { i: 1, j: 2 });
    rec.descartar('i');
    rec.passo(1, 1, 'x');
    expect(rec.passos[0]?.pilha[0]?.locais).toEqual({ j: 2 });
  });

  it('local sem função ativa é erro de invariante', () => {
    expect(() => new Recorder(1).local({ x: 1 })).toThrow(InvarianteError);
    expect(() => new Recorder(1).descartar('x')).not.toThrow();
  });

  it('comItem copia o vetor alterando uma posição', () => {
    const original = [1, 2, 3];
    expect(comItem(original, 1, 9)).toEqual([1, 9, 3]);
    expect(original).toEqual([1, 2, 3]);
  });
});

describe('buildTrace', () => {
  it('executa os módulos na ordem do programa C', () => {
    const resultado = buildTrace(exemplo('roda-w5'));
    if (!resultado.ok) throw new Error(resultado.erro);
    const ordem = resultado.trace.passos.map((p) => p.modulo).filter((m, i, todos) => m !== todos[i - 1]);
    expect(ordem).toEqual(['entrada', 'transformacoes', 'classificacao', 'cliques', 'conectividade', 'fim']);
    expect(resultado.trace.exitCode).toBe(0);
    expect(resultado.trace.nivelGravado).toBe(3);
  });

  it('todo passo aponta para uma linha existente e o stdout só cresce', () => {
    for (const { entrada } of EXEMPLOS) {
      const resultado = buildTrace(entrada);
      if (!resultado.ok) throw new Error(resultado.erro);
      let anterior = 0;
      for (const passo of resultado.trace.passos) {
        expect(passo.linha).toBeGreaterThanOrEqual(1);
        expect(passo.linha).toBeLessThanOrEqual(C_LINHAS.length);
        expect(passo.stdoutFim).toBeGreaterThanOrEqual(anterior);
        anterior = passo.stdoutFim;
      }
      expect(anterior).toBe(resultado.trace.stdout.length);
    }
  });

  it('registra os resultados das classificações', () => {
    const roda = buildTrace(exemplo('roda-w5'));
    const bipartido = buildTrace(exemplo('bipartido-k23'));
    const k4 = buildTrace(exemplo('completo-k4'));
    if (!roda.ok || !bipartido.ok || !k4.ok) throw new Error('falha inesperada');

    expect(ultimoEstado(roda.trace).resultados).toMatchObject({ roda: true, centro: 0, completo: false, bipartido: false, euleriano: 'nao' });
    expect(ultimoEstado(roda.trace).resultados.triangulos).toHaveLength(4);
    expect(ultimoEstado(bipartido.trace).resultados).toMatchObject({ bipartido: { X: [0, 1], Y: [2, 3, 4] }, euleriano: 'caminho' });
    // Fidelidade ao C: o centro é o ÚLTIMO vértice com grau v-1.
    expect(ultimoEstado(k4.trace).resultados).toMatchObject({ completo: true, roda: true, centro: 3, euleriano: 'nao' });
    expect(ultimoEstado(k4.trace).resultados.cliques).toEqual([{ membros: [0, 1, 2, 3], tamanho: 4 }]);
    expect(ultimoEstado(k4.trace).liberado).toBe(true);
    // liberarGrafo só destaca os nós: as listas continuam visíveis no fim.
    expect(ultimoEstado(k4.trace).lista).toEqual([[1, 2, 3], [0, 2, 3], [0, 1, 3], [0, 1, 2]]);
  });

  it('erros do programa são passos do trace com exitCode 1', () => {
    const resultado = buildTrace(exemplo('erro-paralelas'));
    if (!resultado.ok) throw new Error(resultado.erro);
    expect(resultado.trace.exitCode).toBe(1);
    expect(ultimoEstado(resultado.trace).resultados.erro).toBe('Erro: as arestas e0 e e2 são paralelas');
    expect(resultado.trace.passos[resultado.trace.passos.length - 1]?.modulo).toBe('fim');
  });

  it('reduz o nível de detalhe quando o trace excede o limite', () => {
    const resultado = buildTrace(exemplo('completo-k4'), 200);
    if (!resultado.ok) throw new Error(resultado.erro);
    expect(resultado.trace.nivelGravado).toBeLessThan(3);
    expect(resultado.trace.passos.length).toBeLessThanOrEqual(200);
  });

  it('retorna erro quando nem o nível mínimo cabe no limite', () => {
    expect(buildTrace(exemplo('completo-k4'), 3)).toEqual({ ok: false, erro: expect.stringContaining('mais de 3 passos') });
  });

  it('rejeita entradas grandes demais', () => {
    const resultado = buildTrace({ vertices: '3', arestas: '3', matriz: '1 '.repeat(MAX_CARACTERES_ENTRADA) });
    expect(resultado).toEqual({ ok: false, erro: expect.stringContaining('Entrada muito grande') });
  });

  it('converte exceções internas em resultado de erro', () => {
    const espiao = jest.spyOn(Recorder.prototype, 'printf').mockImplementationOnce(() => {
      throw new InvarianteError('estado corrompido');
    });
    expect(buildTrace(exemplo('ciclo-c5'))).toEqual({ ok: false, erro: 'Falha interna ao simular o programa: estado corrompido.' });
    espiao.mockImplementationOnce(() => {
      throw new TypeError('bug');
    });
    expect(buildTrace(exemplo('ciclo-c5'))).toEqual({ ok: false, erro: 'Falha interna ao simular o programa: erro inesperado.' });
  });
});

describe('invariantes em grafos aleatórios', () => {
  // PRNG determinístico para reprodutibilidade.
  function mulberry32(semente: number) {
    let a = semente;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  it('graus somam 2e, adjacência é simétrica e listas são crescentes', () => {
    const aleatorio = mulberry32(42);
    for (let n = 0; n < 60; n++) {
      const v = 1 + Math.floor(aleatorio() * 9);
      const arestas: [number, number][] = [];
      for (let i = 0; i < v; i++) for (let j = i + 1; j < v; j++) if (aleatorio() < 0.5) arestas.push([i, j]);
      const trace = executar(paraStdin({ vertices: String(v), arestas: String(arestas.length), matriz: matrizDeArestas(v, arestas) }), 2);

      const antesDeLiberar = [...trace.passos].reverse().find((p) => p.modulo === 'cliques')?.estado;
      expect(antesDeLiberar).toBeDefined();
      const estado = antesDeLiberar as EstadoGrafo;
      const graus = estado.grau as number[];
      expect(graus.reduce((soma, g) => soma + g, 0)).toBe(2 * arestas.length);
      estado.adjacencia?.forEach((linha, i) => linha.forEach((valor, j) => expect(estado.adjacencia?.[j]?.[i]).toBe(valor)));
      estado.lista?.forEach((vizinhos, u) => {
        expect([...vizinhos].sort((a, b) => a - b)).toEqual(vizinhos);
        expect(vizinhos).toHaveLength(graus[u] as number);
      });
    }
  });
});

describe('avisosDeEntrada (dicas fora do C)', () => {
  it.each([
    [{ vertices: 'x', arestas: '0', matriz: '' }, ['Vértices: informe um único número inteiro.']],
    [{ vertices: '21', arestas: '0', matriz: '' }, ['Vértices: o programa aceita de 1 a 20.']],
    [{ vertices: '3', arestas: '', matriz: '' }, ['Arestas: informe um único número inteiro.']],
    [{ vertices: '3', arestas: '4', matriz: '' }, ['Arestas: com 3 vértice(s) o máximo é 3.']],
    [{ vertices: '2', arestas: '1', matriz: '1 2' }, ['Matriz: há valores diferentes de 0 e 1.']],
    [{ vertices: '2', arestas: '1', matriz: '1' }, ['Matriz: esperados 2×1 = 2 valores, recebidos 1.']],
    [{ vertices: '2', arestas: '1', matriz: '1\n1' }, []],
  ])('%j', (entrada, esperado) => {
    expect(avisosDeEntrada(entrada)).toEqual(esperado);
  });
});

describe('grafoVisual', () => {
  const base: EstadoGrafo = { ...ESTADO_INICIAL, v: 4, e: 0 };

  it('usa layout circular por padrão', () => {
    const pontos = posicoes(base);
    expect(pontos).toHaveLength(4);
    expect(pontos[0]?.x).toBeCloseTo(300);
    expect(pontos[0]?.y).toBeCloseTo(70);
  });

  it('coloca um vértice único no centro e o centro da roda no meio', () => {
    expect(posicoes({ ...base, v: 1 })).toEqual([{ x: 300, y: 300 }]);
    const roda = posicoes({ ...base, resultados: { ...base.resultados, centro: 2 } });
    expect(roda[2]).toEqual({ x: 300, y: 300 });
  });

  it('separa as partições bipartidas em duas colunas', () => {
    const pontos = posicoes({ ...base, resultados: { ...base.resultados, bipartido: { X: [0, 3], Y: [1, 2] } } });
    expect(pontos.map((p) => p.x)).toEqual([170, 430, 430, 170]);
  });

  it('desenha colunas completas da incidência e agrupa paralelas', () => {
    const estado: EstadoGrafo = {
      ...base,
      v: 3,
      e: 4,
      incidencia: [
        [1, 1, 1, null],
        [1, 1, 0, 1],
        [0, 0, 1, 0],
      ],
    };
    expect(arestasVisiveis(estado)).toEqual([
      { chave: '0-1', u: 0, w: 1, origem: 'incidencia', colunas: [0, 1] },
      { chave: '0-2', u: 0, w: 2, origem: 'incidencia', colunas: [2] },
    ]);
  });

  it('arestas da adjacência substituem as da incidência', () => {
    const estado: EstadoGrafo = { ...base, v: 2, e: 1, incidencia: [[1], [1]], adjacencia: [[0, 1], [1, 0]] };
    expect(arestasVisiveis(estado)).toEqual([{ chave: '0-1', u: 0, w: 1, origem: 'adjacencia', colunas: [0] }]);
    expect(chaveAresta(5, 2)).toBe('2-5');
  });
});

describe('moduloConectividade', () => {
  function completo(v: number): EntradaPrograma {
    const arestas: [number, number][] = [];
    for (let i = 0; i < v; i++) for (let j = i + 1; j < v; j++) arestas.push([i, j]);
    return { vertices: String(v), arestas: String(arestas.length), matriz: matrizDeArestas(v, arestas) };
  }

  it('soma as potências da adjacência e conclui se o grafo é conexo', () => {
    const conexo = buildTrace(exemplo('ciclo-c5'));
    const separado = buildTrace(exemplo('desconexo'));
    if (!conexo.ok || !separado.ok) throw new Error('falha inesperada');

    // C5: S[0][1] = caminhos de comprimento 1 a 4 entre vizinhos = 1 + 0 + 3 + 1 (a volta 0–4–3–2–1).
    expect(ultimoEstado(conexo.trace).resultados).toMatchObject({ conexo: true });
    expect(ultimoEstado(conexo.trace).resultados.somaCaminhos?.[0]?.[1]).toBe(5);
    expect(ultimoEstado(separado.trace).resultados.conexo).toBe(false);
    expect(ultimoEstado(separado.trace).resultados.somaCaminhos?.[0]?.[2]).toBe(0);
  });

  it('mantém as matrizes locais só enquanto a função está na pilha', () => {
    const resultado = buildTrace(exemplo('roda-w5'));
    if (!resultado.ok) throw new Error(resultado.erro);
    const dentro = resultado.trace.passos.filter((p) => p.pilha.at(-1)?.fn === 'moduloConectividade');
    const multiplicando = dentro.find((p) => p.estado.conectividade?.r === 2);
    expect(multiplicando?.estado.conectividade?.potencia[0]?.[1]).toBeGreaterThan(0);
    // proxima começa com lixo de memória (null) antes do primeiro produto.
    const primeiro = dentro.find((p) => p.estado.conectividade !== null);
    expect(primeiro?.estado.conectividade?.proxima[0]?.[0]).toBeNull();
    expect(ultimoEstado(resultado.trace).conectividade).toBeNull();
  });

  it('limita as contagens de caminhos em grafos densos, como o #define LIMITE do C', () => {
    const trace = executar(paraStdin(completo(12)), 3);
    expect(trace.passos.some((p) => p.nota.includes('passou do LIMITE'))).toBe(true);
    expect(trace.stdout).toContain('Conexo: Sim');
  });

  it('com um único vértice não multiplica nada e considera o grafo conexo', () => {
    const trace = executar(paraStdin({ vertices: '1', arestas: '0', matriz: '' }), 3);
    expect(trace.stdout).toContain('S = A + A^2 + ... + A^0:');
    expect(trace.passos.some((p) => p.nota.startsWith('r = '))).toBe(false);
    expect(ultimoEstado(trace).resultados.conexo).toBe(true);
  });
});
