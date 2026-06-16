interface Props {
  maxBar: number
  enabled: boolean
  startBar: number
  endBar: number
  isLoaded: boolean
  onToggle: () => void
  onChange: (start: number, end: number) => void
}

export default function LoopControl({
  maxBar, enabled, startBar, endBar, isLoaded, onToggle, onChange
}: Props) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-xl flex-wrap">
      <button
        onClick={onToggle}
        disabled={!isLoaded}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40
          ${enabled ? 'bg-orange-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
      >
        🔁 Loop
      </button>
      <div className="flex items-center gap-2 text-sm">
        <label className="text-gray-400">Bar</label>
        <input
          type="number"
          min={1}
          max={endBar}
          value={startBar}
          disabled={!isLoaded}
          onChange={e => {
            const v = Math.max(1, Math.min(endBar, Number(e.target.value)))
            onChange(v, endBar)
          }}
          className="w-16 bg-gray-800 rounded px-2 py-1 text-center disabled:opacity-40"
        />
        <span className="text-gray-500">–</span>
        <input
          type="number"
          min={startBar}
          max={maxBar}
          value={endBar}
          disabled={!isLoaded}
          onChange={e => {
            const v = Math.max(startBar, Math.min(maxBar, Number(e.target.value)))
            onChange(startBar, v)
          }}
          className="w-16 bg-gray-800 rounded px-2 py-1 text-center disabled:opacity-40"
        />
      </div>
    </div>
  )
}
