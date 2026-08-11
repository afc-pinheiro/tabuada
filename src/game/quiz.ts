export interface Question {
  a: number
  b: number
  answer: number
  options: number[]
}

export const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
export const QUESTIONS_PER_ROUND = 10

/** Estrelas ganhas por acerto, antes do bonus de sequencia. */
export const STARS_PER_HIT = 3

function shuffle<T>(list: T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Alternativas erradas plausiveis: resultados vizinhos da mesma tabuada e
 * pequenos deslizes de soma. Nada de numeros aleatorios distantes, senao a
 * resposta certa fica obvia.
 */
function distractors(a: number, b: number): number[] {
  const answer = a * b
  const pool = new Set<number>()
  for (const delta of [-2, -1, 1, 2]) {
    const near = (b + delta) * a
    if (near > 0) pool.add(near)
  }
  pool.add(answer + a)
  pool.add(answer - a)
  pool.add(answer + 1)
  pool.add(answer - 1)
  pool.add(answer + 10)
  pool.delete(answer)
  return shuffle([...pool].filter((n) => n > 0))
}

export function makeQuestion(a: number, b: number): Question {
  const answer = a * b
  const wrong = distractors(a, b).slice(0, 3)
  while (wrong.length < 3) {
    const candidate = answer + wrong.length + 3
    if (!wrong.includes(candidate)) wrong.push(candidate)
  }
  return { a, b, answer, options: shuffle([answer, ...wrong]) }
}

/** Rodada de uma tabuada especifica: todos os fatores de 1 a 10, embaralhados. */
export function roundForTable(table: number): Question[] {
  return shuffle(TABLES.map((b) => b)).slice(0, QUESTIONS_PER_ROUND).map((b) => makeQuestion(table, b))
}

/** Rodada mista: sorteia tabuada e fator a cada pergunta. */
export function mixedRound(unlocked: number[]): Question[] {
  const pool = unlocked.length ? unlocked : [...TABLES]
  return Array.from({ length: QUESTIONS_PER_ROUND }, () => {
    const a = pool[Math.floor(Math.random() * pool.length)]
    const b = 1 + Math.floor(Math.random() * 10)
    return makeQuestion(a, b)
  })
}

export function medalFor(hits: number): 0 | 1 | 2 | 3 {
  if (hits >= 10) return 3
  if (hits >= 8) return 2
  if (hits >= 6) return 1
  return 0
}

export const MEDAL_EMOJI = ['', '🥉', '🥈', '🥇'] as const
