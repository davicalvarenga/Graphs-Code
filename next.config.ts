import type { NextConfig } from 'next';

// Os módulos do D3 são publicados apenas como ESM; listá-los aqui também faz o
// next/jest transpilá-los nos testes.
const D3 = ['d3-color', 'd3-dispatch', 'd3-drag', 'd3-ease', 'd3-interpolate', 'd3-selection', 'd3-timer', 'd3-transition', 'd3-zoom'];

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: { unoptimized: true },
  transpilePackages: D3,
};

export default nextConfig;
