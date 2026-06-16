import { useEffect, useState } from 'react'
import { getProgress, upsertProgress } from '../../api'
import type { Progress, ProgressStatus } from '../../types'

const STATUS_LABELS: Record<ProgressStatus, string> = {
  not_started: 'Not Started',
  learning: 'Learning',
  comfortable: 'Comfortable',
  mastered: 'Mastered',
}

const STATUS_COLORS: Record<ProgressStatus, string> = {
  not_started: 'bg-gray-700',
  learning: 'bg-blue-700',
  comfortable: 'bg-yellow-700',
  mastered: 'bg-green-700',
}

interface Props { songId: number }

export default function ProgressPanel({ songId }: Props) {
  const [progress, setProgress] = useState<Progress | null>(null)
  const [notes, setNotes] = useState('')
  const [bpm, setBpm] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    getProgress(songId).then(p => {
      setProgress(p)
      setNotes(p.notes ?? '')
      setBpm(p.bpm != null ? String(p.bpm) : '')
    })
  }, [songId])

  const save = async (patch: Partial<Pick<Progress, 'status' | 'bpm' | 'notes'>>) => {
    if (!progress) return
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await upsertProgress(songId, {
        status: progress.status,
        bpm: progress.bpm,
        notes: progress.notes,
        ...patch,
      })
      setProgress(updated)
    } catch {
      setSaveError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!progress) return <div className="p-4 text-gray-500 text-sm">Loading…</div>

  return (
    <div className="bg-gray-900 rounded-xl p-4 space-y-4">
      <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wide">Progress</h2>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Status</label>
        <select
          value={progress.status}
          onChange={e => save({ status: e.target.value as ProgressStatus })}
          className={`w-full rounded-lg px-3 py-2 text-sm font-medium ${STATUS_COLORS[progress.status]}`}
        >
          {(Object.keys(STATUS_LABELS) as ProgressStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Comfortable BPM</label>
        <input
          type="number"
          value={bpm}
          onChange={e => setBpm(e.target.value)}
          onBlur={() => save({ bpm: bpm ? Number(bpm) : null })}
          placeholder="e.g. 90"
          className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => save({ notes: notes || null })}
          rows={4}
          placeholder="What needs work…"
          className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm resize-none"
        />
      </div>

      {progress.lastPracticed && (
        <p className="text-xs text-gray-500">
          Last practiced: {new Date(progress.lastPracticed).toLocaleDateString()}
        </p>
      )}

      {saveError && <p className="text-red-400 text-xs">{saveError}</p>}

      <button
        onClick={() => save({ bpm: bpm ? Number(bpm) : null, notes: notes || null })}
        disabled={saving}
        className="w-full py-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 rounded-lg text-sm font-medium"
      >
        ✓ Mark practiced today
      </button>
    </div>
  )
}
