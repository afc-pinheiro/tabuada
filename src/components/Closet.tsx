import { useState } from 'react'
import { Character, ItemThumb } from './Character'
import { CATEGORY_EMOJI, CATEGORY_LABEL, DRESS_CATEGORIES, itemsOf, ownedKey } from '../game/catalog'
import { sfx } from '../game/sfx'
import type { Category, Outfit } from '../game/types'

interface Props {
  stars: number
  outfit: Outfit
  owned: string[]
  onWear: (category: Category, item: string | null, color?: string) => void
  onExit: () => void
}

const TABS: Category[] = ['body', 'eyes', ...DRESS_CATEGORIES]

export function Closet({ stars, outfit, owned, onWear, onExit }: Props) {
  const [tab, setTab] = useState<Category>('hair')
  const items = itemsOf(tab).filter((item) => owned.includes(ownedKey(tab, item.id)))
  const worn = outfit[tab]
  const wornItem = items.find((i) => i.id === worn?.item) ?? items[0]
  const canRemove = tab === 'hat'
  // Pele e olhos tem uma peça só: a grade de itens não acrescenta nada, só as cores.
  const showItems = items.length > 1

  function pickItem(itemId: string) {
    sfx.click()
    const item = items.find((i) => i.id === itemId)
    const keepColor = item?.variants.some((v) => v.color === worn?.color) ? worn?.color : undefined
    onWear(tab, itemId, keepColor)
  }

  return (
    <section className="screen screen--closet">
      <header className="screen__top">
        <button className="btn btn--ghost btn--small" onClick={onExit}>
          ← Voltar
        </button>
        <h2 className="title title--small">Guarda-roupa</h2>
        <span className="wallet">{stars} ⭐</span>
      </header>

      <Character outfit={outfit} scale={4} />

      <nav className="tabs" role="tablist">
        {TABS.map((category) => (
          <button
            key={category}
            role="tab"
            aria-selected={tab === category}
            className={`tab ${tab === category ? 'tab--active' : ''}`}
            onClick={() => {
              sfx.click()
              setTab(category)
            }}
          >
            <span aria-hidden="true">{CATEGORY_EMOJI[category]}</span>
            <span className="tab__label">{CATEGORY_LABEL[category]}</span>
          </button>
        ))}
      </nav>

      {showItems && (
        <div className="grid">
          {canRemove && (
            <button className={`card ${!worn ? 'card--on' : ''}`} onClick={() => onWear(tab, null)}>
              <span className="card__none">nada</span>
              <span className="card__name">Sem nada</span>
            </button>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              className={`card ${worn?.item === item.id ? 'card--on' : ''}`}
              onClick={() => pickItem(item.id)}
            >
              <ItemThumb
                base={outfit}
                category={tab}
                itemId={item.id}
                color={worn?.item === item.id ? worn.color : item.variants[0].color}
              />
              <span className="card__name">{item.name}</span>
            </button>
          ))}
        </div>
      )}

      {wornItem && wornItem.variants.length > 1 && (
        <div className="colors" aria-label="Cores">
          {wornItem.variants.map((variant) => (
            <button
              key={variant.color}
              className={`swatch ${worn?.color === variant.color ? 'swatch--on' : ''}`}
              style={{ background: variant.swatch }}
              title={variant.label}
              aria-label={variant.label}
              onClick={() => {
                sfx.click()
                onWear(tab, wornItem.id, variant.color)
              }}
            />
          ))}
        </div>
      )}

      {!showItems && !wornItem && <p className="shop__hint">Nada aqui ainda — passe na lojinha!</p>}
    </section>
  )
}
