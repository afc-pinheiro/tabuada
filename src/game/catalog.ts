import raw from '../data/catalog.json'
import type { Catalog, Category, Item, Pose, Worn } from './types'

export const catalog = raw as unknown as Catalog

export const CATEGORIES: Category[] = ['body', 'head', 'eyes', 'hair', 'torso', 'legs', 'feet', 'hat']

/** Categorias vendidas na lojinha e trocaveis no guarda-roupa. */
export const DRESS_CATEGORIES: Category[] = ['hair', 'torso', 'legs', 'feet', 'hat']

/** `head` acompanha `body`: a mesma cor de pele vale para os dois. */
export const SKIN_CATEGORIES: Category[] = ['body', 'head']

export const CATEGORY_LABEL: Record<Category, string> = {
  body: 'Pele',
  head: 'Rosto',
  eyes: 'Olhos',
  hair: 'Cabelo',
  torso: 'Blusa',
  legs: 'Saia / calça',
  feet: 'Sapato',
  hat: 'Cabeça',
}

export const CATEGORY_EMOJI: Record<Category, string> = {
  body: '🎨',
  head: '🙂',
  eyes: '👀',
  hair: '💇',
  torso: '👚',
  legs: '👖',
  feet: '👟',
  hat: '👑',
}

export function itemsOf(category: Category): Item[] {
  return catalog.categories[category] ?? []
}

export function findItem(category: Category, id: string): Item | undefined {
  return itemsOf(category).find((i) => i.id === id)
}

export function spriteUrl(category: Category, worn: Worn, pose: Pose = 'idle'): string | undefined {
  const item = findItem(category, worn.item)
  if (!item) return undefined
  const variant = item.variants.find((v) => v.color === worn.color) ?? item.variants[0]
  if (!variant) return undefined
  // Nem toda peca tem folha de caminhada; nesse caso a camada fica de fora.
  const file = pose === 'walk' ? variant.walk : variant.file
  return file && `${import.meta.env.BASE_URL}${file}`
}

export function ownedKey(category: Category, itemId: string): string {
  return `${category}:${itemId}`
}

/** Todos os itens gratuitos ja nascem desbloqueados. */
export function freeItems(): string[] {
  const keys: string[] = []
  for (const category of CATEGORIES) {
    for (const item of itemsOf(category)) {
      if (item.price === 0) keys.push(ownedKey(category, item.id))
    }
  }
  return keys
}
