#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

struct No {
    int vertice;
    struct No *prox;
};

struct Grafo {
    int v;
    int e;
    int **incidencia;
    int **adjacencia;
    struct No **listaAdjacencia;
    int *grau;
};

void criarGrafo (struct Grafo *g, int v, int e) {
    g->v = v;
    g->e = e;
    g->incidencia = (int **)malloc(v * sizeof(int *));
    g->adjacencia = (int **)malloc(v * sizeof(int *));
    g->listaAdjacencia = (struct No **)malloc(v * sizeof(struct No *));
    g->grau = (int *)malloc(v * sizeof(int));

    for (int i = 0; i < v; i++) {
        g->incidencia[i] = (int *)malloc(e * sizeof(int));
        g->adjacencia[i] = (int *)calloc(v, sizeof(int));
        g->listaAdjacencia[i] = NULL;
    }
}

void liberarGrafo (struct Grafo *g) {
    for (int i = 0; i < g->v; i++) {
        free(g->incidencia[i]);
        free(g->adjacencia[i]);

        struct No *atual = g->listaAdjacencia[i];
        while (atual != NULL) {
            struct No *aux = atual;
            atual = atual->prox;
            free(aux);
        }
    }
    free(g->incidencia);
    free(g->adjacencia);
    free(g->listaAdjacencia);
    free(g->grau);
}

void imprimirMatriz (int linhas, int colunas, int **matriz, char rotulo) {
    printf("    ");
    for (int j = 0; j < colunas; j++) {
        printf("%c%-3d", rotulo, j);
    }
    printf("\n");

    for (int i = 0; i < linhas; i++) {
        printf("v%-3d", i);
        for (int j = 0; j < colunas; j++) {
            printf("%-4d", matriz[i][j]);
        }
        printf("\n");
    }
}

// ===================== Entrada e Validação =====================

bool validarColunas (struct Grafo *g) {
    for (int aresta = 0; aresta < g->e; aresta++) {
        int cont = 0;
        for (int vertice = 0; vertice < g->v; vertice++) {
            cont += g->incidencia[vertice][aresta];
        }
        if(cont != 2) {
            printf("Erro: a aresta e%d tem %d vértice(s), deveria ter 2\n", aresta, cont);
            return false;
        }
    }
    return true;
}

bool validarParalelas (struct Grafo *g) {
    for (int a = 0; a < g->e; a++) {
        for (int b = a + 1; b < g->e; b++) {
            int i = 0;
            while (i < g->v && g->incidencia[i][a] == g->incidencia[i][b]) {
                i++;
            }
            if(i == g->v) {
                printf("Erro: as arestas e%d e e%d são paralelas\n", a, b);
                return false;
            }
        }
    }
    return true;
}

bool moduloEntrada (struct Grafo *g) {
    int v, e;

    printf("===== ENTRADA E VALIDAÇÃO =====\n");
    printf("Digite o número de vértices: ");
    if(scanf("%d", &v) != 1 || v < 1 || v > 20) {
        printf("Erro: o número de vértices deve estar entre 1 e 20\n");
        return false;
    }

    printf("Digite o número de arestas: ");
    if(scanf("%d", &e) != 1 || e < 0 || e > v * (v - 1) / 2) {
        printf("Erro: o número de arestas deve estar entre 0 e %d\n", v * (v - 1) / 2);
        return false;
    }

    criarGrafo(g, v, e);

    if(e > 0) {
        printf("Digite a matriz de incidência (%dx%d), uma linha por vértice:\n", v, e);
    }
    for (int i = 0; i < v && e > 0; i++) {
        printf("Vértice %d: ", i);
        for (int j = 0; j < e; j++) {
            if(scanf("%d", &g->incidencia[i][j]) != 1 || (g->incidencia[i][j] != 0 && g->incidencia[i][j] != 1)) {
                printf("\nErro: a matriz só pode ter valores 0 ou 1\n");
                return false;
            }
        }
    }

    if(!validarColunas(g) || !validarParalelas(g)) {
        return false;
    }

    printf("\nMatriz válida! Grafo com %d vértice(s) e %d aresta(s).\n", v, e);
    return true;
}

// ===================== Transformações =====================

void incidenciaParaAdjacencia (struct Grafo *g) {
    for (int aresta = 0; aresta < g->e; aresta++) {
        int u = -1;
        int w = -1;

        for (int vertice = 0; vertice < g->v; vertice++) {
            if(g->incidencia[vertice][aresta] == 1) {
                if(u == -1) {
                    u = vertice;
                }
                else {
                    w = vertice;
                }
            }
        }
        g->adjacencia[u][w] = 1;
        g->adjacencia[w][u] = 1;
    }
}

void adjacenciaParaLista (struct Grafo *g) {
    for (int u = 0; u < g->v; u++) {
        for (int w = g->v - 1; w >= 0; w--) {
            if(g->adjacencia[u][w] == 1) {
                struct No *novo = (struct No *)malloc(sizeof(struct No));
                novo->vertice = w;
                novo->prox = g->listaAdjacencia[u];
                g->listaAdjacencia[u] = novo;
            }
        }
    }
}

void moduloTransformacoes (struct Grafo *g) {
    printf("\n===== TRANSFORMAÇÕES =====\n");

    incidenciaParaAdjacencia(g);
    printf("Matriz de adjacência:\n");
    imprimirMatriz(g->v, g->v, g->adjacencia, 'v');

    adjacenciaParaLista(g);
    printf("\nLista de adjacência:\n");
    for (int u = 0; u < g->v; u++) {
        printf("Vértice %d: ", u);
        for (struct No *p = g->listaAdjacencia[u]; p != NULL; p = p->prox) {
            printf("%d -> ", p->vertice);
        }
        printf("NULL\n");
    }
}

// ===================== Classificação =====================

int dfs (struct Grafo *g, int u, bool visitado[], int ignorar) {
    int cont = 1;
    visitado[u] = true;
    for (struct No *p = g->listaAdjacencia[u]; p != NULL; p = p->prox) {
        if(p->vertice != ignorar && !visitado[p->vertice]) {
            cont += dfs(g, p->vertice, visitado, ignorar);
        }
    }
    return cont;
}

int contarAlcancados (struct Grafo *g, int inicio, int ignorar) {
    bool visitado[g->v];
    for (int i = 0; i < g->v; i++) {
        visitado[i] = false;
    }
    return dfs(g, inicio, visitado, ignorar);
}

bool ehCompleto (struct Grafo *g) {
    for (int u = 0; u < g->v; u++) {
        if(g->grau[u] != g->v - 1) {
            return false;
        }
    }
    return true;
}

bool ehCiclo (struct Grafo *g) {
    if(g->v < 3) {
        return false;
    }
    for (int u = 0; u < g->v; u++) {
        if(g->grau[u] != 2) {
            return false;
        }
    }
    return contarAlcancados(g, 0, -1) == g->v;
}

bool ehRoda (struct Grafo *g) {
    int centro = -1;
    for (int u = 0; u < g->v; u++) {
        if(g->grau[u] == g->v - 1) {
            centro = u;
        }
    }
    if(g->v < 4 || centro == -1) {
        return false;
    }

    for (int u = 0; u < g->v; u++) {
        if(u != centro && g->grau[u] != 3) {
            return false;
        }
    }
    int borda = (centro == 0) ? 1 : 0;
    return contarAlcancados(g, borda, centro) == g->v - 1;
}

void verificarEuleriano (struct Grafo *g) {
    int impares = 0;
    int comArestas = 0;
    int inicio = -1;

    for (int u = 0; u < g->v; u++) {
        if(g->grau[u] % 2 != 0) {
            impares++;
        }
        if(g->grau[u] > 0) {
            comArestas++;
            inicio = u;
        }
    }

    if(g->e == 0 || contarAlcancados(g, inicio, -1) != comArestas) {
        printf("Euleriano: Não\n");
    }
    else if(impares == 0) {
        printf("Euleriano: Sim (possui ciclo euleriano)\n");
    }
    else if(impares == 2) {
        printf("Euleriano: Não, mas possui caminho euleriano\n");
    }
    else {
        printf("Euleriano: Não\n");
    }
}

bool colorir (struct Grafo *g, int u, int c, int cor[]) {
    cor[u] = c;
    for (struct No *p = g->listaAdjacencia[u]; p != NULL; p = p->prox) {
        int w = p->vertice;
        if(cor[w] == c || (cor[w] == -1 && !colorir(g, w, 1 - c, cor))) {
            return false;
        }
    }
    return true;
}

void verificarBipartido (struct Grafo *g) {
    int cor[g->v];
    for (int i = 0; i < g->v; i++) {
        cor[i] = -1;
    }

    for (int i = 0; i < g->v; i++) {
        if(cor[i] == -1 && !colorir(g, i, 0, cor)) {
            printf("Bipartido: Não\n");
            return;
        }
    }

    printf("Bipartido: Sim\n");
    for (int c = 0; c < 2; c++) {
        printf("  %c = { ", c == 0 ? 'X' : 'Y');
        for (int i = 0; i < g->v; i++) {
            if(cor[i] == c) {
                printf("%d ", i);
            }
        }
        printf("}\n");
    }
}

void moduloClassificacao (struct Grafo *g) {
    printf("\n===== CLASSIFICAÇÃO =====\n");
    printf("Vetor de graus:\n");
    for (int u = 0; u < g->v; u++) {
        g->grau[u] = 0;
        for (struct No *p = g->listaAdjacencia[u]; p != NULL; p = p->prox) {
            g->grau[u]++;
        }
        printf("Vértice %d: Grau %d\n", u, g->grau[u]);
    }

    printf("\nCompleto:  %s\n", ehCompleto(g) ? "Sim" : "Não");
    printf("Ciclo:     %s\n", ehCiclo(g) ? "Sim" : "Não");
    printf("Roda:      %s\n", ehRoda(g) ? "Sim" : "Não");
    verificarEuleriano(g);
    verificarBipartido(g);
}

// ===================== Cliques =====================

void imprimirClique (int v, bool membro[], int tamanho) {
    printf("  { ");
    for (int i = 0; i < v; i++) {
        if(membro[i]) {
            printf("%d ", i);
        }
    }
    printf("} tamanho %d\n", tamanho);
}

void detectarTriangulos (struct Grafo *g) {
    int total = 0;

    printf("Triângulos (K_3):\n");
    for (int i = 0; i < g->v; i++) {
        for (int j = i + 1; j < g->v; j++) {
            if(g->adjacencia[i][j] == 0) {
                continue;
            }
            for (int k = j + 1; k < g->v; k++) {
                if(g->adjacencia[j][k] == 1 && g->adjacencia[i][k] == 1) {
                    printf("  { %d %d %d }\n", i, j, k);
                    total++;
                }
            }
        }
    }
    printf("Total de triângulos: %d\n", total);
}

void detectarCliquesVizinhanca (struct Grafo *g) {
    bool encontrados[g->v][g->v];
    int total = 0;

    printf("\nCliques da forma {u} U N(u):\n");
    for (int u = 0; u < g->v; u++) {
        bool membro[g->v];
        for (int i = 0; i < g->v; i++) {
            membro[i] = (g->adjacencia[u][i] == 1);
        }
        membro[u] = true;

        bool ehClique = (g->grau[u] > 0);
        for (struct No *a = g->listaAdjacencia[u]; a != NULL; a = a->prox) {
            for (struct No *b = a->prox; b != NULL; b = b->prox) {
                if(g->adjacencia[a->vertice][b->vertice] == 0) {
                    ehClique = false;
                }
            }
        }

        bool repetido = false;
        for (int c = 0; c < total; c++) {
            int i = 0;
            while (i < g->v && encontrados[c][i] == membro[i]) {
                i++;
            }
            if(i == g->v) {
                repetido = true;
            }
        }

        if(ehClique && !repetido) {
            for (int i = 0; i < g->v; i++) {
                encontrados[total][i] = membro[i];
            }
            imprimirClique(g->v, membro, g->grau[u] + 1);
            total++;
        }
    }
    printf("Total de cliques: %d\n", total);
}

void moduloCliques (struct Grafo *g) {
    printf("\n===== CLIQUES =====\n");
    detectarTriangulos(g);
    detectarCliquesVizinhanca(g);
}

// ===================== Conectividade =====================

// Teto para as contagens de caminhos, evita overflow em grafos densos.
// Para saber se é conexo, só importa se o valor é zero ou positivo.
#define LIMITE 1000000

void moduloConectividade (struct Grafo *g) {
    int n = g->v;
    int potencia[n][n];  // A^r
    int proxima[n][n];   // A^(r+1)
    int soma[n][n];      // S = A + A^2 + ... + A^(n-1)

    printf("\n===== CONECTIVIDADE =====\n");

    // A^1 = A e S começa igual a A
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            potencia[i][j] = g->adjacencia[i][j];
            soma[i][j] = g->adjacencia[i][j];
        }
    }

    // A^r = A^(r-1) x A, para r = 2 até n-1
    for (int r = 2; r <= n - 1; r++) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                proxima[i][j] = 0;
                for (int k = 0; k < n; k++) {
                    proxima[i][j] += potencia[i][k] * g->adjacencia[k][j];
                }
            }
        }
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                potencia[i][j] = (proxima[i][j] > LIMITE) ? LIMITE : proxima[i][j];
                soma[i][j] += potencia[i][j];
            }
        }
    }

    printf("S = A + A^2 + ... + A^%d:\n", n - 1);
    printf("    ");
    for (int j = 0; j < n; j++) {
        printf("v%-3d", j);
    }
    printf("\n");
    for (int i = 0; i < n; i++) {
        printf("v%-3d", i);
        for (int j = 0; j < n; j++) {
            printf("%-4d", soma[i][j]);
        }
        printf("\n");
    }

    // Conexo se existe caminho entre todo par de vértices distintos
    bool conexo = true;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if(i != j && soma[i][j] == 0) {
                conexo = false;
            }
        }
    }
    printf("\nConexo: %s\n", conexo ? "Sim" : "Não");
}

int main () {
    struct Grafo g = {0};

    if(!moduloEntrada(&g)) {
        liberarGrafo(&g);
        return EXIT_FAILURE;
    }
    moduloTransformacoes(&g);
    moduloClassificacao(&g);
    moduloCliques(&g);
    moduloConectividade(&g);

    liberarGrafo(&g);
    return 0;
}
