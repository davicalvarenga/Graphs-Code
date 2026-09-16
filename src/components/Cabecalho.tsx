interface CabecalhoProps {
  /** Texto do canto direito: estado da execução ou subtítulo. */
  situacao: string;
  /** Se informado, mostra o atalho para voltar ao formulário de entrada. */
  onAlterarEntrada?: () => void;
}

/** Régua de 2px no topo, com a marca à esquerda e a situação à direita. */
export function Cabecalho({ situacao, onAlterarEntrada }: CabecalhoProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b-2 border-tinta px-5 pb-4 pt-5 md:px-14 baixa:pb-2 baixa:pt-2">
      <p className="font-titulo text-sm font-extrabold tracking-wide">GRAFOS EM C</p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <p className="font-mono text-[13px] text-neutral-700">{situacao}</p>
        {onAlterarEntrada ? (
          <button type="button" className="btn btn-secundario" onClick={onAlterarEntrada}>
            alterar grafo
          </button>
        ) : null}
      </div>
    </header>
  );
}
