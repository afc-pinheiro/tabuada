export type Category = 'body' | 'head' | 'eyes' | 'hair' | 'torso' | 'legs' | 'feet' | 'hat'

export interface Variant {
  color: string
  label: string
  /** Cor representativa da peca, para as bolinhas de paleta na interface. */
  swatch: string
  file: string
}

export interface Item {
  id: string
  name: string
  price: number
  z: number
  variants: Variant[]
}

export interface Catalog {
  z: Record<Category, number>
  categories: Record<Category, Item[]>
}

/** Peca vestida: qual item e em qual cor. */
export interface Worn {
  item: string
  color: string
}

export type Outfit = Partial<Record<Category, Worn | null>>

export interface TableProgress {
  /** Melhor numero de acertos numa rodada (0-10). */
  best: number
  rounds: number
  /** 0 = sem medalha, 1 = bronze, 2 = prata, 3 = ouro. */
  medal: 0 | 1 | 2 | 3
}

export interface SaveData {
  version: 1
  name: string
  stars: number
  /** Chaves `categoria:item` ja compradas. */
  owned: string[]
  outfit: Outfit
  progress: Record<string, TableProgress>
}
