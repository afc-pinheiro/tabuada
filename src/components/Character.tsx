import { CATEGORIES, catalog, findItem, spriteUrl } from '../game/catalog'
import type { Category, Outfit, Pose } from '../game/types'

interface Props {
  outfit: Outfit
  /** Multiplicador do sprite de 64x64. */
  scale?: number
  pose?: Pose
  className?: string
}

interface Layer {
  key: string
  url: string
  z: number
}

export function buildLayers(outfit: Outfit, pose: Pose): Layer[] {
  const layers: Layer[] = []
  for (const category of CATEGORIES) {
    const worn = outfit[category]
    if (!worn) continue
    const url = spriteUrl(category, worn, pose)
    if (!url) continue
    const item = findItem(category, worn.item)
    layers.push({
      key: `${category}-${worn.item}-${worn.color}`,
      url,
      z: item?.z ?? catalog.z[category] ?? 50,
    })
  }
  return layers.sort((a, b) => a.z - b.z)
}

export function Character({ outfit, scale = 4, pose = 'idle', className }: Props) {
  const layers = buildLayers(outfit, pose)
  return (
    <div
      className={`character ${className ?? ''}`}
      style={{ width: 64 * scale, height: 64 * scale }}
      aria-hidden="true"
    >
      <div className="character__inner" style={{ transform: `scale(${scale})` }}>
        {layers.map((layer) => (
          <span
            key={layer.key}
            className={`character__layer character__layer--${pose}`}
            style={{ backgroundImage: `url("${layer.url}")`, zIndex: layer.z }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Miniatura de uma peca: o look atual com aquela peca no lugar. Da escala
 * (um sapato sozinho no quadro de 64x64 e ilegivel) e mostra como fica de fato.
 */
export function ItemThumb({
  base,
  category,
  itemId,
  color,
  scale = 1.5,
}: {
  base: Outfit
  category: Category
  itemId: string
  color: string
  scale?: number
}) {
  const outfit: Outfit = { ...base, [category]: { item: itemId, color } }
  // Um chapeu esconderia o cabelo que esta sendo escolhido.
  if (category === 'hair') outfit.hat = null
  return <Character outfit={outfit} scale={scale} className="character--thumb" />
}
