import type { Metadata, Viewport } from 'next';
import { Archivo } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

// Archivo é a família do design system Modernist; o next/font baixa e serve a
// fonte junto com o site, sem requisição a terceiros no navegador.
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  variable: '--fonte-archivo',
});

export const metadata: Metadata = {
  title: 'Grafos em C — execução passo a passo',
  description:
    'Visualizador educativo que executa, linha a linha, um programa C de grafos: validação, matrizes de incidência e adjacência, lista de adjacência, classificação e cliques.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
