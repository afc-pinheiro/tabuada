/** Bipes simples via WebAudio — sem arquivos de audio para baixar. */

let ctx: AudioContext | null = null
let muted = false

function audio(): AudioContext | null {
  if (muted) return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, start: number, duration: number, gain = 0.08) {
  const ac = audio()
  if (!ac) return
  const osc = ac.createOscillator()
  const vol = ac.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(freq, ac.currentTime + start)
  vol.gain.setValueAtTime(gain, ac.currentTime + start)
  vol.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration)
  osc.connect(vol).connect(ac.destination)
  osc.start(ac.currentTime + start)
  osc.stop(ac.currentTime + start + duration)
}

export const sfx = {
  correct() {
    tone(660, 0, 0.09)
    tone(880, 0.08, 0.14)
  },
  wrong() {
    tone(200, 0, 0.18, 0.06)
  },
  click() {
    tone(520, 0, 0.05, 0.05)
  },
  buy() {
    tone(700, 0, 0.07)
    tone(900, 0.06, 0.07)
    tone(1200, 0.12, 0.16)
  },
  fanfare() {
    ;[523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.11, 0.22))
  },
  setMuted(value: boolean) {
    muted = value
  },
  isMuted() {
    return muted
  },
}
