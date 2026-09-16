// Gera src/c-source/grafos.generated.ts a partir de grafos.c (fonte única do código exibido).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pasta = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'c-source');
const fonte = readFileSync(join(pasta, 'grafos.c'), 'utf8').replace(/\r\n/g, '\n');

writeFileSync(
  join(pasta, 'grafos.generated.ts'),
  `// ARQUIVO GERADO por scripts/gen-source.mjs — não edite; altere grafos.c e rode \`npm run gen:source\`.\n` +
    `export const C_SOURCE = ${JSON.stringify(fonte)};\n`,
);
console.log('src/c-source/grafos.generated.ts atualizado');
