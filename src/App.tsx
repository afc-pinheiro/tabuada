import { useCallback, useEffect, useState } from 'react'
import { Closet } from './components/Closet'
import { Home } from './components/Home'
import { Quiz } from './components/Quiz'
import { Shop } from './components/Shop'
import { SKIN_CATEGORIES, findItem, ownedKey } from './game/catalog'
import { medalFor } from './game/quiz'
import { loadSave, persistSave } from './game/save'
import { sfx } from './game/sfx'
import type { Category, SaveData } from './game/types'

type Screen =
  | { name: 'home' }
  | { name: 'quiz'; table: number | 'mix' }
  | { name: 'shop' }
  | { name: 'closet' }

export default function App() {
  const [save, setSave] = useState<SaveData>(() => loadSave())
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [soundOn, setSoundOn] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => persistSave(save), [save])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(id)
  }, [toast])

  const unlockedTables = Object.entries(save.progress)
    .filter(([, p]) => p.medal > 0)
    .map(([table]) => Number(table))

  const finishRound = useCallback(
    (table: number | 'mix', result: { hits: number; stars: number }) => {
      setSave((prev) => {
        const key = table === 'mix' ? 'mix' : String(table)
        const previous = prev.progress[key] ?? { best: 0, rounds: 0, medal: 0 as const }
        const medal = medalFor(result.hits)
        return {
          ...prev,
          stars: prev.stars + result.stars,
          progress: {
            ...prev.progress,
            [key]: {
              best: Math.max(previous.best, result.hits),
              rounds: previous.rounds + 1,
              medal: medal > previous.medal ? medal : previous.medal,
            },
          },
        }
      })
    },
    [],
  )

  function wear(category: Category, itemId: string | null, color?: string) {
    setSave((prev) => {
      if (!itemId) return { ...prev, outfit: { ...prev.outfit, [category]: null } }
      const item = findItem(category, itemId)
      if (!item) return prev
      const chosen = color && item.variants.some((v) => v.color === color) ? color : item.variants[0].color
      const outfit = { ...prev.outfit, [category]: { item: itemId, color: chosen } }
      // Corpo e rosto sao camadas separadas, mas a cor de pele e uma só.
      if (SKIN_CATEGORIES.includes(category)) {
        for (const skin of SKIN_CATEGORIES) {
          const current = prev.outfit[skin]
          if (current) outfit[skin] = { item: current.item, color: chosen }
        }
      }
      return { ...prev, outfit }
    })
  }

  function buy(category: Category, itemId: string, price: number) {
    setSave((prev) => {
      const key = ownedKey(category, itemId)
      if (prev.owned.includes(key) || prev.stars < price) return prev
      const item = findItem(category, itemId)
      return {
        ...prev,
        stars: prev.stars - price,
        owned: [...prev.owned, key],
        // Compra ja veste a peca — e o que a criança espera que aconteça.
        outfit: item ? { ...prev.outfit, [category]: { item: itemId, color: item.variants[0].color } } : prev.outfit,
      }
    })
    sfx.buy()
    setToast('Comprado! Já está no seu look ✨')
  }

  function toggleSound() {
    const next = !soundOn
    setSoundOn(next)
    sfx.setMuted(!next)
    if (next) sfx.click()
  }

  return (
    <main className="app">
      {screen.name === 'home' && (
        <Home
          save={save}
          soundOn={soundOn}
          onToggleSound={toggleSound}
          onPlay={(table) => setScreen({ name: 'quiz', table })}
          onOpenShop={() => setScreen({ name: 'shop' })}
          onOpenCloset={() => setScreen({ name: 'closet' })}
        />
      )}

      {screen.name === 'quiz' && (
        <Quiz
          key={String(screen.table)}
          table={screen.table}
          outfit={save.outfit}
          unlockedTables={unlockedTables}
          onFinish={(result) => finishRound(screen.table, result)}
          onExit={() => setScreen({ name: 'home' })}
        />
      )}

      {screen.name === 'shop' && (
        <Shop stars={save.stars} owned={save.owned} outfit={save.outfit} onBuy={buy} onExit={() => setScreen({ name: 'home' })} />
      )}

      {screen.name === 'closet' && (
        <Closet stars={save.stars} outfit={save.outfit} owned={save.owned} onWear={wear} onExit={() => setScreen({ name: 'home' })} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
