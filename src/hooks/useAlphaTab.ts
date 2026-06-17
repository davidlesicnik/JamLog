import { useEffect, useRef, useState, useMemo } from 'react'

export type PlaybackState = 'stopped' | 'playing' | 'paused'

export interface AlphaTabHandle {
  api: unknown | null
  isLoaded: boolean
  playbackState: PlaybackState
  play: () => void
  pause: () => void
  stop: () => void
  setSpeed: (ratio: number) => void
}

export function useAlphaTab(
  containerRef: React.RefObject<HTMLDivElement | null>,
  fileUrl: string | null,
  // Callback fires synchronously inside the scoreLoaded event, before isLoaded=true.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onScoreLoaded?: (score: any) => void,
  staveProfile?: number
): AlphaTabHandle {
  const apiRef = useRef<unknown>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped')
  const onScoreLoadedRef = useRef(onScoreLoaded)
  useEffect(() => { onScoreLoadedRef.current = onScoreLoaded }, [onScoreLoaded])

  useEffect(() => {
    if (!containerRef.current || !fileUrl) return
    let destroyed = false

    const init = async () => {
      const alphaTabModule = await import('@coderline/alphatab')
      if (destroyed) return

      const { AlphaTabApi } = alphaTabModule

      // vite-plugin-static-copy copies these to public/alphatab/ at build time.
      const workerUrl = `${window.location.origin}/alphatab/alphaTab.worker.mjs`
      const soundFontUrl = `${window.location.origin}/alphatab/soundfont/sonivox.sf2`

      const api = new AlphaTabApi(containerRef.current!, {
        core: { scriptFile: workerUrl },
        player: {
          enablePlayer: true,
          enableCursor: true,
          soundFont: soundFontUrl,
          scrollMode: 1,
        },
        display: { staveProfile: staveProfile ?? 1 },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      api.scoreLoaded.on((score: any) => {
        onScoreLoadedRef.current?.(score)
        setIsLoaded(true)
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      api.playerStateChanged.on((args: any) => {
        if (args.stopped) setPlaybackState('stopped')
        else if (args.state === 1) setPlaybackState('playing')
        else setPlaybackState('paused')
      })

      api.load(fileUrl)
      apiRef.current = api
    }

    init().catch(console.error)

    return () => {
      destroyed = true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const api = apiRef.current as any
      if (api?.destroy) api.destroy()
      apiRef.current = null
      setIsLoaded(false)
      setPlaybackState('stopped')
    }
  }, [containerRef, fileUrl])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = apiRef.current as any
    if (!api || staveProfile === undefined) return
    api.settings.display.staveProfile = staveProfile
    api.updateSettings()
    api.render()
  }, [staveProfile])

  // Memoize so handle reference only changes when reactive state changes.
  // Callbacks use apiRef (not captured api variable) to always reach current instance.
  return useMemo(() => ({
    api: apiRef.current,
    isLoaded,
    playbackState,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    play: () => (apiRef.current as any)?.play?.(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pause: () => (apiRef.current as any)?.pause?.(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stop: () => (apiRef.current as any)?.stop?.(),
    setSpeed: (ratio: number) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (apiRef.current) (apiRef.current as any).playbackSpeed = ratio
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isLoaded, playbackState])
}
