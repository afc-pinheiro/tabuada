import { useEffect, useRef, useState } from 'react'
import { Character } from './Character'
import type { Outfit } from '../game/types'

interface Props {
  outfit: Outfit
  /** Quantos passos ja foram dados (acertos). */
  step: number
  /** Total de passos ate o bau. */
  total: number
  /** Tema visual da fase. */
  scene: SceneName
}

export type SceneName = 'campo' | 'praia' | 'floresta' | 'neve' | 'noite'

/** Um cenario por tabuada, para cada fase ter cara propria. */
export const SCENES: SceneName[] = ['campo', 'praia', 'floresta', 'neve', 'noite']

export function sceneFor(table: number | 'mix'): SceneName {
  if (table === 'mix') return 'noite'
  return SCENES[(table - 1) % SCENES.length]
}

const WALK_MS = 900

export function Trail({ outfit, step, total, scene }: Props) {
  const [walking, setWalking] = useState(false)
  const previous = useRef(step)

  // Anda so quando o passo aumenta; ao reiniciar a fase ela volta parada.
  useEffect(() => {
    if (step === previous.current) return
    const forward = step > previous.current
    previous.current = step
    if (!forward) return
    setWalking(true)
    const id = window.setTimeout(() => setWalking(false), WALK_MS)
    return () => window.clearTimeout(id)
  }, [step])

  const progress = total > 0 ? Math.min(step / total, 1) : 0
  const arrived = step >= total

  return (
    <div className={`trail trail--${scene}`} aria-hidden="true">
      <div className="trail__sky">
        <span className="trail__orb" />
        <span className="trail__cloud trail__cloud--a" />
        <span className="trail__cloud trail__cloud--b" />
      </div>

      <div className="trail__hills" />
      <div className="trail__ground">
        <div className="trail__marks">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`trail__mark ${i < step ? 'trail__mark--done' : ''}`} />
          ))}
        </div>
      </div>

      <div className="trail__walker" style={{ left: `calc(${progress * 100}% - ${progress * 96}px)` }}>
        <Character outfit={outfit} scale={1.6} pose={walking ? 'walk' : 'idle'} />
      </div>

      <div className={`trail__goal ${arrived ? 'trail__goal--open' : ''}`}>{arrived ? '✨' : '🎁'}</div>
    </div>
  )
}
