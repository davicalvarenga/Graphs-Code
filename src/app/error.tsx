'use client';

interface ErroGlobalProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErroGlobal({ error, reset }: ErroGlobalProps) {
  return (
    <main className="flex min-h-dvh flex-col justify-center px-5 md:px-14">
      <p className="font-mono text-[13px] text-neutral-700">erro inesperado{error.digest ? ` · código ${error.digest}` : ''}</p>
      <h1 className="mt-3 max-w-[22ch] text-[34px]">A página parou de responder.</h1>
      <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-neutral-900">
        Nada foi enviado para fora do navegador: toda a execução acontece nesta máquina.
      </p>
      <div className="mt-7">
        <button type="button" onClick={reset} className="btn btn-primario">
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
