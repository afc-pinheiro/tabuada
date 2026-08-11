/**
 * A linha de contagem do agrupamento. A regra que importa: pedir ajuda mostra os
 * grupos para contar, nao a resposta — so depois de errar e que a conta fecha.
 */
import { countLine } from '../src/components/Groups'

let fails = 0

function check(condition: boolean, message: string): void {
  if (!condition) {
    fails++
    console.error('FALHOU:', message)
  }
}

for (let a = 1; a <= 10; a++) {
  for (let b = 1; b <= 10; b++) {
    const resposta = String(a * b)

    // Ajuda pedida: em nenhum momento da contagem o resultado pode aparecer.
    for (let shown = 0; shown <= a; shown++) {
      const linha = countLine(a, b, shown, false)
      const parciais = linha.replace(/\?/g, '').match(/\d+/g) ?? []
      check(
        !parciais.includes(resposta),
        `${a}x${b} passo ${shown}: ajuda entregou a resposta ("${linha}")`,
      )
    }

    // Depois de errar, a conta fecha com o resultado.
    check(
      countLine(a, b, a, true) === `${a} × ${b} = ${resposta}`,
      `${a}x${b}: explicacao deveria fechar a conta, veio "${countLine(a, b, a, true)}"`,
    )

    // As parciais sao a contagem de b em b.
    if (a > 1) {
      check(countLine(a, b, 1, false) === `${b}...`, `${a}x${b}: primeira parcial errada`)
    }
  }
}

if (fails > 0) {
  console.error(`\n${fails} verificacao(oes) falharam`)
  process.exit(1)
}
console.log('ok: ajuda mostra os grupos sem entregar a resposta')
