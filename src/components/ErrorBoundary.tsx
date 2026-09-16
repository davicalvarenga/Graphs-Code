'use client';

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  /** Nome da área, usado na mensagem de erro. */
  area: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  erro: Error | null;
}

/** Isola falhas de renderização: um painel quebrado não derruba os demais. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { erro: null };

  static getDerivedStateFromError(erro: Error): ErrorBoundaryState {
    return { erro };
  }

  private tentarNovamente = () => this.setState({ erro: null });

  render() {
    if (this.state.erro) {
      return (
        <div role="alert" className="flex flex-col items-start gap-2 border-l-[3px] border-falha py-2 pl-3 text-sm">
          <p className="font-semibold text-falha">Não foi possível exibir {this.props.area}.</p>
          <p className="text-neutral-700">{this.state.erro.message}</p>
          <button type="button" onClick={this.tentarNovamente} className="btn btn-texto">
            tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
