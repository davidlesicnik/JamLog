import { useEffect, useRef } from 'react'

interface Props {
  bpm: number
  enabled: boolean
  onToggle: () => void
}

function scheduleClick(ctx: AudioContext, time: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = 1000
  gain.gain.setValueAtTime(0.8, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
  osc.start(time)
  osc.stop(time + 0.05)
}

export default function Metronome({ bpm, enabled, onToggle }: Props) {
  const ctxRef = useRef<AudioContext | null>(null)
  const nextTickRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    if (!ctxRef.current) ctxRef.current = new AudioContext()
    const ctx = ctxRef.current
    nextTickRef.current = ctx.currentTime + 0.1
    const interval = 60 / bpm

    const tick = () => {
      while (nextTickRef.current < ctx.currentTime + 0.2) {
        scheduleClick(ctx, nextTickRef.current)
        nextTickRef.current += interval
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafRef.current)
  }, [enabled, bpm])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      ctxRef.current?.close()
    }
  }, [])

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-xl">
      <button
        onClick={onToggle}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
          ${enabled ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
      >
        🥁 Metronome
      </button>
      <span className="text-sm text-gray-400">{bpm} BPM</span>
    </div>
  )
}
