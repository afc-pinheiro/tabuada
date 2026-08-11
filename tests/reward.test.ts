/**
 * Presente do fim da fase. As regras que importam: nunca repetir uma peca que
 * ela ja tem, e nao premiar uma fase mal jogada. Rodar com `npm test`.
 */
import { DRESS_CATEGORIES, itemsOf, ownedKey } from '../src/game/catalog'
import { drawPrize } from '../src/game/reward'
import { defaultSave } from '../src/game/save'
import type { SaveData } from '../src/game/types'

let fails = 0

function check(condition: boolean, message: string): void {
  if (!condition) {
    fails++
    console.error('FALHOU:', message)
  }
}

const save: SaveData = defaultSave()

// Fase mal jogada nao ganha presente.
for (const hits of [0, 1, 2, 3, 4]) {
  check(drawPrize(save, hits, 10) === null, `${hits}/10 nao devia ganhar presente`)
}

// Metade pra cima ganha.
for (const hits of [5, 7, 10]) {
  check(drawPrize(save, hits, 10) !== null, `${hits}/10 devia ganhar presente`)
}

// O sorteio nunca cai numa peca ja possuida.
for (let i = 0; i < 400; i++) {
  const prize = drawPrize(save, 10, 10)
  check(prize !== null, 'sorteio devolveu nulo com pecas disponiveis')
  if (prize) {
    check(
      !save.owned.includes(ownedKey(prize.category, prize.item.id)),
      `sorteou peca ja possuida: ${prize.category}/${prize.item.id}`,
    )
    check(
      prize.item.variants.some((v) => v.color === prize.color),
      `cor ${prize.color} nao existe em ${prize.item.id}`,
    )
  }
}

// Com tudo comprado, nao ha o que sortear — e nao pode quebrar.
const completo: SaveData = {
  ...save,
  owned: DRESS_CATEGORIES.flatMap((c) => itemsOf(c).map((i) => ownedKey(c, i.id))),
}
check(drawPrize(completo, 10, 10) === null, 'com tudo comprado o presente deve ser nulo')

if (fails > 0) {
  console.error(`\n${fails} verificacao(oes) falharam`)
  process.exit(1)
}
console.log('ok: presente sorteia so peca nova e so em fase bem jogada')
