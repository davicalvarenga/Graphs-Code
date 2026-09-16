interface CabecalhoProps {
  /** Texto do canto direito: estado da execução ou subtítulo. */
  situacao: string;
}

/** Régua de 2px no topo, com a marca à esquerda e a situação à direita. */
export function Cabecalho({ situacao }: CabecalhoProps) {
  return (
    <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-tinta px-5 pb-4 pt-5 md:px-14">
      <p className="font-titulo text-sm font-extrabold tracking-wide">GRAFOS EM C</p>
      <p className="font-mono text-[13px] text-neutral-700">{situacao}</p>
    </header>
  );
}
