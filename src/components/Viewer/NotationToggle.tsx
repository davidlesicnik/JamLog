interface Option {
  label: string
  value: number
}

const OPTIONS: Option[] = [
  { label: 'Score', value: 2 },
  { label: 'Score+Tab', value: 1 },
  { label: 'Tab', value: 3 },
]

interface Props {
  value: number
  isLoaded: boolean
  onChange: (value: number) => void
}

export default function NotationToggle({ value, isLoaded, onChange }: Props) {
  return (
    <div
      className={`inline-flex rounded-lg border border-gray-700 overflow-hidden ${!isLoaded ? 'opacity-40 pointer-events-none' : ''}`}
      role="toolbar"
      aria-label="Notation display"
    >
      {OPTIONS.map((opt, i) => {
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={!isLoaded}
            aria-pressed={isActive}
            className={[
              'px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              i > 0 ? 'border-l border-gray-700' : '',
              isActive
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700',
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
