import { Character } from './Character'
import { MEDAL_EMOJI, TABLES } from '../game/quiz'
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
        <Character outfit={outfit} scale={4} className="character--float" />
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

      <h2 className="title title--small">Escolha a tabuada</h2>
      <div className="tables">
        {TABLES.map((table) => {
          const progress = save.progress[String(table)]
          return (
            <button
              key={table}
              className="table-btn"
              onClick={() => {
                sfx.click()
                onPlay(table)
              }}
            >
              <span className="table-btn__n">{table}</span>
              <span className="table-btn__medal">{progress ? MEDAL_EMOJI[progress.medal] : ''}</span>
            </button>
          )
        })}
      </div>

      <button
        className="btn btn--mix"
        onClick={() => {
          sfx.click()
          onPlay('mix')
        }}
      >
        🎲 Desafio misturado
      </button>
    </section>
  )
}
