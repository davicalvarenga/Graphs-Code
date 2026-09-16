export type Leitura = { readonly ok: true; readonly valor: number } | { readonly ok: false; readonly motivo: 'eof' | 'invalido' };

const ESPACO = /[ \t\n\v\f\r]/;
const DIGITO = /[0-9]/;

/**
 * Leitor de stdin com a semântica de `scanf("%d", ...)`:
 * ignora espaços em branco (inclusive quebras de linha), aceita sinal opcional
 * e consome o maior prefixo de dígitos. "3abc" lê 3 e deixa "abc" no buffer.
 * Sem dígitos ⇒ falha de casamento (scanf retorna 0); fim da entrada ⇒ EOF (-1).
 * Em ambos os casos o retorno difere de 1, que é o que o programa testa.
 */
export class Stdin {
  private posicao = 0;

  constructor(private readonly texto: string) {}

  lerInt(): Leitura {
    while (this.posicao < this.texto.length && ESPACO.test(this.texto[this.posicao] ?? '')) {
      this.posicao++;
    }
    if (this.posicao >= this.texto.length) {
      return { ok: false, motivo: 'eof' };
    }

    let cursor = this.posicao;
    const sinal = this.texto[cursor];
    if (sinal === '+' || sinal === '-') {
      cursor++;
    }
    const inicioDigitos = cursor;
    while (cursor < this.texto.length && DIGITO.test(this.texto[cursor] ?? '')) {
      cursor++;
    }
    if (cursor === inicioDigitos) {
      return { ok: false, motivo: 'invalido' };
    }

    const valor = Number(this.texto.slice(this.posicao, cursor));
    this.posicao = cursor;
    // ponytail: estouro de int é comportamento indefinido em C; aqui o número fica fora de
    // qualquer faixa válida e cai no mesmo erro de validação.
    return { ok: true, valor: valor === 0 ? 0 : valor };
  }
}
