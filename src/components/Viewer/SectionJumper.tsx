interface Section {
  name: string
  tick: number
}

interface Props {
  sections: Section[]
  isLoaded: boolean
  onJump: (tick: number) => void
}

export default function SectionJumper({ sections, isLoaded, onJump }: Props) {
  if (sections.length === 0) return null

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-xl">
      <span className="text-sm text-gray-400 shrink-0">Jump to section</span>
      <select
        disabled={!isLoaded}
        defaultValue=""
        onChange={e => onJump(Number(e.target.value))}
        className="flex-1 bg-gray-800 rounded-lg px-3 py-1.5 text-sm disabled:opacity-40"
      >
        <option value="" disabled>Select…</option>
        {sections.map(s => (
          <option key={s.tick} value={s.tick}>{s.name}</option>
        ))}
      </select>
    </div>
  )
}
