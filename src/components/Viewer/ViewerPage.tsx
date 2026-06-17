import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSongs } from '../../api'
import type { Song } from '../../types'
import type { AlphaTabHandle, PlaybackState } from '../../hooks/useAlphaTab'
import AlphaTabWrapper from './AlphaTabWrapper'
import PlaybackControls from './PlaybackControls'
import NotationToggle from './NotationToggle'
import Metronome from './Metronome'
import LoopControl from './LoopControl'
import SectionJumper from './SectionJumper'
import ProgressPanel from '../Progress/ProgressPanel'

interface Section { name: string; tick: number }

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>()
  const [song, setSong] = useState<Song | null>(null)
  const [songError, setSongError] = useState<string | null>(null)
  const [speed, setSpeed] = useState(1)
  const [staveProfile, setStaveProfile] = useState<number>(() => {
    const saved = localStorage.getItem('jamlog_notation_profile')
    const n = Number(saved)
    return [1, 2, 3].includes(n) ? n : 1
  })

  // Reactive alphaTab state — updated via onHandleChange each time handle changes
  const [isLoaded, setIsLoaded] = useState(false)
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped')

  // Score-derived state — populated by onScoreLoaded
  const [sections, setSections] = useState<Section[]>([])
  const [metronomeBpm, setMetronomeBpm] = useState(120)
  const [metronomeOn, setMetronomeOn] = useState(false)
  const [loopEnabled, setLoopEnabled] = useState(false)
  const [loopStart, setLoopStart] = useState(1)
  const [loopEnd, setLoopEnd] = useState(4)
  const [totalBars, setTotalBars] = useState(4)

  const handleRef = useRef<AlphaTabHandle | null>(null)

  useEffect(() => {
    getSongs()
      .then(songs => {
        const found = songs.find(s => s.id === Number(id))
        if (!found) setSongError('Song not found')
        else setSong(found)
      })
      .catch(() => setSongError('Failed to load song'))
  }, [id])

  // Called by AlphaTabWrapper on every handle change (memoized — only on state changes)
  const onHandleChange = useCallback((h: AlphaTabHandle) => {
    handleRef.current = h
    setIsLoaded(h.isLoaded)
    setPlaybackState(h.playbackState)
  }, [])

  // Called once when the score finishes loading
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onScoreLoaded = useCallback((score: any) => {
    if (score?.tempo) setMetronomeBpm(score.tempo)
    if (score?.masterBars?.length) {
      setTotalBars(score.masterBars.length)
      setLoopEnd(Math.min(4, score.masterBars.length))
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const secs: Section[] = (score?.masterBars ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((mb: any) => mb.section != null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((mb: any) => ({ name: mb.section.text as string, tick: mb.start as number }))
    setSections(secs)
  }, [])

  const handleSpeed = (v: number) => {
    setSpeed(v)
    handleRef.current?.setSpeed(v)
  }

  const handleNotationChange = (v: number) => {
    setStaveProfile(v)
    localStorage.setItem('jamlog_notation_profile', String(v))
  }

  const handleJump = (tick: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = handleRef.current?.api as any
    if (api) api.tickPosition = tick
  }

  // Sync loop range to alphaTab whenever it changes
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = handleRef.current?.api as any
    if (!api) return
    if (loopEnabled) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bars: any[] | undefined = api.score?.masterBars
      if (!bars) return
      const startMasterBar = bars[loopStart - 1]
      const endMasterBar = bars[loopEnd - 1]
      if (startMasterBar && endMasterBar) {
        api.playbackRange = {
          startTick: startMasterBar.start,
          endTick: endMasterBar.start + endMasterBar.calculateDuration(),
        }
      }
    } else {
      api.playbackRange = null
    }
  }, [loopEnabled, loopStart, loopEnd, isLoaded])

  if (songError) return <p className="p-8 text-red-400">{songError}</p>
  if (!song) return <p className="p-8 text-gray-500">Loading…</p>

  const fileUrl = `/uploads/${song.filename}`

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/library" className="text-gray-400 hover:text-white text-sm">← Library</Link>
        <h1 className="text-xl font-bold">{song.title}</h1>
      </div>
      <div className="grid grid-cols-[1fr_300px] gap-6">
        <div className="space-y-3">
          <PlaybackControls
            state={playbackState}
            isLoaded={isLoaded}
            speed={speed}
            onPlay={() => handleRef.current?.play()}
            onPause={() => handleRef.current?.pause()}
            onStop={() => handleRef.current?.stop()}
            onSpeedChange={handleSpeed}
          />
          <NotationToggle
            value={staveProfile}
            isLoaded={isLoaded}
            onChange={handleNotationChange}
          />
          <Metronome bpm={metronomeBpm} enabled={metronomeOn} onToggle={() => setMetronomeOn(v => !v)} />
          <SectionJumper sections={sections} isLoaded={isLoaded} onJump={handleJump} />
          <LoopControl
            maxBar={totalBars}
            enabled={loopEnabled}
            startBar={loopStart}
            endBar={loopEnd}
            isLoaded={isLoaded}
            onToggle={() => setLoopEnabled(v => !v)}
            onChange={(s, e) => { setLoopStart(s); setLoopEnd(e) }}
          />
          <AlphaTabWrapper
            fileUrl={fileUrl}
            staveProfile={staveProfile}
            onScoreLoaded={onScoreLoaded}
            onHandleChange={onHandleChange}
          />
        </div>
        <div>
          <ProgressPanel songId={Number(id)} />
        </div>
      </div>
    </div>
  )
}
