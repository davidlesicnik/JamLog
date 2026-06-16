# JamLog MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build JamLog, a self-hosted web app for guitar learners to import Guitar Pro files, view/play tablature, and track practice progress.

**Architecture:** React SPA (Vite) with alphaTab for Guitar Pro parsing, rendering and playback. SQLite via better-sqlite3 with an Express API layer for song metadata and progress. File uploads stored on disk; no external services.

**Tech Stack:** Node 20+, Vite + React 18, TypeScript, Express 4, better-sqlite3, @coderline/alphatab 1.x, Tailwind CSS 3.

**User decisions (already made):**
- Self-hosted (no cloud dependency)
- Guitar Pro files: .gp3, .gp4, .gp5 (gpx optional / best-effort)
- Playback speeds: 50%, 75%, 100%
- Progress statuses: Not Started / Learning / Comfortable / Mastered

---

## File Structure

```
jamlog/
├── server/
│   ├── index.ts            # Express entry point, middleware
│   ├── db.ts               # SQLite connection + schema migrations
│   ├── routes/
│   │   ├── songs.ts        # CRUD for songs (upload, list, delete)
│   │   └── progress.ts     # CRUD for progress records
│   └── uploads/            # GP file storage (git-ignored)
├── src/
│   ├── main.tsx            # React entry
│   ├── App.tsx             # Router root
│   ├── api.ts              # fetch wrappers to Express API
│   ├── types.ts            # shared TS interfaces (Song, Progress)
│   ├── components/
│   │   ├── Library/
│   │   │   ├── LibraryPage.tsx      # list + search + filter
│   │   │   ├── SongCard.tsx         # song row with favorite toggle
│   │   │   └── UploadZone.tsx       # drag-drop / file input
│   │   ├── Viewer/
│   │   │   ├── ViewerPage.tsx       # orchestrates alphaTab + controls
│   │   │   ├── AlphaTabWrapper.tsx  # mounts AlphaTabApi, exposes ref
│   │   │   ├── PlaybackControls.tsx # play/pause/stop + speed select
│   │   │   ├── Metronome.tsx        # Web Audio API metronome
│   │   │   ├── LoopControl.tsx      # bar range selector + toggle
│   │   │   └── SectionJumper.tsx    # section bookmark dropdown
│   │   └── Progress/
│   │       └── ProgressPanel.tsx    # status, BPM, notes, last-practiced
│   └── hooks/
│       └── useAlphaTab.ts  # alphaTab event subscriptions
├── vite.config.ts
├── tsconfig.json
├── package.json
└── server/tsconfig.json
```

---

## Task 0: Project Scaffold

**Goal:** Initialize monorepo structure with Vite+React+TS frontend and Express+TS backend sharing one `package.json`.

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `server/tsconfig.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `index.html`
- Create: `.gitignore`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/index.css`

**Acceptance Criteria:**
- [ ] `npm run dev` starts Vite dev server on port 5173 with React app rendering "JamLog"
- [ ] `npm run server` starts Express on port 3001 with `GET /healthz` → `{"ok":true}`
- [ ] TypeScript has zero errors on both sides
- [ ] Tailwind styles apply

**Verify:** `curl http://localhost:3001/healthz` → `{"ok":true}`

**Steps:**

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "jamlog",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json && vite build",
    "preview": "vite preview",
    "server": "tsx watch server/index.ts",
    "server:prod": "tsx server/index.ts"
  },
  "dependencies": {
    "@coderline/alphatab": "^1.8.1",
    "better-sqlite3": "^9.6.0",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "multer": "^1.4.5-lts.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.11",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "tsx": "^4.16.0",
    "typescript": "^5.5.2",
    "vite": "^5.3.1"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

alphaTab ships worker scripts that must be copied to the output dir. Use `vite-plugin-static-copy` or a manual `assetsInclude`. The simplest approach that works reliably:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
  optimizeDeps: {
    exclude: ['@coderline/alphatab'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          alphatab: ['@coderline/alphatab'],
        },
      },
    },
  },
})
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist-server",
    "esModuleInterop": true
  },
  "include": ["server"]
}
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JamLog</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 7: Create `postcss.config.js`**

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

- [ ] **Step 8: Create `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 9: Create `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

- [ ] **Step 10: Create `src/App.tsx`**

```tsx
import { Routes, Route, Link } from 'react-router-dom'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="flex gap-4 p-4 bg-gray-900 border-b border-gray-800">
        <Link to="/" className="text-xl font-bold text-indigo-400">JamLog</Link>
        <Link to="/library" className="hover:text-white">Library</Link>
      </nav>
      <Routes>
        <Route path="/" element={<p className="p-8">Welcome to JamLog</p>} />
        <Route path="/library" element={<p className="p-8">Library coming soon</p>} />
      </Routes>
    </div>
  )
}
```

- [ ] **Step 11: Create `server/index.ts`**

```ts
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/healthz', (_req, res) => res.json({ ok: true }))

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, () => console.log(`Server on ${PORT}`))

export { app }
```

- [ ] **Step 12: Create `.gitignore`**

```
node_modules/
dist/
dist-server/
server/uploads/
*.db
.env
```

- [ ] **Step 13: Run `npm install` and verify `npm run dev` shows JamLog in browser**

---

## Task 1: Database Schema + Song API

**Goal:** SQLite schema for `songs` and `progress` tables plus Express REST routes for listing, uploading, favoriting, and deleting songs.

**Files:**
- Create: `server/db.ts`
- Create: `server/routes/songs.ts`
- Modify: `server/index.ts`

**Acceptance Criteria:**
- [ ] `POST /api/songs/upload` accepts a `.gp*` multipart file, stores it in `server/uploads/`, inserts row, returns `{ id, title, filename }`
- [ ] `GET /api/songs` returns array of all songs with `id, title, filename, favorite, createdAt`
- [ ] `PATCH /api/songs/:id/favorite` toggles `favorite` boolean, returns updated song
- [ ] `DELETE /api/songs/:id` removes file and DB row
- [ ] DB file created at `./jamlog.db` on first run

**Verify:** 
```bash
curl -s -X POST http://localhost:3001/api/songs/upload \
  -F "file=@test.gp5" | python3 -m json.tool
# → {"id":1,"title":"test","filename":"..."}
```

**Steps:**

- [ ] **Step 1: Create `server/db.ts`**

```ts
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new Database(path.join(__dirname, '..', 'jamlog.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS songs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    title     TEXT NOT NULL,
    filename  TEXT NOT NULL UNIQUE,
    favorite  INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS progress (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    songId       INTEGER NOT NULL UNIQUE REFERENCES songs(id) ON DELETE CASCADE,
    status       TEXT NOT NULL DEFAULT 'not_started',
    bpm          INTEGER,
    notes        TEXT,
    lastPracticed TEXT,
    updatedAt    TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

export default db
```

- [ ] **Step 2: Create `server/routes/songs.ts`**

```ts
import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import db from '../db.js'

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
  const songs = db.prepare('SELECT * FROM songs ORDER BY createdAt DESC').all()
  res.json(songs)
})

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No valid GP file uploaded' })
    return
  }
  const title = path.basename(req.file.originalname, path.extname(req.file.originalname))
  const row = db
    .prepare('INSERT INTO songs (title, filename) VALUES (?, ?) RETURNING *')
    .get(title, req.file.filename) as { id: number; title: string; filename: string }
  res.status(201).json(row)
})

router.patch('/:id/favorite', (req, res) => {
  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id) as
    | { id: number; favorite: number }
    | undefined
  if (!song) { res.status(404).json({ error: 'Not found' }); return }
  const updated = db
    .prepare('UPDATE songs SET favorite = ? WHERE id = ? RETURNING *')
    .get(song.favorite ? 0 : 1, song.id)
  res.json(updated)
})

router.delete('/:id', (req, res) => {
  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id) as
    | { id: number; filename: string }
    | undefined
  if (!song) { res.status(404).json({ error: 'Not found' }); return }
  const filePath = path.join(uploadDir, song.filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  db.prepare('DELETE FROM songs WHERE id = ?').run(song.id)
  res.status(204).end()
})

export default router
```

- [ ] **Step 3: Wire routes into `server/index.ts`**

Add after the existing imports and before `app.get('/healthz'...)`:
```ts
import songsRouter from './routes/songs.js'
// ...
app.use('/api/songs', songsRouter)
```

---

## Task 2: Progress API

**Goal:** Express routes to get/upsert progress for a song (status, BPM, notes, last-practiced date).

**Files:**
- Create: `server/routes/progress.ts`
- Modify: `server/index.ts`

**Acceptance Criteria:**
- [ ] `GET /api/progress/:songId` returns progress row or `{ status: 'not_started', bpm: null, notes: null, lastPracticed: null }` when none exists
- [ ] `PUT /api/progress/:songId` upserts all fields, sets `updatedAt` and `lastPracticed` to now, returns full row
- [ ] 404 when songId doesn't exist in songs table

**Verify:**
```bash
curl -s -X PUT http://localhost:3001/api/progress/1 \
  -H 'Content-Type: application/json' \
  -d '{"status":"learning","bpm":80,"notes":"bridge is hard"}' \
  | python3 -m json.tool
# → {"id":1,"songId":1,"status":"learning","bpm":80,...}
```

**Steps:**

- [ ] **Step 1: Create `server/routes/progress.ts`**

```ts
import { Router } from 'express'
import db from '../db.js'

const router = Router()

const empty = { status: 'not_started', bpm: null, notes: null, lastPracticed: null }

router.get('/:songId', (req, res) => {
  const song = db.prepare('SELECT id FROM songs WHERE id = ?').get(req.params.songId)
  if (!song) { res.status(404).json({ error: 'Song not found' }); return }
  const row = db.prepare('SELECT * FROM progress WHERE songId = ?').get(req.params.songId)
  res.json(row ?? { songId: Number(req.params.songId), ...empty })
})

router.put('/:songId', (req, res) => {
  const song = db.prepare('SELECT id FROM songs WHERE id = ?').get(req.params.songId)
  if (!song) { res.status(404).json({ error: 'Song not found' }); return }

  const { status = 'not_started', bpm = null, notes = null } = req.body as {
    status?: string; bpm?: number | null; notes?: string | null
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
  `).get({ songId: Number(req.params.songId), status, bpm, notes, now })

  res.json(row)
})

export default router
```

- [ ] **Step 2: Wire into `server/index.ts`**

```ts
import progressRouter from './routes/progress.js'
// after existing app.use lines:
app.use('/api/progress', progressRouter)
```

---

## Task 3: Shared Types + API Client

**Goal:** TypeScript interfaces matching DB shapes and typed `fetch` wrappers for all API calls.

**Files:**
- Create: `src/types.ts`
- Create: `src/api.ts`

**Acceptance Criteria:**
- [ ] `types.ts` exports `Song`, `Progress`, `ProgressStatus` matching DB columns
- [ ] `api.ts` exports `getSongs()`, `uploadSong(file)`, `toggleFavorite(id)`, `deleteSong(id)`, `getProgress(songId)`, `upsertProgress(songId, data)` — all returning typed promises
- [ ] TypeScript has zero errors

**Verify:** `npx tsc --noEmit` → no errors

**Steps:**

- [ ] **Step 1: Create `src/types.ts`**

```ts
export type ProgressStatus = 'not_started' | 'learning' | 'comfortable' | 'mastered'

export interface Song {
  id: number
  title: string
  filename: string
  favorite: number  // 0 | 1 (SQLite)
  createdAt: string
}

export interface Progress {
  id?: number
  songId: number
  status: ProgressStatus
  bpm: number | null
  notes: string | null
  lastPracticed: string | null
  updatedAt?: string
}
```

- [ ] **Step 2: Create `src/api.ts`**

```ts
import type { Song, Progress, ProgressStatus } from './types'

const BASE = '/api'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<T>
}

export const getSongs = () =>
  fetch(`${BASE}/songs`).then(json<Song[]>)

export const uploadSong = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return fetch(`${BASE}/songs/upload`, { method: 'POST', body: form }).then(json<Song>)
}

export const toggleFavorite = (id: number) =>
  fetch(`${BASE}/songs/${id}/favorite`, { method: 'PATCH' }).then(json<Song>)

export const deleteSong = (id: number) =>
  fetch(`${BASE}/songs/${id}`, { method: 'DELETE' }).then(res => {
    if (!res.ok) throw new Error('Delete failed')
  })

export const getProgress = (songId: number) =>
  fetch(`${BASE}/progress/${songId}`).then(json<Progress>)

export const upsertProgress = (songId: number, data: Partial<Pick<Progress, 'status' | 'bpm' | 'notes'>>) =>
  fetch(`${BASE}/progress/${songId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(json<Progress>)
```

---

## Task 4: Library Page

**Goal:** Library page with song list, search/filter, favorite toggle, delete, and file upload drop zone.

**Files:**
- Create: `src/components/Library/LibraryPage.tsx`
- Create: `src/components/Library/SongCard.tsx`
- Create: `src/components/Library/UploadZone.tsx`
- Modify: `src/App.tsx`

**Acceptance Criteria:**
- [ ] Library page shows all songs fetched from API
- [ ] Search input filters by title (client-side, case-insensitive)
- [ ] "Favorites only" toggle shows only favorited songs
- [ ] Clicking heart icon on song card toggles favorite (optimistic update)
- [ ] Clicking trash icon deletes song (with confirmation)
- [ ] Drag-dropping or clicking UploadZone uploads file, list refreshes after
- [ ] Clicking song title navigates to `/viewer/:id`

**Verify:** Manual test — upload a GP file, see it in list, toggle favorite, search for it, delete it.

**Steps:**

- [ ] **Step 1: Create `src/components/Library/UploadZone.tsx`**

```tsx
import { useRef, useState, DragEvent } from 'react'
import { uploadSong } from '../../api'

interface Props {
  onUploaded: () => void
}

export default function UploadZone({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setError(null)
    try {
      await Promise.all(Array.from(files).map(uploadSong))
      onUploaded()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handle(e.dataTransfer.files)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
        ${dragging ? 'border-indigo-400 bg-indigo-950' : 'border-gray-700 hover:border-gray-500'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".gp3,.gp4,.gp5,.gpx,.gp"
        multiple
        className="hidden"
        onChange={e => handle(e.target.files)}
      />
      {uploading ? (
        <p className="text-gray-400">Uploading…</p>
      ) : (
        <p className="text-gray-400">Drop Guitar Pro files here or click to browse</p>
      )}
      {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/Library/SongCard.tsx`**

```tsx
import { Link } from 'react-router-dom'
import type { Song } from '../../types'

interface Props {
  song: Song
  onFavorite: (id: number) => void
  onDelete: (id: number) => void
}

export default function SongCard({ song, onFavorite, onDelete }: Props) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg hover:bg-gray-850 transition-colors">
      <Link to={`/viewer/${song.id}`} className="flex-1 min-w-0">
        <p className="font-medium truncate hover:text-indigo-300">{song.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{new Date(song.createdAt).toLocaleDateString()}</p>
      </Link>
      <div className="flex gap-3 ml-4 shrink-0">
        <button
          onClick={() => onFavorite(song.id)}
          className={`text-xl transition-colors ${song.favorite ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
          aria-label="Toggle favorite"
        >
          {song.favorite ? '★' : '☆'}
        </button>
        <button
          onClick={() => { if (window.confirm(`Delete "${song.title}"?`)) onDelete(song.id) }}
          className="text-gray-600 hover:text-red-400 transition-colors"
          aria-label="Delete song"
        >
          🗑
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/Library/LibraryPage.tsx`**

```tsx
import { useEffect, useState, useCallback } from 'react'
import { getSongs, toggleFavorite, deleteSong } from '../../api'
import type { Song } from '../../types'
import SongCard from './SongCard'
import UploadZone from './UploadZone'

export default function LibraryPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [query, setQuery] = useState('')
  const [favOnly, setFavOnly] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { setSongs(await getSongs()) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleFavorite = async (id: number) => {
    setSongs(prev => prev.map(s => s.id === id ? { ...s, favorite: s.favorite ? 0 : 1 } : s))
    await toggleFavorite(id)
  }

  const handleDelete = async (id: number) => {
    setSongs(prev => prev.filter(s => s.id !== id))
    await deleteSong(id)
  }

  const visible = songs
    .filter(s => s.title.toLowerCase().includes(query.toLowerCase()))
    .filter(s => !favOnly || s.favorite)

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Library</h1>
      <UploadZone onUploaded={load} />
      <div className="flex gap-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search songs…"
          className="flex-1 bg-gray-800 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => setFavOnly(v => !v)}
          className={`px-4 py-2 rounded-lg text-sm transition-colors
            ${favOnly ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          ★ Favorites
        </button>
      </div>
      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-gray-500">No songs found.</p>
      ) : (
        <div className="space-y-2">
          {visible.map(s => (
            <SongCard key={s.id} song={s} onFavorite={handleFavorite} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Update `src/App.tsx` to use LibraryPage**

```tsx
import { Routes, Route, Link } from 'react-router-dom'
import LibraryPage from './components/Library/LibraryPage'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="flex gap-4 p-4 bg-gray-900 border-b border-gray-800 items-center">
        <Link to="/" className="text-xl font-bold text-indigo-400">JamLog</Link>
        <Link to="/library" className="hover:text-white text-sm">Library</Link>
      </nav>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/viewer/:id" element={<p className="p-8 text-gray-400">Viewer coming soon</p>} />
      </Routes>
    </div>
  )
}
```

---

## Task 5: AlphaTab Wrapper + Song Viewer Shell

**Goal:** Viewer page that loads a GP file via alphaTab, renders tablature, and provides play/pause/stop with speed selection.

**Files:**
- Create: `src/components/Viewer/AlphaTabWrapper.tsx`
- Create: `src/hooks/useAlphaTab.ts`
- Create: `src/components/Viewer/PlaybackControls.tsx`
- Create: `src/components/Viewer/ViewerPage.tsx`
- Modify: `src/App.tsx`

**Acceptance Criteria:**
- [ ] Navigating to `/viewer/:id` loads the GP file via alphaTab
- [ ] Score renders in the browser (tablature visible)
- [ ] Play, Pause, Stop buttons work
- [ ] Speed selector (50%, 75%, 100%) adjusts playback tempo
- [ ] Loading state shown while score loads

**Verify:** Manual test — upload a real GP5 file, navigate to viewer, confirm tabs render, press play.

**Steps:**

- [ ] **Step 1: Create `src/hooks/useAlphaTab.ts`**

```ts
import { useEffect, useRef, useState } from 'react'
import type * as AT from '@coderline/alphatab'

export type PlaybackState = 'stopped' | 'playing' | 'paused'

export interface AlphaTabHandle {
  api: AT.AlphaTabApi | null
  isLoaded: boolean
  playbackState: PlaybackState
  play: () => void
  pause: () => void
  stop: () => void
  setSpeed: (ratio: number) => void
}

export function useAlphaTab(
  containerRef: React.RefObject<HTMLDivElement>,
  fileUrl: string | null
): AlphaTabHandle {
  const apiRef = useRef<AT.AlphaTabApi | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped')

  useEffect(() => {
    if (!containerRef.current || !fileUrl) return
    let destroyed = false

    const init = async () => {
      const { AlphaTabApi } = await import('@coderline/alphatab')
      if (destroyed) return

      const api = new AlphaTabApi(containerRef.current!, {
        core: {
          // Tell alphaTab where to find its worker scripts.
          // In Vite dev, node_modules is accessible; in prod, copy them to public/.
          workerScript: new URL(
            '../../node_modules/@coderline/alphatab/dist/alphaTab.worker.js',
            import.meta.url
          ).href,
        },
        player: {
          enablePlayer: true,
          enableCursor: true,
          soundFont: new URL(
            '../../node_modules/@coderline/alphatab/dist/soundfont/sonivox.sf2',
            import.meta.url
          ).href,
          scrollMode: 1, // continuous
        },
        display: {
          staveProfile: 1, // tab only
        },
      })

      api.scoreLoaded.on(() => setIsLoaded(true))
      api.playerStateChanged.on(e => {
        if (e.stopped) setPlaybackState('stopped')
        else if (e.state === 1) setPlaybackState('playing')
        else setPlaybackState('paused')
      })

      api.load(fileUrl)
      apiRef.current = api
    }

    init()

    return () => {
      destroyed = true
      apiRef.current?.destroy()
      apiRef.current = null
      setIsLoaded(false)
      setPlaybackState('stopped')
    }
  }, [containerRef, fileUrl])

  return {
    api: apiRef.current,
    isLoaded,
    playbackState,
    play: () => apiRef.current?.play(),
    pause: () => apiRef.current?.pause(),
    stop: () => apiRef.current?.stop(),
    setSpeed: (ratio: number) => {
      if (apiRef.current) apiRef.current.playbackSpeed = ratio
    },
  }
}
```

- [ ] **Step 2: Create `src/components/Viewer/PlaybackControls.tsx`**

```tsx
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

export default function PlaybackControls({ state, isLoaded, speed, onPlay, onPause, onStop, onSpeedChange }: Props) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-xl">
      {state === 'playing' ? (
        <button onClick={onPause} disabled={!isLoaded}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-sm font-medium">
          ⏸ Pause
        </button>
      ) : (
        <button onClick={onPlay} disabled={!isLoaded}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-sm font-medium">
          ▶ Play
        </button>
      )}
      <button onClick={onStop} disabled={!isLoaded}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded-lg text-sm font-medium">
        ⏹ Stop
      </button>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-gray-400">Speed</span>
        {[0.5, 0.75, 1].map(v => (
          <button key={v}
            onClick={() => onSpeedChange(v)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${speed === v ? 'bg-indigo-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            {v === 1 ? '100%' : `${v * 100}%`}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/Viewer/AlphaTabWrapper.tsx`**

```tsx
import { useRef } from 'react'
import { useAlphaTab, type AlphaTabHandle } from '../../hooks/useAlphaTab'

interface Props {
  fileUrl: string | null
  onReady: (handle: AlphaTabHandle) => void
}

export default function AlphaTabWrapper({ fileUrl, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const handle = useAlphaTab(containerRef, fileUrl)

  // Notify parent whenever handle changes
  // (parent caches via ref so no render loop)
  onReady(handle)

  return (
    <div className="relative">
      {!handle.isLoaded && fileUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 z-10">
          <p className="text-gray-400">Loading score…</p>
        </div>
      )}
      <div ref={containerRef} className="at-main bg-white rounded-lg" />
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/Viewer/ViewerPage.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSongs } from '../../api'
import type { Song } from '../../types'
import type { AlphaTabHandle } from '../../hooks/useAlphaTab'
import AlphaTabWrapper from './AlphaTabWrapper'
import PlaybackControls from './PlaybackControls'

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>()
  const [song, setSong] = useState<Song | null>(null)
  const [speed, setSpeed] = useState(1)
  const handleRef = useRef<AlphaTabHandle | null>(null)

  useEffect(() => {
    getSongs().then(songs => setSong(songs.find(s => s.id === Number(id)) ?? null))
  }, [id])

  const onReady = (h: AlphaTabHandle) => { handleRef.current = h }

  const handleSpeed = (v: number) => {
    setSpeed(v)
    handleRef.current?.setSpeed(v)
  }

  if (!song) return <p className="p-8 text-gray-500">Loading…</p>

  const fileUrl = `/uploads/${song.filename}`

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/library" className="text-gray-400 hover:text-white text-sm">← Library</Link>
        <h1 className="text-xl font-bold">{song.title}</h1>
      </div>
      <PlaybackControls
        state={handleRef.current?.playbackState ?? 'stopped'}
        isLoaded={handleRef.current?.isLoaded ?? false}
        speed={speed}
        onPlay={() => handleRef.current?.play()}
        onPause={() => handleRef.current?.pause()}
        onStop={() => handleRef.current?.stop()}
        onSpeedChange={handleSpeed}
      />
      <AlphaTabWrapper fileUrl={fileUrl} onReady={onReady} />
    </div>
  )
}
```

- [ ] **Step 5: Update `src/App.tsx`**

```tsx
import { Routes, Route, Link } from 'react-router-dom'
import LibraryPage from './components/Library/LibraryPage'
import ViewerPage from './components/Viewer/ViewerPage'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="flex gap-4 p-4 bg-gray-900 border-b border-gray-800 items-center">
        <Link to="/" className="text-xl font-bold text-indigo-400">JamLog</Link>
        <Link to="/library" className="hover:text-white text-sm">Library</Link>
      </nav>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/viewer/:id" element={<ViewerPage />} />
      </Routes>
    </div>
  )
}
```

---

## Task 6: Metronome

**Goal:** Web Audio API metronome component with BPM display (synced to score tempo), independent enable/disable toggle.

**Files:**
- Create: `src/components/Viewer/Metronome.tsx`
- Modify: `src/components/Viewer/ViewerPage.tsx`

**Acceptance Criteria:**
- [ ] Metronome click audible when enabled, silent when disabled
- [ ] BPM reflects score tempo (from alphaTab `settings.player.metronomeVolume` and `scoreLoaded` event)
- [ ] Metronome keeps clicking even when playback is stopped (useful for practice without playback)
- [ ] Clean shutdown — AudioContext closed when component unmounts

**Verify:** Manual test — enable metronome, hear click at correct tempo, disable, silence.

**Steps:**

- [ ] **Step 1: Create `src/components/Viewer/Metronome.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'

interface Props {
  bpm: number
  enabled: boolean
  onToggle: () => void
}

function scheduleClick(ctx: AudioContext, time: number, vol: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = 1000
  gain.gain.setValueAtTime(vol, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
  osc.start(time)
  osc.stop(time + 0.05)
}

export default function Metronome({ bpm, enabled, onToggle }: Props) {
  const ctxRef = useRef<AudioContext | null>(null)
  const nextTickRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    if (!ctxRef.current) ctxRef.current = new AudioContext()
    const ctx = ctxRef.current
    nextTickRef.current = ctx.currentTime + 0.1
    const interval = 60 / bpm

    const tick = () => {
      while (nextTickRef.current < ctx.currentTime + 0.2) {
        scheduleClick(ctx, nextTickRef.current, 0.8)
        nextTickRef.current += interval
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafRef.current)
  }, [enabled, bpm])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      ctxRef.current?.close()
    }
  }, [])

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-xl">
      <button
        onClick={onToggle}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
          ${enabled ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
      >
        🥁 Metronome
      </button>
      <span className="text-sm text-gray-400">{bpm} BPM</span>
    </div>
  )
}
```

- [ ] **Step 2: Add metronome state + BPM to `ViewerPage.tsx`**

Add to ViewerPage state:
```tsx
const [metronomeBpm, setMetronomeBpm] = useState(120)
const [metronomeOn, setMetronomeOn] = useState(false)
```

In the `onReady` callback, after setting handleRef, subscribe to `scoreLoaded`:
```tsx
const onReady = (h: AlphaTabHandle) => {
  handleRef.current = h
  if (h.api) {
    h.api.scoreLoaded.on(score => {
      setMetronomeBpm(score.tempo)
    })
  }
}
```

Add `<Metronome>` below `<PlaybackControls>`:
```tsx
import Metronome from './Metronome'
// ...
<Metronome bpm={metronomeBpm} enabled={metronomeOn} onToggle={() => setMetronomeOn(v => !v)} />
```

---

## Task 7: Loop Control

**Goal:** Loop a user-selected bar range — input for start bar, end bar, and enable/disable toggle.

**Files:**
- Create: `src/components/Viewer/LoopControl.tsx`
- Modify: `src/components/Viewer/ViewerPage.tsx`

**Acceptance Criteria:**
- [ ] Loop start/end bar number inputs visible in Viewer
- [ ] When loop enabled, alphaTab `playbackRange` set to corresponding ticks
- [ ] When loop disabled, `playbackRange` cleared (null)
- [ ] Inputs disabled when score not loaded

**Verify:** Manual test — set loop bars 1–4, enable, press play, confirm playback loops over those bars.

**Steps:**

- [ ] **Step 1: Create `src/components/Viewer/LoopControl.tsx`**

alphaTab uses `playbackRange` with `{ startTick, endTick }` where tick values come from `masterBars`. Each masterBar has a `start` (tick position) and `calculateDuration()` for length.

```tsx
interface Props {
  maxBar: number
  enabled: boolean
  startBar: number
  endBar: number
  isLoaded: boolean
  onToggle: () => void
  onChange: (start: number, end: number) => void
}

export default function LoopControl({ maxBar, enabled, startBar, endBar, isLoaded, onToggle, onChange }: Props) {
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
          onChange={e => onChange(Number(e.target.value), endBar)}
          className="w-16 bg-gray-800 rounded px-2 py-1 text-center disabled:opacity-40"
        />
        <span className="text-gray-500">–</span>
        <input
          type="number"
          min={startBar}
          max={maxBar}
          value={endBar}
          disabled={!isLoaded}
          onChange={e => onChange(startBar, Number(e.target.value))}
          className="w-16 bg-gray-800 rounded px-2 py-1 text-center disabled:opacity-40"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add loop state + logic to `ViewerPage.tsx`**

```tsx
import LoopControl from './LoopControl'

// State:
const [loopEnabled, setLoopEnabled] = useState(false)
const [loopStart, setLoopStart] = useState(1)
const [loopEnd, setLoopEnd] = useState(4)
const [totalBars, setTotalBars] = useState(4)

// Inside onReady, extend the scoreLoaded handler:
h.api.scoreLoaded.on(score => {
  setMetronomeBpm(score.tempo)
  setTotalBars(score.masterBars.length)
  setLoopEnd(Math.min(4, score.masterBars.length))
})

// Loop toggle effect — run when loopEnabled / start / end change:
useEffect(() => {
  const api = handleRef.current?.api
  if (!api) return
  if (loopEnabled) {
    const bars = api.score?.masterBars
    if (!bars) return
    const startBar = bars[loopStart - 1]
    const endBar = bars[loopEnd - 1]
    if (startBar && endBar) {
      api.playbackRange = {
        startTick: startBar.start,
        endTick: endBar.start + endBar.calculateDuration(),
      }
    }
  } else {
    api.playbackRange = null
  }
}, [loopEnabled, loopStart, loopEnd])

// JSX:
<LoopControl
  maxBar={totalBars}
  enabled={loopEnabled}
  startBar={loopStart}
  endBar={loopEnd}
  isLoaded={handleRef.current?.isLoaded ?? false}
  onToggle={() => setLoopEnabled(v => !v)}
  onChange={(s, e) => { setLoopStart(s); setLoopEnd(e) }}
/>
```

---

## Task 8: Section Jumper

**Goal:** Dropdown listing named sections from the score; selecting one seeks playback to that bar.

**Files:**
- Create: `src/components/Viewer/SectionJumper.tsx`
- Modify: `src/components/Viewer/ViewerPage.tsx`

**Acceptance Criteria:**
- [ ] Dropdown visible in Viewer when score has ≥1 named section
- [ ] Hidden (or shows "No sections" disabled state) when score has no sections
- [ ] Selecting a section seeks alphaTab cursor to that bar's tick position

**Verify:** Manual test on a GP file with named sections — dropdown shows section names, selecting jumps to the section.

**Steps:**

- [ ] **Step 1: Create `src/components/Viewer/SectionJumper.tsx`**

```tsx
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
```

- [ ] **Step 2: Add sections state to `ViewerPage.tsx`**

```tsx
import SectionJumper from './SectionJumper'

interface Section { name: string; tick: number }
const [sections, setSections] = useState<Section[]>([])

// Inside onReady scoreLoaded handler:
h.api.scoreLoaded.on(score => {
  // existing lines...
  const secs: Section[] = score.masterBars
    .filter(mb => mb.section != null)
    .map(mb => ({ name: mb.section!.text, tick: mb.start }))
  setSections(secs)
})

const handleJump = (tick: number) => {
  if (handleRef.current?.api) {
    handleRef.current.api.tickPosition = tick
  }
}

// JSX:
<SectionJumper sections={sections} isLoaded={handleRef.current?.isLoaded ?? false} onJump={handleJump} />
```

---

## Task 9: Progress Panel

**Goal:** Side panel in Viewer to display and edit song progress (status, BPM, notes, last practiced).

**Files:**
- Create: `src/components/Progress/ProgressPanel.tsx`
- Modify: `src/components/Viewer/ViewerPage.tsx`

**Acceptance Criteria:**
- [ ] Panel shows current status, comfortable BPM, notes, last practiced date
- [ ] Status dropdown cycles through Not Started / Learning / Comfortable / Mastered
- [ ] BPM input (number), Notes textarea auto-save on blur
- [ ] "Mark practiced today" button sets `lastPracticed` to today via API
- [ ] Changes persist on page refresh

**Verify:** Manual test — change status to Learning, add BPM 90 and a note, refresh page, confirm values persisted.

**Steps:**

- [ ] **Step 1: Create `src/components/Progress/ProgressPanel.tsx`**

```tsx
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
    try {
      const updated = await upsertProgress(songId, { ...progress, ...patch })
      setProgress(updated)
    } finally {
      setSaving(false)
    }
  }

  const markPracticed = () => save({})

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

      <button
        onClick={markPracticed}
        disabled={saving}
        className="w-full py-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 rounded-lg text-sm font-medium"
      >
        ✓ Mark practiced today
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Add ProgressPanel to `ViewerPage.tsx`**

Change the return layout to a two-column grid:
```tsx
import ProgressPanel from '../Progress/ProgressPanel'

// Replace the single-column return with:
return (
  <div className="max-w-6xl mx-auto p-6">
    <div className="flex items-center gap-3 mb-4">
      <Link to="/library" className="text-gray-400 hover:text-white text-sm">← Library</Link>
      <h1 className="text-xl font-bold">{song.title}</h1>
    </div>
    <div className="grid grid-cols-[1fr_300px] gap-6">
      <div className="space-y-3">
        <PlaybackControls
          state={handleRef.current?.playbackState ?? 'stopped'}
          isLoaded={handleRef.current?.isLoaded ?? false}
          speed={speed}
          onPlay={() => handleRef.current?.play()}
          onPause={() => handleRef.current?.pause()}
          onStop={() => handleRef.current?.stop()}
          onSpeedChange={handleSpeed}
        />
        <div className="flex gap-3 flex-wrap">
          <Metronome bpm={metronomeBpm} enabled={metronomeOn} onToggle={() => setMetronomeOn(v => !v)} />
          <LoopControl
            maxBar={totalBars}
            enabled={loopEnabled}
            startBar={loopStart}
            endBar={loopEnd}
            isLoaded={handleRef.current?.isLoaded ?? false}
            onToggle={() => setLoopEnabled(v => !v)}
            onChange={(s, e) => { setLoopStart(s); setLoopEnd(e) }}
          />
        </div>
        {sections.length > 0 && (
          <SectionJumper sections={sections} isLoaded={handleRef.current?.isLoaded ?? false} onJump={handleJump} />
        )}
        <AlphaTabWrapper fileUrl={fileUrl} onReady={onReady} />
      </div>
      <div>
        <ProgressPanel songId={Number(id)} />
      </div>
    </div>
  </div>
)
```

---

## Task 10: Commit the Full Implementation

**Goal:** Stage and commit all changes as a single initial commit.

**Files:** All files created/modified in Tasks 0–9.

**Acceptance Criteria:**
- [ ] `git status` shows no uncommitted changes after commit
- [ ] Commit message follows conventional commits format

**Verify:** `git log --oneline -1` → commit visible

**Steps:**

- [ ] **Step 1: Stage all files**

```bash
git add .
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: initial JamLog MVP

Library with GP file upload, search, favorites.
Viewer with alphaTab rendering, playback, metronome, loop, section jump.
Progress tracking with status, BPM, notes."
```
