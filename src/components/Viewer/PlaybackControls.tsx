import type { PlaybackState } from '../../hooks/useAlphaTab'

interface Props {
  state: PlaybackState
  isLoaded: boolean
  speed: number
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSpeedChange: (v: number) => void
}

export default function PlaybackControls({
  state, isLoaded, speed, onPlay, onPause, onStop, onSpeedChange
}: Props) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-xl flex-wrap">
      {state === 'playing' ? (
        <button
          onClick={onPause}
          disabled={!isLoaded}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-sm font-medium"
        >
          ⏸ Pause
        </button>
      ) : (
        <button
          onClick={onPlay}
          disabled={!isLoaded}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-sm font-medium"
        >
          ▶ Play
        </button>
      )}
      <button
        onClick={onStop}
        disabled={!isLoaded}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded-lg text-sm font-medium"
      >
        ⏹ Stop
      </button>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-gray-400">Speed</span>
        {[0.5, 0.75, 1].map(v => (
          <button
            key={v}
            onClick={() => onSpeedChange(v)}
            disabled={!isLoaded}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40
              ${speed === v
                ? 'bg-indigo-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            {v === 1 ? '100%' : `${v * 100}%`}
          </button>
        ))}
      </div>
    </div>
  )
}
