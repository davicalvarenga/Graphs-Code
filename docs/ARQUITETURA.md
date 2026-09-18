# Arquitetura

## Visão geral

O app não interpreta C. Cada função de `grafos-geral.c` foi **reimplementada em TypeScript com o mesmo nome e a mesma lógica**, instrumentada com chamadas a um `Recorder`. Executar o programa produz um **trace**: um vetor imutável de passos, cada um com a linha do C, a pilha de chamadas, o estado do grafo e o que destacar. A interface é apenas um *player* que percorre esse vetor.

```mermaid
flowchart LR
  subgraph UI["Camada de interface (React)"]
    IP[InputPanel] -->|EntradaPrograma| GL[GraphLab]
    GL -->|Trace| WS[Workspace]
    WS --> PC[PlayerControls]
    WS --> GV[GraphView]
    WS --> DP[DataPanel]
    WS --> CP[CodePanel]
  end
  subgraph Engine["Engine (TypeScript puro, sem React)"]
    BT[buildTrace] --> SC[Stdin / scanf]
    BT --> M[main: entrada → transformações → classificação → cliques → conectividade → liberarGrafo]
    M --> R[Recorder]
    R -->|Step[]| BT
  end
  subgraph Fonte["Código-fonte"]
    C[grafos-geral.c] -->|gen:source| G[grafos-geral.generated.ts]
    G --> L[lineOf: âncoras de linha]
  end
  GL -->|buildTrace| BT
  L --> M
  G --> CP
```

### Por que trace pré-computado?

| Alternativa | Vantagem | Desvantagem |
| --- | --- | --- |
| **Trace pré-computado** (escolhida) | Voltar passo, barra de progresso e troca de detalhe são triviais; determinístico; o engine é testável sem UI | Memória proporcional ao número de passos (mitigado por teto e níveis) |
| Geradores (`yield`) executados sob demanda | Memória constante | Voltar exige reexecutar do início; estado de recursão (DFS, `colorir`) difícil de reconstituir |
| Interpretar C no navegador (ex.: compilador para WASM) | Fidelidade automática | Sem acesso semântico ao que cada linha significa: não há como destacar "a aresta u–w entrou na adjacência" |

## Camadas

### `src/c-source`

- `grafos-geral.c` — **fonte única** do programa. É o arquivo compilado pelo gcc nos testes golden e o texto exibido no painel.
- `grafos-geral.generated.ts` — `C_SOURCE` gerado por `npm run gen:source`. Um teste e o CI falham se ele divergir do `.c`.
- `source.ts` — `lineOf(função, trecho, ocorrência)` resolve o número da linha **pelo conteúdo**, a partir da assinatura da função. Não há números de linha fixos no engine; se o `.c` for reformatado, as âncoras continuam válidas, e se um trecho sumir o erro aparece no carregamento do módulo (e nos testes), nunca em silêncio.

### `src/engine`

| Arquivo | Funções C correspondentes |
| --- | --- |
| `entrada.ts` | `criarGrafo`, `validarColunas`, `validarParalelas`, `moduloEntrada` |
| `transformacoes.ts` | `incidenciaParaAdjacencia`, `adjacenciaParaLista`, `imprimirMatriz`, `moduloTransformacoes` |
| `classificacao.ts` | `dfs`, `contarAlcancados`, `ehCompleto`, `ehCiclo`, `ehRoda`, `verificarEuleriano`, `colorir`, `verificarBipartido`, `moduloClassificacao` |
| `cliques.ts` | `imprimirClique`, `detectarTriangulos`, `detectarCliquesVizinhanca`, `moduloCliques` |
| `conectividade.ts` | `moduloConectividade` (potências da adjacência, teto `LIMITE`, veredito de conexidade) |
| `programa.ts` | `main`, `liberarGrafo`; `executar()` e `buildTrace()` |
| `scanf.ts` | Semântica de `scanf("%d")` sobre o texto de entrada |
| `recorder.ts` | Gravação de passos, pilha, stdout e estado imutável |
| `grafoVisual.ts` | Derivações puras para desenho: posições e arestas visíveis |
| `avisos.ts` | Dicas do formulário (explicitamente **fora** do programa C) |
| `previa.ts` | Desenho e resumo da matriz antes de executar (tela de entrada) |
| `resumo.ts` | Frase final: o que o programa concluiu sobre o grafo |
| `exemplos.ts` | Exemplos do formulário, também usados pelo gerador golden (sem imports, carregável direto pelo Node) |
| `types.ts` | Contratos: `Step`, `EstadoGrafo`, `Destaque`, `Trace` |

#### Modelo de dados

```ts
Step = {
  linha, modulo, nivel,   // onde estamos e com que granularidade
  pilha: Frame[],         // funções ativas e variáveis locais
  estado: EstadoGrafo,    // espelho imutável de struct Grafo + visitado[]/cor[] + matrizes da conectividade
  destaque: Destaque,     // vértices, arestas, células e nó da lista em foco
  stdoutFim,              // índice no stdout completo (não copia texto)
  nota,                   // explicação em português
}
```

- **Imutabilidade com compartilhamento estrutural**: `Recorder.mutar` substitui só o trecho alterado (`comCelula` copia uma linha da matriz; as demais são compartilhadas). Cada passo guarda referências, então passos antigos nunca mudam e o custo de memória por passo é pequeno.
- **Níveis de detalhe**: 1 = chamadas/retornos/resultados, 2 = iterações externas e mutações, 3 = toda linha. O `Recorder` descarta passos acima do nível pedido; o estado continua sendo atualizado, então o próximo passo gravado já reflete as mutações.
- **Teto de passos** (`MAX_PASSOS = 75.000`): `buildTrace` tenta nível 3; se estourar, regrava em 2 e depois em 1. Ex.: K20 gera ~384 mil passos no nível 3 e ~28 mil no nível 2. O módulo de conectividade domina a conta — multiplica matrizes n×n até n−2 vezes, O(n⁴) linhas —, então grafos de até 14–15 vértices rodam com toda linha e os maiores caem para o nível de iterações. A UI avisa quando o detalhe foi reduzido.
- **Resultados**: `estado.resultados` guarda o que o programa já imprimiu (classificações, centro da roda, partições, triângulos, cliques). Não é estado do C — existe para a visualização destacar características já concluídas.

### `src/hooks`

- `usePlayer` — `useReducer` com índice e flag de reprodução; um `setTimeout` por passo. O reducer é exportado e testado isoladamente.
- `usePosicoesAnimadas` — interpola posições com `requestAnimationFrame` quando o layout muda (centro da roda indo para o meio, bipartição em colunas). Vértices e arestas usam os mesmos pontos, então se movem juntos. Respeita `prefers-reduced-motion`.

### `src/components`

| Componente | Responsabilidade |
| --- | --- |
| `GraphLab` | Estado da entrada, chama `buildTrace`, mostra erros do simulador, monta `Workspace` com `key` por execução (reinicia o player) |
| `Workspace` | Player, filtro de detalhe, atalhos de teclado, telas de erro/fim e o layout de uma coluna com a lateral de 330px (empilhada no celular) |
| `PlayerControls` | Play/pausa, passo a passo, régua de progresso com atalhos por módulo, velocidade e detalhe |
| `GraphView` | SVG renderizado pelo React; D3 (`d3-zoom`) só controla pan/zoom |
| `CodePanel` | Janela de cinco linhas em volta da atual (`aria-current="step"`) ou arquivo inteiro numerado com rolagem automática; caminho da pilha e variáveis locais em uma linha |
| `DataPanel` | Uma estrutura por vez, escolhida numa linha de nomes (`role="tablist"`); "seguir execução" escolhe pela função no topo da pilha |
| `Cabecalho` | Régua de 2px do topo: marca à esquerda, situação da execução à direita |
| `InputPanel` | Tela de entrada: campos sem caixa, exemplos como texto, prévia ao vivo do grafo e dicas |
| `Nota` | A frase do passo, com trechos de código em monoespaçada |
| `ErrorBoundary` | Isola falhas de renderização por painel |

**D3 só no zoom**: React é dono do DOM do SVG. Deixar o D3 manipular os mesmos elementos (`selection.join`, transições) criaria duas fontes de verdade. O zoom apenas produz uma `transform` guardada em estado. Isso também mantém o SVG inspecionável no jsdom.

## Design

O visual vem do design system Modernist (projeto do Claude Design, turno 3 "Sereno"): fundo #f3f2f2, tinta #201e1d, acento #ec3013, Archivo, raio zero e réguas de 2px. Os tokens do sistema estão em `src/app/globals.css` (bloco `@theme` do Tailwind), junto com as classes `.btn-*`, `.campo-linha` e `.regua-progresso`.

Duas decisões fogem do sistema original, de propósito:

- **Cores semânticas**: o Modernist é monocromático, mas a execução precisa separar "em execução" (acento), "comparado" (neutro), "aceito" (verde escuro) e "rejeitado" (vermelho escuro). São quatro tokens à parte, usados só na visualização.
- **Tema único**: o sistema define apenas o tema claro, então o app não tem mais modo escuro.

A fonte é carregada por `next/font` (Archivo servida junto com o site, sem requisição a terceiros).

## Fluxo de dados de uma execução

1. `InputPanel` edita `EntradaPrograma` (três strings).
2. "Executar" → `buildTrace(entrada)` concatena os campos em um stdin (`paraStdin`) e roda `executar(stdin, nivel, limite)`.
3. `main()` instrumentado chama os módulos na ordem do C. Cada função:
   - `rec.entrar(nome, locais)` / `rec.sair()` mantêm a pilha;
   - `rec.local({...})` / `rec.descartar(...)` atualizam variáveis;
   - `rec.mutar(estado => novoEstado)` aplica efeitos colaterais;
   - `rec.printf(texto)` acumula a saída;
   - `rec.passo(nivel, linha, nota, destaque)` grava um `Step`.
4. `Workspace` filtra os índices pelo nível escolhido e `usePlayer` percorre essa lista.
5. O passo atual alimenta `GraphView` (estado + destaque), `DataPanel` (estado + destaque + `stdout.slice(0, stdoutFim)`) e `CodePanel` (linha + pilha + nota).

## Fidelidade ao programa C

### Verificação automática

`npm run golden` compila `grafos-geral.c` com `gcc -std=c99 -Wall` e executa 72 entradas: todos os exemplos, casos-limite de `scanf` (`"3abc"`, EOF, sinais, tokens extras), todos os erros de validação, Petersen, K20 e 40 grafos aleatórios com semente fixa. O resultado fica em `tests/golden/casos.json` (commitado; o CI não precisa de gcc). O teste `golden.test.ts` exige **stdout idêntico byte a byte** e o mesmo código de saída, com e sem gravação de passos.

### Comportamentos do C preservados

- Validação na mesma ordem e com as mesmas mensagens: faixa de `v`, faixa de `e`, valores 0/1, colunas com exatamente dois 1s, colunas paralelas (curto-circuito de `||`).
- Erros de entrada **executam o caminho de erro** (inclusive `liberarGrafo` e `return EXIT_FAILURE`) em vez de serem bloqueados no formulário.
- `scanf("%d")`: espaços e quebras de linha são equivalentes, `"3abc"` lê 3 e falha no token seguinte, tokens extras são ignorados, fim da entrada é erro.
- Lista de adjacência em ordem crescente (inserção na cabeça percorrendo `w` de `v-1` a 0).
- `ehRoda` escolhe o **último** vértice com grau `v-1` como centro (em K4, o centro é 3).
- `verificarEuleriano` não chama a DFS quando `e == 0` (curto-circuito evita `contarAlcancados(g, -1, -1)`).
- `detectarCliquesVizinhanca` ignora vértices isolados e conjuntos repetidos.

### Diferenças conhecidas (e por quê)

| Situação | C | App |
| --- | --- | --- |
| Inteiro fora da faixa de `int` na entrada | Comportamento indefinido | Valor grande, rejeitado pela validação de faixa |
| Posições alocadas por `malloc` e não lidas | Lixo de memória | Exibidas como `?` |
| Variáveis fora de escopo | Deixam de existir | Removidas da pilha nos pontos mais visíveis (`rec.descartar`); algumas permanecem até o fim da função para contexto |

## Tratamento de erros

| Camada | Mecanismo |
| --- | --- |
| Programa C | Erros de entrada são passos normais do trace; `resultados.erro` alimenta o banner, `exitCode = 1` |
| Engine | `InvarianteError` para estados que o C garante impossíveis (ex.: aresta sem extremidades após validação); `LimiteDePassosError` controla o teto |
| `buildTrace` | Nunca lança: devolve `{ ok: false, erro }` para entrada grande demais, falha interna ou limite inatingível |
| UI | `ErrorBoundary` por painel; `app/error.tsx` como fronteira global; `maxLength` nos campos |
| Testes | `jest.setup.ts` transforma qualquer `console.error`/`console.warn` em falha |

## Testes

| Suíte | Cobre |
| --- | --- |
| `engine/__tests__/golden.test.ts` | Saída idêntica ao binário C em 72 casos |
| `engine/__tests__/engine.test.ts` | `lineOf`, `scanf`, `Recorder` (níveis, teto, copy-on-write), `buildTrace` (ordem dos módulos, resultados, erros, fallback), invariantes em 60 grafos aleatórios, layout e arestas visíveis, dicas |
| `hooks/__tests__/hooks.test.tsx` | Reducer e timers do player, animação de posições |
| `components/__tests__/paineis.test.tsx` | Cada painel isolado, janela e arquivo inteiro do código, rolagem automática, acessibilidade da lista de estruturas, destaques, prévia da entrada |
| `components/__tests__/GraphLab.test.tsx` | Fluxo completo: exemplo → execução → navegação por teclado → tela final; erro do C; volta para a entrada; erro do simulador |

Cobertura mínima de 80% (statements, branches, functions, lines) configurada em `jest.config.mjs`.

## Como alterar o programa C

1. Edite `src/c-source/grafos-geral.c`.
2. `npm run gen:source` para atualizar o código exibido.
3. Ajuste a função correspondente no engine; se um trecho usado por `lineOf` mudou, o teste aponta qual.
4. `npm run golden` (requer gcc) para regravar as saídas esperadas.
5. `npm run check`.
