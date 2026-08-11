import { MEDAL_EMOJI, TABLES } from '../game/quiz'
import { sceneFor } from './Trail'
import type { SaveData } from '../game/types'

interface Props {
  save: SaveData
  onPlay: (table: number | 'mix') => void
}

/** Deslocamento horizontal de cada fase, para a trilha serpentear. */
const OFFSETS = [2, 14, 26, 36, 40, 36, 26, 14, 2, 12]

const SCENE_EMOJI: Record<string, string> = {
  campo: '🌼',
  praia: '🐚',
  floresta: '🍄',
  neve: '❄️',
  noite: '🌙',
}

export function LevelMap({ save, onPlay }: Props) {
  const medals = TABLES.reduce((sum, t) => sum + (save.progress[String(t)]?.medal ?? 0), 0)
  // O desafio misturado abre quando ja houve alguma medalha: antes disso ele so
  // sortearia contas que a criança ainda nao praticou.
  const mixReady = TABLES.some((t) => (save.progress[String(t)]?.medal ?? 0) > 0)

  return (
    <div className="map">
      <div className="map__header">
        <h2 className="title title--small">Mapa das fases</h2>
        <span className="map__count">{medals}/30 🏅</span>
      </div>

      <ol className="map__trail">
        {TABLES.map((table, i) => {
          const progress = save.progress[String(table)]
          const medal = progress?.medal ?? 0
          const scene = sceneFor(table)
          return (
            <li key={table} className="map__row" style={{ marginLeft: `${OFFSETS[i]}%` }}>
              <button
                className={`node node--${scene} ${medal > 0 ? 'node--done' : ''}`}
                onClick={() => onPlay(table)}
                aria-label={`Tabuada do ${table}${medal > 0 ? `, medalha conquistada` : ''}`}
              >
                <span className="node__scene" aria-hidden="true">
                  {SCENE_EMOJI[scene]}
                </span>
                <span className="node__n">{table}</span>
                {medal > 0 && (
                  <span className="node__medal" aria-hidden="true">
                    {MEDAL_EMOJI[medal]}
                  </span>
                )}
              </button>
            </li>
          )
        })}

        <li className="map__row map__row--boss">
          <button
            className={`node node--boss ${mixReady ? '' : 'node--locked'}`}
            onClick={() => mixReady && onPlay('mix')}
            disabled={!mixReady}
            aria-label="Desafio misturado"
          >
            <span className="node__scene" aria-hidden="true">
              {mixReady ? '🏰' : '🔒'}
            </span>
            <span className="node__n node__n--boss">Desafio</span>
          </button>
        </li>
      </ol>

      {!mixReady && <p className="map__hint">Ganhe uma medalha para abrir o castelo!</p>}
    </div>
  )
}
