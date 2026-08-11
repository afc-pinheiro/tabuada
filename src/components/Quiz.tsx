import { useEffect, useMemo, useRef, useState } from 'react'
import { Character } from './Character'
import { MEDAL_EMOJI, QUESTIONS_PER_ROUND, STARS_PER_HIT, medalFor, mixedRound, roundForTable } from '../game/quiz'
import type { Question } from '../game/quiz'
import { sfx } from '../game/sfx'
import type { Outfit } from '../game/types'

interface Props {
  table: number | 'mix'
  outfit: Outfit
  unlockedTables: number[]
  onFinish: (result: { hits: number; stars: number }) => void
  onExit: () => void
}

type Phase = 'playing' | 'done'

export function Quiz({ table, outfit, unlockedTables, onFinish, onExit }: Props) {
  const questions = useMemo<Question[]>(
    () => (table === 'mix' ? mixedRound(unlockedTables) : roundForTable(table)),
    [table, unlockedTables],
  )

  const [index, setIndex] = useState(0)
  const [hits, setHits] = useState(0)
  const [streak, setStreak] = useState(0)
  const [stars, setStars] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('playing')
  const reported = useRef(false)

  const question = questions[index]
  const locked = picked !== null

  useEffect(() => {
    if (phase !== 'done' || reported.current) return
    reported.current = true
    sfx.fanfare()
    onFinish({ hits, stars })
  }, [phase, hits, stars, onFinish])

  function choose(option: number) {
    if (locked) return
    setPicked(option)
    const right = option === question.answer
    if (right) {
      const bonus = streak >= 3 ? 2 : 0
      sfx.correct()
      setHits((h) => h + 1)
      setStreak((s) => s + 1)
      setStars((s) => s + STARS_PER_HIT + bonus)
    } else {
      sfx.wrong()
      setStreak(0)
    }
    window.setTimeout(() => {
      setPicked(null)
      if (index + 1 >= questions.length) setPhase('done')
      else setIndex((i) => i + 1)
    }, right ? 650 : 1200)
  }

  if (phase === 'done') {
    const medal = medalFor(hits)
    return (
      <section className="screen screen--result">
        <h2 className="title">{hits === QUESTIONS_PER_ROUND ? 'Perfeito!' : hits >= 6 ? 'Muito bem!' : 'Quase lá!'}</h2>
        <Character outfit={outfit} scale={4} className="character--bounce" />
        <p className="result__score">
          {hits} de {questions.length} {medal > 0 && <span className="result__medal">{MEDAL_EMOJI[medal]}</span>}
        </p>
        <p className="result__stars">+{stars} ⭐</p>
        <div className="row">
          <button className="btn btn--primary" onClick={onExit}>
            Voltar
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="screen screen--quiz">
      <header className="quiz__top">
        <button className="btn btn--ghost btn--small" onClick={onExit}>
          ← Sair
        </button>
        <div className="quiz__progress" aria-label={`Pergunta ${index + 1} de ${questions.length}`}>
          {questions.map((_, i) => (
            <span key={i} className={`pip ${i < index ? 'pip--done' : ''} ${i === index ? 'pip--now' : ''}`} />
          ))}
        </div>
        <span className="quiz__stars">{stars} ⭐</span>
      </header>

      <Character
        outfit={outfit}
        scale={3}
        className={picked === null ? '' : picked === question.answer ? 'character--bounce' : 'character--sad'}
      />

      {streak >= 3 && <p className="quiz__streak">🔥 {streak} seguidas!</p>}

      <p className="quiz__question">
        {question.a} × {question.b}
      </p>

      <div className="options">
        {question.options.map((option) => {
          const state = !locked
            ? ''
            : option === question.answer
              ? 'option--right'
              : option === picked
                ? 'option--wrong'
                : 'option--dim'
          return (
            <button key={option} className={`option ${state}`} onClick={() => choose(option)} disabled={locked}>
              {option}
            </button>
          )
        })}
      </div>
    </section>
  )
}
