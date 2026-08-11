import { freeItems } from './catalog'
import type { SaveData } from './types'

const STORAGE_KEY = 'tabuada-magica/save/v1'

export function defaultSave(): SaveData {
  return {
    version: 1,
    name: '',
    stars: 0,
    owned: freeItems(),
    outfit: {
      body: { item: 'corpo', color: 'light' },
      head: { item: 'cabeca', color: 'light' },
      eyes: { item: 'olhos', color: 'brown' },
      hair: { item: 'maria-chiquinha', color: 'chestnut' },
      torso: { item: 'blusa', color: 'pink' },
      legs: { item: 'saia', color: 'lavender' },
      feet: { item: 'sapatilha', color: 'white' },
      hat: null,
    },
    progress: {},
  }
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSave()
    const parsed = JSON.parse(raw) as SaveData
    if (parsed.version !== 1) return defaultSave()
    const base = defaultSave()
    // Itens gratuitos e camadas novas podem ter surgido depois que o save foi criado.
    const owned = new Set([...parsed.owned, ...freeItems()])
    return { ...base, ...parsed, owned: [...owned], outfit: { ...base.outfit, ...parsed.outfit } }
  } catch {
    return defaultSave()
  }
}

export function persistSave(save: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
  } catch {
    // Sem localStorage (aba anonima, cota cheia): o jogo segue funcionando na sessao.
  }
}

export function resetSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignora */
  }
}
