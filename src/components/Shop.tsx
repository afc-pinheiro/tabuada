import { useState } from 'react'
import { ItemThumb } from './Character'
import { CATEGORY_EMOJI, CATEGORY_LABEL, DRESS_CATEGORIES, itemsOf, ownedKey } from '../game/catalog'
import { sfx } from '../game/sfx'
import type { Category, Outfit } from '../game/types'

interface Props {
  stars: number
  owned: string[]
  outfit: Outfit
  onBuy: (category: Category, itemId: string, price: number) => void
  onExit: () => void
}

export function Shop({ stars, owned, outfit, onBuy, onExit }: Props) {
  const [tab, setTab] = useState<Category>('hair')
  const items = itemsOf(tab)

  return (
    <section className="screen screen--shop">
      <header className="screen__top">
        <button className="btn btn--ghost btn--small" onClick={onExit}>
          ← Voltar
        </button>
        <h2 className="title title--small">Lojinha</h2>
        <span className="wallet">{stars} ⭐</span>
      </header>

      <p className="shop__hint">Cada peça vem com todas as cores. Compre uma vez, use como quiser!</p>

      <nav className="tabs" role="tablist">
        {DRESS_CATEGORIES.map((category) => (
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

      <div className="grid">
        {items.map((item) => {
          const isOwned = owned.includes(ownedKey(tab, item.id))
          const affordable = stars >= item.price
          return (
            <button
              key={item.id}
              className={`card ${isOwned ? 'card--owned' : ''} ${!isOwned && !affordable ? 'card--locked' : ''}`}
              disabled={isOwned || !affordable}
              onClick={() => onBuy(tab, item.id, item.price)}
            >
              <ItemThumb base={outfit} category={tab} itemId={item.id} color={item.variants[0].color} />
              <span className="card__name">{item.name}</span>
              <span className="card__price">{isOwned ? '✓ seu' : `${item.price} ⭐`}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
