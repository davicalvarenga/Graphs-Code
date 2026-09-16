import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { C_LINHAS, lineOf } from '@/c-source/source';
import { ESTADO_INICIAL } from '@/engine/recorder';
import type { EstadoGrafo } from '@/engine/types';
import { passoOnde, traceDoExemplo } from '@/test-utils/traces';
import { CodePanel } from '../CodePanel';
import { abaSugerida, DataPanel } from '../DataPanel';
import { ErrorBoundary } from '../ErrorBoundary';
import { GraphView } from '../GraphView';
import { InputPanel } from '../InputPanel';
import { partesDaNota } from '../Nota';
import { PlayerControls } from '../PlayerControls';

describe('CodePanel', () => {
  const linhaBorda = lineOf('ehRoda', 'int borda =');

  it('mostra só as linhas vizinhas, com a linha ativa destacada', () => {
    const { container } = render(<CodePanel linha={linhaBorda} pilha={[{ fn: 'main', locais: {} }, { fn: 'ehRoda', locais: { centro: 0, borda: null } }]} />);

    const linhas = container.querySelectorAll('[data-linha]');
    expect(linhas).toHaveLength(5);
    const ativa = container.querySelector('[aria-current="step"]');
    expect(ativa).toHaveAttribute('data-linha', String(linhaBorda));
    expect(ativa).toHaveTextContent('int borda = (centro == 0) ? 1 : 0;');

    expect(screen.getByText(/linha \d+/)).toHaveTextContent(`ehRoda · linha ${linhaBorda}`);
    expect(screen.getByText('main › ehRoda')).toBeInTheDocument();
    expect(screen.getByLabelText('Variáveis locais')).toHaveTextContent('centro 0 · borda ?');
  });

  it('informa quando a função não tem variáveis locais', () => {
    render(<CodePanel linha={10} pilha={[{ fn: 'main', locais: {} }]} />);
    expect(screen.getByLabelText('Variáveis locais')).toHaveTextContent('sem variáveis locais');
  });

  it('abre o arquivo inteiro numerado e volta para a janela', async () => {
    const usuario = userEvent.setup();
    const { container } = render(<CodePanel linha={linhaBorda} pilha={[]} />);

    await usuario.click(screen.getByRole('button', { name: 'ver a função inteira' }));
    expect(container.querySelectorAll('[data-linha]')).toHaveLength(C_LINHAS.length);
    expect(screen.getByText(String(linhaBorda))).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'ver só as linhas vizinhas' }));
    expect(container.querySelectorAll('[data-linha]')).toHaveLength(5);
  });

  describe('rolagem automática do arquivo inteiro', () => {
    // Geometria simulada: área de código com 600px de altura começando 200px abaixo do topo
    // da página, linhas de 20px. Reproduz o layout real, em que o container não está no topo.
    const ALTURA_LINHA = 20;
    const TOPO_CONTAINER = 200;
    const ALTURA_CONTAINER = 600;
    let scrollTopAtual = 0;
    const scrollTo = jest.fn((opcoes: ScrollToOptions) => {
      // Como o navegador: não rola acima do início do conteúdo.
      scrollTopAtual = Math.max(0, opcoes.top ?? 0);
    });

    beforeEach(() => {
      scrollTopAtual = 0;
      scrollTo.mockClear();
      Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scrollTo });
      Object.defineProperty(HTMLElement.prototype, 'scrollTop', { configurable: true, get: () => scrollTopAtual });
      jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        const linha = Number(this.dataset.linha);
        if (linha) {
          const topo = TOPO_CONTAINER + (linha - 1) * ALTURA_LINHA - scrollTopAtual;
          return { top: topo, bottom: topo + ALTURA_LINHA, height: ALTURA_LINHA } as DOMRect;
        }
        return { top: TOPO_CONTAINER, bottom: TOPO_CONTAINER + ALTURA_CONTAINER, height: ALTURA_CONTAINER } as DOMRect;
      });
    });

    afterEach(() => {
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollTop');
    });

    function topoVisivelDaLinha(linha: number): number {
      return (linha - 1) * ALTURA_LINHA - scrollTopAtual;
    }

    async function abrirArquivoInteiro(linha: number) {
      const usuario = userEvent.setup();
      const utilitarios = render(<CodePanel linha={linha} pilha={[]} />);
      await usuario.click(screen.getByRole('button', { name: 'ver a função inteira' }));
      scrollTo.mockClear();
      return utilitarios;
    }

    it('centraliza a linha ativa quando ela sai da área visível', async () => {
      const { rerender } = await abrirArquivoInteiro(1);
      rerender(<CodePanel linha={300} pilha={[]} />);
      expect(scrollTo).toHaveBeenCalledTimes(1);
      expect(topoVisivelDaLinha(300)).toBe((ALTURA_CONTAINER - ALTURA_LINHA) / 2);
    });

    it('acompanha a execução avançando linha a linha sem deixar a linha escondida', async () => {
      const { rerender } = await abrirArquivoInteiro(1);
      for (let linha = 2; linha <= 200; linha++) {
        rerender(<CodePanel linha={linha} pilha={[]} />);
        const topo = topoVisivelDaLinha(linha);
        expect(topo).toBeGreaterThanOrEqual(0);
        expect(topo + ALTURA_LINHA).toBeLessThanOrEqual(ALTURA_CONTAINER);
      }
    });

    it('não rola enquanto a linha continua longe das bordas', async () => {
      const { rerender } = await abrirArquivoInteiro(10);
      rerender(<CodePanel linha={12} pilha={[]} />);
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('não rola na janela de linhas vizinhas', () => {
      const { rerender } = render(<CodePanel linha={10} pilha={[]} />);
      rerender(<CodePanel linha={300} pilha={[]} />);
      expect(scrollTo).not.toHaveBeenCalled();
    });
  });
});

describe('Nota', () => {
  it('separa trechos de código do texto comum', () => {
    expect(partesDaNota('Soma incidencia[2][5] = 1 ⇒ cont = 1.')).toEqual([
      { texto: 'Soma ', codigo: false },
      { texto: 'incidencia[2][5]', codigo: true },
      { texto: ' = 1 ⇒ cont = 1.', codigo: false },
    ]);
    expect(partesDaNota('Chamada recursiva dfs(3).')).toEqual([
      { texto: 'Chamada recursiva ', codigo: false },
      { texto: 'dfs(3)', codigo: true },
      { texto: '.', codigo: false },
    ]);
    expect(partesDaNota('texto simples')).toEqual([{ texto: 'texto simples', codigo: false }]);
  });
});

describe('GraphView', () => {
  it('orienta o usuário antes de o grafo ser criado', () => {
    render(<GraphView estado={ESTADO_INICIAL} destaque={{}} />);
    expect(screen.getByText(/O grafo aparece quando/)).toBeInTheDocument();
  });

  it('desenha vértices, arestas e destaques do passo', () => {
    const trace = traceDoExemplo('roda-w5');
    const passo = passoOnde(trace, (p) => p.pilha.at(-1)?.fn === 'incidenciaParaAdjacencia' && (p.destaque.arestas?.length ?? 0) > 0);
    render(<GraphView estado={passo.estado} destaque={passo.destaque} />);

    for (let v = 0; v < 5; v++) {
      expect(screen.getByTestId(`vertice-${v}`)).toBeInTheDocument();
    }
    const arestaDestacada = passo.destaque.arestas?.[0];
    const chave = `${Math.min(arestaDestacada?.u ?? 0, arestaDestacada?.w ?? 0)}-${Math.max(arestaDestacada?.u ?? 0, arestaDestacada?.w ?? 0)}`;
    expect(screen.getByTestId(`aresta-${chave}`)).toHaveAttribute('data-destaque', 'sucesso');
    expect(screen.getByTestId(`aresta-${chave}`)).toHaveAttribute('data-origem', 'adjacencia');
    // Arestas são curvas: um caminho quadrático, não um segmento de reta.
    expect(screen.getByTestId(`aresta-${chave}`).getAttribute('d')).toMatch(/^M .+ Q .+/);
    expect(screen.getByRole('img', { name: /Grafo com 5 vértice\(s\)/ })).toBeInTheDocument();
  });

  it('marca o centro da roda, vértice ignorado e pares não adjacentes', () => {
    const trace = traceDoExemplo('roda-w5');
    const final = trace.passos[trace.passos.length - 1];
    if (!final) throw new Error('trace vazio');
    const estado: EstadoGrafo = { ...final.estado, liberado: false, grau: [4, 3, 3, 3, 3], visitado: [false, true, false, false, false] };
    render(
      <GraphView
        estado={estado}
        destaque={{ ignorado: 0, arestas: [{ u: 1, w: 3, tipo: 'falha' }], vertices: [{ id: 1, tipo: 'atual' }, { id: 1, tipo: 'comparado' }] }}
      />,
    );

    expect(screen.getByTestId('centro-roda')).toBeInTheDocument();
    expect(screen.getByTestId('vertice-0')).toHaveAttribute('opacity', '0.4');
    expect(screen.getByTestId('fantasma-1-3')).toBeInTheDocument();
    expect(screen.getByTestId('vertice-1')).toHaveAttribute('data-destaque', 'atual');
    fireEvent.click(screen.getByRole('button', { name: 'Centralizar' }));
  });

  it('colore partições durante a bipartição e indica memória liberada', () => {
    const trace = traceDoExemplo('bipartido-k23');
    const colorindo = passoOnde(trace, (p) => p.estado.cor !== null && p.estado.cor.includes(1));
    const { unmount } = render(<GraphView estado={colorindo.estado} destaque={colorindo.destaque} />);
    unmount();
    const final = trace.passos[trace.passos.length - 1];
    if (!final) throw new Error('trace vazio');
    render(<GraphView estado={final.estado} destaque={{}} rodape="5 vértice(s)" />);
    expect(screen.getByText('memória liberada')).toBeInTheDocument();
  });
});

describe('DataPanel', () => {
  const trace = traceDoExemplo('roda-w5');

  it('segue a execução escolhendo a aba da função atual', () => {
    const passo = passoOnde(trace, (p) => p.pilha.at(-1)?.fn === 'validarParalelas' && (p.destaque.celulas?.length ?? 0) > 0);
    render(<DataPanel estado={passo.estado} destaque={passo.destaque} pilha={passo.pilha} saida="" />);
    expect(screen.getByRole('tab', { name: 'incidência' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('table', { name: 'Matriz de incidência' }).querySelectorAll('[data-destaque]').length).toBeGreaterThan(0);
  });

  it('permite trocar de aba manualmente e navegar com as setas', async () => {
    const usuario = userEvent.setup();
    const passo = passoOnde(trace, (p) => p.modulo === 'cliques' && p.estado.resultados.triangulos.length > 0);
    render(
      <DataPanel
        estado={passo.estado}
        destaque={{ ...passo.destaque, no: { u: 0, indice: 0 }, vertices: [{ id: 0, tipo: 'falha' }] }}
        pilha={passo.pilha}
        saida="Saída do C"
      />,
    );

    await usuario.click(screen.getByRole('tab', { name: 'lista' }));
    expect(screen.getByRole('list', { name: 'Lista de adjacência' })).toHaveTextContent('v01→2→3→4→NULL');
    expect(screen.getByRole('checkbox', { name: 'seguir execução' })).not.toBeChecked();

    fireEvent.keyDown(screen.getByRole('tab', { name: 'lista' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'graus' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('list', { name: 'Vetor de graus' })).toHaveTextContent('grau[0] = 4');

    fireEvent.keyDown(screen.getByRole('tab', { name: 'graus' }), { key: 'ArrowRight' });
    expect(screen.getByText(/Triângulos \(K₃\): 1/)).toBeInTheDocument();
    expect(screen.getByText('(centro 0)')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('tab', { name: 'resultados' }), { key: 'ArrowRight' });
    expect(screen.getByLabelText('Saída do programa')).toHaveTextContent('Saída do C');

    fireEvent.keyDown(screen.getByRole('tab', { name: 'saída' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'incidência' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'incidência' }), { key: 'ArrowLeft' });
    fireEvent.keyDown(screen.getByRole('tab', { name: 'saída' }), { key: 'Enter' });
    expect(screen.getByRole('tab', { name: 'saída' })).toHaveAttribute('aria-selected', 'true');

    await usuario.click(screen.getByRole('tab', { name: 'adjacência' }));
    expect(screen.getByRole('table', { name: 'Matriz de adjacência' })).toBeInTheDocument();

    await usuario.click(screen.getByRole('checkbox', { name: 'seguir execução' }));
    expect(screen.getByRole('checkbox', { name: 'seguir execução' })).toBeChecked();
  });

  it('mostra vetores auxiliares e mensagens de estruturas não alocadas', async () => {
    const usuario = userEvent.setup();
    const estado: EstadoGrafo = { ...ESTADO_INICIAL, visitado: [true, false], cor: [0, 1, -1] };
    render(<DataPanel estado={estado} destaque={{}} pilha={[{ fn: 'colorir', locais: {} }]} saida="" />);
    expect(screen.getByText('visitado[] (DFS)')).toBeInTheDocument();
    expect(screen.getByText(/\[2\] -1/)).toBeInTheDocument();
    expect(screen.getAllByText('pendente')).toHaveLength(6);

    for (const [aba, mensagem] of [
      ['incidência', 'A matriz de incidência ainda não foi alocada.'],
      ['adjacência', 'A matriz de adjacência ainda não foi alocada.'],
      ['lista', 'As listas ainda não foram alocadas.'],
      ['graus', 'O vetor de graus ainda não foi alocado.'],
    ] as const) {
      await usuario.click(screen.getByRole('tab', { name: aba }));
      expect(screen.getByText(mensagem)).toBeInTheDocument();
    }
  });

  it('informa matriz sem colunas e sugere abas por função', () => {
    render(<DataPanel estado={{ ...ESTADO_INICIAL, v: 2, incidencia: [[], []] }} destaque={{}} pilha={[{ fn: 'criarGrafo', locais: {} }]} saida="" />);
    expect(screen.getByText('Matriz de incidência: sem colunas (e = 0).')).toBeInTheDocument();
    expect(abaSugerida([])).toBe('saida');
    expect(abaSugerida([{ fn: 'funcaoDesconhecida', locais: {} }])).toBe('saida');
    expect(abaSugerida([{ fn: 'dfs', locais: {} }])).toBe('resultados');
  });
});

describe('PlayerControls', () => {
  function renderizar(sobrescrever: Partial<Parameters<typeof PlayerControls>[0]> = {}) {
    const props = {
      indice: 2,
      total: 10,
      tocando: false,
      modulo: 'classificacao' as const,
      modulos: [
        { modulo: 'entrada' as const, indice: 0 },
        { modulo: 'transformacoes' as const, indice: 4 },
        { modulo: 'classificacao' as const, indice: 7 },
      ],
      intervaloMs: 600,
      detalhe: 3 as const,
      nivelGravado: 3 as const,
      onAlternar: jest.fn(),
      onAvancar: jest.fn(),
      onVoltar: jest.fn(),
      onIr: jest.fn(),
      onIntervalo: jest.fn(),
      onDetalhe: jest.fn(),
      ...sobrescrever,
    };
    render(<PlayerControls {...props} />);
    return props;
  }

  it('dispara as ações de navegação', async () => {
    const usuario = userEvent.setup();
    const props = renderizar();
    await usuario.click(screen.getByRole('button', { name: 'Executar' }));
    await usuario.click(screen.getByRole('button', { name: 'Próximo passo' }));
    await usuario.click(screen.getByRole('button', { name: 'Passo anterior' }));
    await usuario.click(screen.getByRole('button', { name: 'Ir para o início' }));
    await usuario.click(screen.getByRole('button', { name: 'transformações' }));
    await usuario.selectOptions(screen.getByRole('combobox', { name: 'velocidade' }), '250');
    await usuario.selectOptions(screen.getByRole('combobox', { name: 'detalhe' }), '1');
    fireEvent.change(screen.getByRole('slider'), { target: { value: '7' } });

    expect(props.onAlternar).toHaveBeenCalled();
    expect(props.onAvancar).toHaveBeenCalled();
    expect(props.onVoltar).toHaveBeenCalled();
    expect(props.onIr).toHaveBeenCalledWith(0);
    expect(props.onIr).toHaveBeenCalledWith(4);
    expect(props.onIr).toHaveBeenCalledWith(7);
    expect(props.onIntervalo).toHaveBeenCalledWith(250);
    expect(props.onDetalhe).toHaveBeenCalledWith(1);
    expect(screen.getByRole('button', { name: 'classificação' })).toHaveAttribute('aria-current', 'step');
  });

  it('desabilita botões nos extremos e oculta níveis não gravados', () => {
    renderizar({ indice: 0, total: 1, tocando: true, nivelGravado: 2, detalhe: 2 });
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Passo anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próximo passo' })).toBeDisabled();
    expect(screen.queryByRole('option', { name: 'toda linha' })).not.toBeInTheDocument();
  });
});

describe('InputPanel', () => {
  it('edita os campos, carrega exemplos e executa', async () => {
    const usuario = userEvent.setup();
    const onChange = jest.fn();
    const onExecutar = jest.fn();
    render(<InputPanel entrada={{ vertices: '21', arestas: '0', matriz: '' }} onChange={onChange} onExecutar={onExecutar} />);

    expect(screen.getByRole('status')).toHaveTextContent('Vértices: o programa aceita de 1 a 20.');
    expect(screen.getByText(/Informe o número de vértices/)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'vértices' }), { target: { value: '4' } });
    expect(onChange).toHaveBeenLastCalledWith({ vertices: '4', arestas: '0', matriz: '' });
    fireEvent.change(screen.getByRole('textbox', { name: 'arestas' }), { target: { value: '2' } });
    expect(onChange).toHaveBeenLastCalledWith({ vertices: '21', arestas: '2', matriz: '' });
    fireEvent.change(screen.getByRole('textbox', { name: /matriz de incidência/ }), { target: { value: '1 0' } });
    expect(onChange).toHaveBeenLastCalledWith({ vertices: '21', arestas: '0', matriz: '1 0' });

    await usuario.click(screen.getByRole('button', { name: 'Ciclo C5' }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ vertices: '5', arestas: '5' }));

    await usuario.click(screen.getByRole('button', { name: 'Executar programa' }));
    expect(onExecutar).toHaveBeenCalledTimes(1);
  });

  it('desenha a prévia do grafo e resume a matriz', () => {
    render(
      <InputPanel entrada={{ vertices: '3', arestas: '3', matriz: '1 1 0\n1 0 1\n0 1 1' }} onChange={jest.fn()} onExecutar={jest.fn()} />,
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Grafo com 3 vértice\(s\)/ })).toBeInTheDocument();
    expect(screen.getByText(/3 aresta\(s\), todas com duas pontas\. Grafo conexo\./)).toBeInTheDocument();
  });

  it('avisa quando a matriz tem problema, sem impedir a execução', () => {
    render(<InputPanel entrada={{ vertices: '3', arestas: '2', matriz: '1 1\n1 1\n0 1' }} onChange={jest.fn()} onExecutar={jest.fn()} />);
    expect(screen.getByText(/A coluna e1 tem 3 vértice\(s\) marcado\(s\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Executar programa' })).toBeEnabled();
  });
});

describe('ErrorBoundary', () => {
  function Quebra(): never {
    throw new Error('falhou');
  }

  it('isola o erro e permite tentar de novo', async () => {
    const usuario = userEvent.setup();
    // React registra o erro capturado no console: esperado neste teste.
    (console.error as jest.Mock).mockImplementation(() => undefined);
    render(
      <ErrorBoundary area="o grafo">
        <Quebra />
      </ErrorBoundary>,
    );
    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível exibir o grafo.');
    await usuario.click(within(alerta).getByRole('button', { name: 'tentar novamente' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
