import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import db from '../db.js'

interface Song {
  id: number
  title: string
  filename: string
  favorite: number
  createdAt: string
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  },
})

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['.gp3', '.gp4', '.gp5', '.gpx', '.gp']
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  },
  limits: { fileSize: 50 * 1024 * 1024 },
})

const router = Router()

router.get('/', (_req, res) => {
  try {
    const songs = db.prepare('SELECT * FROM songs ORDER BY createdAt DESC').all()
    res.json(songs)
  } catch {
    res.status(500).json({ error: 'Internal error' })
  }
})

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No valid GP file uploaded' })
      return
    }
    const title = path.basename(req.file.originalname, path.extname(req.file.originalname))
    const row = db
      .prepare('INSERT INTO songs (title, filename) VALUES (?, ?) RETURNING *')
      .get(title, req.file.filename) as Song | undefined
    res.status(201).json(row)
  } catch {
    res.status(500).json({ error: 'Internal error' })
  }
})

router.patch('/:id/favorite', (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'Invalid id' })
      return
    }
    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(id) as Song | undefined
    if (!song) { res.status(404).json({ error: 'Not found' }); return }
    const updated = db
      .prepare('UPDATE songs SET favorite = ? WHERE id = ? RETURNING *')
      .get(song.favorite ? 0 : 1, song.id) as Song | undefined
    if (!updated) { res.status(500).json({ error: 'Internal error' }); return }
    res.json(updated)
  } catch {
    res.status(500).json({ error: 'Internal error' })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: 'Invalid id' })
      return
    }
    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(id) as Song | undefined
    if (!song) { res.status(404).json({ error: 'Not found' }); return }
    const filePath = path.join(uploadDir, song.filename)
    try {
      fs.unlinkSync(filePath)
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    }
    db.prepare('DELETE FROM songs WHERE id = ?').run(song.id)
    res.status(204).end()
  } catch {
    res.status(500).json({ error: 'Internal error' })
  }
})

export default router
