import { useRef, useEffect } from 'react'
import { useAlphaTab, type AlphaTabHandle } from '../../hooks/useAlphaTab'

interface Props {
  fileUrl: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onScoreLoaded?: (score: any) => void
  onHandleChange: (handle: AlphaTabHandle) => void
}

export default function AlphaTabWrapper({ fileUrl, onScoreLoaded, onHandleChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const handle = useAlphaTab(containerRef, fileUrl, onScoreLoaded)

  // Run after every render to notify parent of handle state changes.
  // useEffect avoids "updating during render" React warning.
  useEffect(() => { onHandleChange(handle) })

  return (
    <div className="relative">
      {!handle.isLoaded && fileUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 z-10 rounded-lg min-h-32">
          <p className="text-gray-400">Loading score…</p>
        </div>
      )}
      <div ref={containerRef} className="at-main bg-white rounded-lg min-h-32" />
    </div>
  )
}
