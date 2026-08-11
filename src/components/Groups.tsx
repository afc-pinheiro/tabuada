import { useEffect, useState } from 'react'
import type { SceneName } from './Trail'

interface Props {
  /** Quantidade de grupos. */
  a: number
  /** Quantos elementos em cada grupo. */
  b: number
  scene: SceneName
  /**
   * Fecha a conta com o resultado. Ligado depois de um erro, quando o objetivo
   * e explicar; desligado quando ela pediu ajuda, para nao entregar a resposta
   * de bandeja — aí ela recebe os grupos para contar e a pergunta do ultimo passo.
   */
  reveal: boolean
}

/** Cada cenario conta com o seu proprio elemento — reforça em que fase ela está. */
const TOKEN: Record<SceneName, string> = {
  campo: '🌼',
  praia: '🐚',
  floresta: '🍄',
  neve: '❄️',
  noite: '⭐',
}

/** Um grupo por vez, para dar tempo de contar junto. */
const GROUP_MS = 620

/**
 * "2 grupos de 9": desenha os grupos um a um enquanto o total sobe de b em b.
 * E a contagem de pulinhos (9, 18, 27...) que a criança faz em voz alta,
 * so que visivel.
 */
export function Groups({ a, b, scene, reveal }: Props) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    setShown(0)
    const id = window.setInterval(() => {
      setShown((n) => {
        if (n >= a) {
          window.clearInterval(id)
          return n
        }
        return n + 1
      })
    }, GROUP_MS)
    return () => window.clearInterval(id)
  }, [a, b])

  const token = TOKEN[scene]
  // Um grupo grande vira duas fileiras; assim nenhum grupo fica comprido demais.
  const columns = Math.min(b, 5)
  // Muitos elementos na tela pedem elementos menores.
  const size = a * b > 60 ? 11 : a * b > 30 ? 14 : 18

  return (
    <div className="groups">
      <p className="groups__legend">
        {a} {a === 1 ? 'grupo' : 'grupos'} de {b}
      </p>

      <div className="groups__board" style={{ ['--token' as string]: `${size}px` }}>
        {Array.from({ length: a }, (_, g) => (
          <div key={g} className={`group ${g < shown ? 'group--in' : ''}`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: b }, (_, i) => (
              <span key={i} className="group__token" style={{ animationDelay: `${i * 45}ms` }}>
                {token}
              </span>
            ))}
          </div>
        ))}
      </div>

      <p className="groups__count" aria-live="polite">
        {countLine(a, b, shown, reveal)}
      </p>
    </div>
  )
}

/** A linha que acompanha a contagem, de grupo em grupo. */
export function countLine(a: number, b: number, shown: number, reveal: boolean): string {
  if (shown === 0) return '\u00a0'
  const total = shown * b
  if (shown < a) return `${total}...`
  if (reveal) return `${a} × ${b} = ${total}`
  // Sem revelar: para no penultimo passo e deixa a ultima soma com ela.
  // Com um grupo so, qualquer numero na linha ja seria a resposta.
  return a > 1 ? `${(a - 1) * b} + ${b} = ?` : 'conte quantos sao!'
}
