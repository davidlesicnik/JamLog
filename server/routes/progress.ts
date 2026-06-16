import { Router } from 'express'
import db from '../db.js'

const router = Router()

const empty = { status: 'not_started', bpm: null, notes: null, lastPracticed: null }

router.get('/:songId', (req, res) => {
  try {
    const songId = Number(req.params.songId)
    if (!Number.isInteger(songId) || songId < 1) {
      res.status(400).json({ error: 'Invalid songId' })
      return
    }
    const song = db.prepare('SELECT id FROM songs WHERE id = ?').get(songId)
    if (!song) { res.status(404).json({ error: 'Song not found' }); return }
    const row = db.prepare('SELECT * FROM progress WHERE songId = ?').get(songId)
    res.json(row ?? { songId, ...empty })
  } catch {
    res.status(500).json({ error: 'Internal error' })
  }
})

router.put('/:songId', (req, res) => {
  try {
    const songId = Number(req.params.songId)
    if (!Number.isInteger(songId) || songId < 1) {
      res.status(400).json({ error: 'Invalid songId' })
      return
    }
    const song = db.prepare('SELECT id FROM songs WHERE id = ?').get(songId)
    if (!song) { res.status(404).json({ error: 'Song not found' }); return }

    const { status = 'not_started', bpm = null, notes = null } = req.body as {
      status?: string; bpm?: number | null; notes?: string | null
    }
    const VALID_STATUSES = ['not_started', 'learning', 'comfortable', 'mastered']
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid status' })
      return
    }
    const now = new Date().toISOString()

    const row = db.prepare(`
      INSERT INTO progress (songId, status, bpm, notes, lastPracticed, updatedAt)
      VALUES (@songId, @status, @bpm, @notes, @now, @now)
      ON CONFLICT(songId) DO UPDATE SET
        status = excluded.status,
        bpm = excluded.bpm,
        notes = excluded.notes,
        lastPracticed = excluded.lastPracticed,
        updatedAt = excluded.updatedAt
      RETURNING *
    `).get({ songId, status, bpm, notes, now })

    res.json(row)
  } catch {
    res.status(500).json({ error: 'Internal error' })
  }
})

export default router
