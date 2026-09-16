import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErroGlobal from '@/app/error';
import Home from '@/app/page';
import { EXEMPLOS } from '@/engine/exemplos';
import { traceDoExemplo } from '@/test-utils/traces';
import { Workspace } from '../Workspace';

async function executarExemplo(nome: string) {
  const usuario = userEvent.setup();
  render(<Home />);
  await usuario.click(screen.getByRole('button', { name: nome }));
  await usuario.click(screen.getByRole('button', { name: 'Executar programa' }));
  return usuario;
}

describe('GraphLab (fluxo completo)', () => {
  it('executa um exemplo e navega até o resultado final', async () => {
    await executarExemplo('Completo K4');

    expect(screen.getByRole('region', { name: 'Código C' })).toBeInTheDocument();
    expect(screen.getByText(/passo 1 de \d+ · entrada/)).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: 'End' });
    expect(screen.getByRole('status')).toHaveTextContent('O programa terminou.');
    expect(screen.getByRole('status')).toHaveTextContent('É completo, roda de centro 3.');

    fireEvent.keyDown(document.body, { key: 'Home' });
    expect(screen.getByText(/passo 1 de \d+ · entrada/)).toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
    fireEvent.keyDown(document.body, { key: 'ArrowRight', ctrlKey: true });
    fireEvent.keyDown(document.body, { key: 'x' });
    expect(screen.getByRole('slider')).toHaveValue('0');
  });

  it('revê do início e volta para a entrada a partir da tela final', async () => {
    const usuario = await executarExemplo('Sem arestas');
    fireEvent.keyDown(document.body, { key: 'End' });

    await usuario.click(screen.getByRole('button', { name: 'Rever do início' }));
    expect(screen.getByRole('slider')).toHaveValue('0');

    fireEvent.keyDown(document.body, { key: 'End' });
    await usuario.click(screen.getByRole('button', { name: 'nova entrada' }));
    expect(screen.getByRole('heading', { name: /Um grafo, e o programa em C que o lê\./ })).toBeInTheDocument();
  });

  it('mostra o erro detectado pelo programa C e permite voltar à entrada', async () => {
    const usuario = await executarExemplo('Erro: coluna com 3');
    fireEvent.keyDown(document.body, { key: 'End' });

    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('Erro: a aresta e1 tem 3 vértice(s), deveria ter 2');
    expect(alerta).toHaveTextContent('o programa parou no passo');

    await usuario.click(screen.getByRole('button', { name: 'voltar à entrada' }));
    expect(screen.getByRole('button', { name: 'Executar programa' })).toBeInTheDocument();
  });

  it('exibe falhas do simulador sem quebrar a página', async () => {
    const usuario = userEvent.setup();
    render(<Home />);
    fireEvent.change(screen.getByRole('textbox', { name: /matriz de incidência/ }), { target: { value: '0 '.repeat(10_000) } });
    await usuario.click(screen.getByRole('button', { name: 'Executar programa' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Entrada muito grande');
  });
});

describe('Workspace', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('toca, pausa, troca o detalhe e pula de módulo', () => {
    const trace = traceDoExemplo('ciclo-c5');
    render(<Workspace trace={trace} onNovaEntrada={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Executar' }));
    // Cada passo agenda o próximo timer num efeito: avança um intervalo por vez.
    for (let i = 0; i < 3; i++) {
      act(() => jest.advanceTimersByTime(600));
    }
    expect(screen.getByRole('slider')).toHaveValue('3');
    fireEvent.keyDown(document.body, { key: ' ' });
    expect(screen.getByRole('button', { name: 'Executar' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'detalhe' }), { target: { value: '1' } });
    const totalChamadas = trace.passos.filter((p) => p.nivel === 1).length;
    expect(screen.getByText(new RegExp(`passo \\d+ de ${totalChamadas}`))).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'cliques' }));
    expect(screen.getByText(/· cliques/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'velocidade' }), { target: { value: '80' } });
  });

  it('avisa quando o detalhe foi reduzido', () => {
    render(<Workspace trace={{ ...traceDoExemplo('caminho-p4'), nivelGravado: 2 }} onNovaEntrada={jest.fn()} />);
    expect(screen.getByText(/detalhe foi reduzido/)).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'toda linha' })).not.toBeInTheDocument();
  });

  it('não renderiza nada para um trace vazio', () => {
    const { container } = render(<Workspace trace={{ passos: [], stdout: '', exitCode: 0, nivelGravado: 3 }} onNovaEntrada={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('página de erro global', () => {
  it('permite tentar novamente', () => {
    const reset = jest.fn();
    render(<ErroGlobal error={Object.assign(new Error('x'), { digest: 'abc' })} reset={reset} />);
    expect(screen.getByText(/código abc/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(reset).toHaveBeenCalled();
  });

  it('funciona sem digest', () => {
    render(<ErroGlobal error={new Error('x')} reset={jest.fn()} />);
    expect(screen.queryByText(/código/)).not.toBeInTheDocument();
  });
});

it('todos os exemplos têm nome e descrição', () => {
  for (const exemplo of EXEMPLOS) {
    expect(exemplo.nome).not.toHaveLength(0);
    expect(exemplo.descricao).not.toHaveLength(0);
  }
});
