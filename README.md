# Grafos em C, passo a passo

Aplicação web educativa que executa, **linha a linha**, um programa C de grafos e sincroniza cada linha com:

- o **grafo animado** (vértices e arestas destacados conforme são processados);
- as **estruturas de dados** (matriz de incidência, matriz de adjacência, lista de adjacência, graus, vetores `visitado[]`/`cor[]`, saída do `printf`);
- a **pilha de chamadas** com as variáveis locais de cada função.

O fluxo segue exatamente o `main()` original: entrada e validação → transformações → classificação (completo, ciclo, roda, euleriano, bipartido) → cliques (triângulos e `{u} ∪ N(u)`) → liberação da memória.

A saída do app é verificada contra o **binário C real** (compilado com gcc) em 72 casos — ver [Fidelidade ao C](docs/ARQUITETURA.md#fidelidade-ao-programa-c).

A interface segue o design system **Modernist**: fundo claro, tipografia Archivo, um único acento vermelho, cantos retos e uma régua de 2px no topo — sem cartões nem molduras em volta dos painéis.

## Uso

1. Na tela de entrada, clique em um exemplo (eles aparecem sublinhados na frase) ou preencha vértices, arestas e a matriz de incidência. O desenho à direita é uma **prévia ao vivo** da matriz digitada.
2. Clique em **Executar programa**.
3. Acompanhe a execução: a frase grande no topo diz o que a linha atual está fazendo, o grafo mostra onde, e a coluna da direita traz o código, as variáveis e a estrutura em foco.

| Ação | Botão | Teclado |
| --- | --- | --- |
| Play / pausa | Play | Espaço |
| Passo seguinte / anterior | → / ← | → / ← |
| Início / fim | início / arrastar a régua | Home / End |
| Pular para um módulo | nome do módulo sob a régua | — |

- **Velocidade**: de 0,5× a máxima.
- **Detalhe**: *toda linha* (cada linha executada), *iterações* (laços externos e mutações) ou *chamadas* (entradas, retornos e resultados).
- **ver a função inteira**: troca a janela de cinco linhas pelo arquivo completo, numerado e com rolagem automática.
- **seguir execução**: troca sozinho a estrutura exibida (incidência, adjacência, lista, graus, resultados, saída) conforme a função em execução.
- Quando o programa para com erro ou termina, a frase dá lugar a uma tela com o que aconteceu e duas ações: rever do início ou voltar à entrada.

Os avisos em vermelho no formulário são dicas do app, **não** fazem parte do programa C: a execução continua permitida para que o estudante veja como o C trata o erro.

## Requisitos

- Node.js ≥ 20.9 (CI usa Node 24)
- gcc — **opcional**, só para regenerar os casos golden

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento em `http://localhost:3000` |
| `npm run build` | Build de produção como site estático em `out/` |
| `npm start` | Serve `out/` localmente |
| `npm test` / `npm run test:coverage` | Jest + React Testing Library (limite mínimo de 80% de cobertura) |
| `npm run lint` / `npm run typecheck` | ESLint e TypeScript estrito |
| `npm run check` | Tudo acima, na ordem usada pelo CI |
| `npm run gen:source` | Regenera `grafos.generated.ts` a partir de `src/c-source/grafos.c` |
| `npm run golden` | Compila `grafos.c` com gcc e regrava `tests/golden/casos.json` |

## Deploy

`next.config.ts` usa `output: 'export'`: o build gera HTML/JS/CSS estáticos em `out/`, sem servidor. Publique a pasta em qualquer hospedagem estática (Vercel, Netlify, GitHub Pages, Nginx). Nenhum dado sai do navegador.

## Estrutura

```
src/
  app/          layout, página e fronteira de erro do Next.js
  c-source/     grafos.c (fonte única), código gerado e resolução de linhas
  engine/       reimplementação instrumentada do programa C (sem React)
  hooks/        player e animação de posições
  components/   GraphLab, Workspace, GraphView, CodePanel, DataPanel, PlayerControls, InputPanel, Cabecalho, Nota
tests/golden/   saídas do programa C real usadas nos testes de fidelidade
scripts/        geração do código-fonte embutido e dos casos golden
docs/           arquitetura e decisões
```

Detalhes de arquitetura, fluxo de dados e decisões: [docs/ARQUITETURA.md](docs/ARQUITETURA.md).
