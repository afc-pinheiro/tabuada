import { useEffect, useRef, useState } from 'react'
import { Character, ItemThumb } from './Character'
import { Trail, sceneFor } from './Trail'
import { MEDAL_EMOJI, QUESTIONS_PER_ROUND, STARS_PER_HIT, medalFor, mixedRound, roundForTable } from '../game/quiz'
import type { Question } from '../game/quiz'
import type { Prize } from '../game/reward'
import { sfx } from '../game/sfx'
import type { Outfit } from '../game/types'

interface Props {
  table: number | 'mix'
  outfit: Outfit
  unlockedTables: number[]
  /** Aplica o resultado e devolve o presente sorteado, se houver. */
  onFinish: (result: { hits: number; stars: number }) => Prize | null
  onExit: () => void
}

type Phase = 'playing' | 'done'

export function Quiz({ table, outfit, unlockedTables, onFinish, onExit }: Props) {
  // Sorteado uma vez na montagem: o Quiz desmonta ao sair da tela, entao cada
  // rodada nova ganha o seu proprio conjunto. Nada de re-sortear no meio.
  const [questions] = useState<Question[]>(() =>
    table === 'mix' ? mixedRound(unlockedTables) : roundForTable(table),
  )

  const [index, setIndex] = useState(0)
  const [hits, setHits] = useState(0)
  const [streak, setStreak] = useState(0)
  const [stars, setStars] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('playing')
  const [prize, setPrize] = useState<Prize | null>(null)
  const reported = useRef(false)

  const question = questions[index]
  const locked = picked !== null

  useEffect(() => {
    if (phase !== 'done' || reported.current) return
    reported.current = true
    sfx.fanfare()
    setPrize(onFinish({ hits, stars }))
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
    // No ultimo acerto vale esperar a caminhada terminar: e a hora em que ela
    // chega no presente, o ponto alto da fase.
    const last = index + 1 >= questions.length
    const wait = right ? (last ? 1600 : 650) : 1200
    window.setTimeout(() => {
      setPicked(null)
      if (last) setPhase('done')
      else setIndex((i) => i + 1)
    }, wait)
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

        {prize && (
          <div className="prize">
            <p className="prize__title">🎁 Tinha um presente no baú!</p>
            <div className="prize__card">
              <ItemThumb
                base={outfit}
                category={prize.category}
                itemId={prize.item.id}
                color={prize.color}
                scale={1.8}
              />
              <span className="prize__name">{prize.item.name}</span>
            </div>
            <p className="prize__hint">Já está vestido em você ✨</p>
          </div>
        )}
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

      <Trail outfit={outfit} step={hits} total={questions.length} scene={sceneFor(table)} />

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
