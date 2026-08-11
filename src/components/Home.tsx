import { Character } from './Character'
import { LevelMap } from './LevelMap'
import { sfx } from '../game/sfx'
import type { Outfit, SaveData } from '../game/types'

interface Props {
  save: SaveData
  onPlay: (table: number | 'mix') => void
  onOpenShop: () => void
  onOpenCloset: () => void
  onToggleSound: () => void
  soundOn: boolean
}

export function Home({ save, onPlay, onOpenShop, onOpenCloset, onToggleSound, soundOn }: Props) {
  const outfit: Outfit = save.outfit
  return (
    <section className="screen screen--home">
      <header className="home__top">
        <h1 className="logo">
          Tabuada <span>Mágica</span>
        </h1>
        <div className="home__actions">
          <span className="wallet">{save.stars} ⭐</span>
          <button className="btn btn--icon" onClick={onToggleSound} aria-label={soundOn ? 'Desligar som' : 'Ligar som'}>
            {soundOn ? '🔊' : '🔇'}
          </button>
        </div>
      </header>

      <div className="home__stage">
        <Character outfit={outfit} scale={3.5} className="character--float" />
      </div>

      <div className="row">
        <button
          className="btn btn--primary"
          onClick={() => {
            sfx.click()
            onOpenCloset()
          }}
        >
          👗 Roupinhas
        </button>
        <button
          className="btn btn--primary"
          onClick={() => {
            sfx.click()
            onOpenShop()
          }}
        >
          🛍️ Lojinha
        </button>
      </div>

      <LevelMap
        save={save}
        onPlay={(table) => {
          sfx.click()
          onPlay(table)
        }}
      />
    </section>
  )
}
