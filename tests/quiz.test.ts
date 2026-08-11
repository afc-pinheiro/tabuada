/**
 * Guarda-chuva contra o bug que congelou o jogo: um fator invalido (NaN vindo da
 * chave 'mix' do progresso) fazia a geracao de alternativas entrar em loop
 * infinito e travar a aba inteira. Rodar com `npm test`.
 */
import { makeQuestion, mixedRound, roundForTable, QUESTIONS_PER_ROUND } from '../src/game/quiz'

let fails = 0

function check(condition: boolean, message: string): void {
  if (!condition) {
    fails++
    console.error('FALHOU:', message)
  }
}

for (let a = 1; a <= 12; a++) {
  for (let b = 1; b <= 12; b++) {
    const q = makeQuestion(a, b)
    check(q.answer === a * b, `${a}x${b}: resposta errada (${q.answer})`)
    check(q.options.length === 4, `${a}x${b}: ${q.options.length} alternativas`)
    check(new Set(q.options).size === 4, `${a}x${b}: alternativas repetidas (${q.options})`)
    check(q.options.includes(a * b), `${a}x${b}: resposta certa fora das alternativas`)
    check(
      q.options.every((o) => Number.isInteger(o) && o > 0),
      `${a}x${b}: alternativa invalida (${q.options})`,
    )
  }
}

// Entradas podres nao podem travar nem gerar pergunta sem sentido.
for (const bad of [NaN, 0, -3, Infinity, 1.5]) {
  const q = makeQuestion(bad, 4)
  check(q.options.length === 4, `fator ${bad}: ${q.options.length} alternativas`)
  check(Number.isInteger(q.answer) && q.answer > 0, `fator ${bad}: resposta ${q.answer}`)
}

check(mixedRound([NaN, 3]).length === QUESTIONS_PER_ROUND, 'rodada mista com NaN na lista')
check(mixedRound([]).length === QUESTIONS_PER_ROUND, 'rodada mista sem tabuadas liberadas')
check(
  mixedRound([NaN]).every((q) => Number.isInteger(q.answer) && q.answer > 0),
  'rodada mista so com NaN gera perguntas validas',
)

// Com uma tabuada so liberada, a rodada ainda precisa ter 10 contas diferentes.
for (const liberadas of [[3], [2, 7], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]]) {
  const round = mixedRound(liberadas)
  const distintas = new Set(round.map((q) => `${q.a}x${q.b}`))
  check(distintas.size === QUESTIONS_PER_ROUND, `rodada mista com ${liberadas}: ${distintas.size} contas distintas`)
  check(
    round.every((q) => liberadas.includes(q.a)),
    `rodada mista com ${liberadas}: pergunta fora das tabuadas liberadas`,
  )
}

for (let table = 1; table <= 10; table++) {
  const round = roundForTable(table)
  check(round.length === QUESTIONS_PER_ROUND, `tabuada ${table}: ${round.length} perguntas`)
  check(
    round.every((q) => q.a === table && q.answer === q.a * q.b),
    `tabuada ${table}: pergunta fora da tabuada`,
  )
}

if (fails > 0) {
  console.error(`\n${fails} verificacao(oes) falharam`)
  process.exit(1)
}
console.log('ok: perguntas geradas sem travar em todas as combinacoes')
