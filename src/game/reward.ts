import { DRESS_CATEGORIES, itemsOf, ownedKey } from './catalog'
import type { Category, Item, SaveData } from './types'

export interface Prize {
  category: Category
  item: Item
  color: string
}

/**
 * Presente do fim da fase. Sorteia entre as pecas que ela ainda nao tem, dando
 * preferencia as baratas — as caras continuam valendo a pena comprar na loja, e
 * assim o presente nao esvazia a lojinha logo nas primeiras fases.
 */
export function drawPrize(save: SaveData, hits: number, total: number): Prize | null {
  // Presente so com pelo menos metade da fase acertada; senao vira loteria.
  if (hits * 2 < total) return null

  const pool: { category: Category; item: Item; weight: number }[] = []
  for (const category of DRESS_CATEGORIES) {
    for (const item of itemsOf(category)) {
      if (save.owned.includes(ownedKey(category, item.id))) continue
      // Peca de 25 estrelas cai ~6x mais que uma de 150.
      pool.push({ category, item, weight: 150 / Math.max(item.price, 25) })
    }
  }
  if (!pool.length) return null

  const total_weight = pool.reduce((sum, p) => sum + p.weight, 0)
  let ticket = Math.random() * total_weight
  const chosen = pool.find((p) => (ticket -= p.weight) <= 0) ?? pool[pool.length - 1]
  const variants = chosen.item.variants
  const color = variants[Math.floor(Math.random() * variants.length)].color
  return { category: chosen.category, item: chosen.item, color }
}
