# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (run both concurrently)
npm run dev        # Frontend: Vite dev server → http://localhost:5173
npm run server     # Backend: tsx watch → http://localhost:3001

# Production
npm run build      # tsc + vite build → dist/
npm run server:prod

# Install
npm install
```

No test suite exists yet.

## Architecture

Full-stack TypeScript app: React frontend + Express backend + SQLite.

**Frontend** (`src/`) — Vite + React 18 + Tailwind (dark theme). Two pages:
- `LibraryPage` — song list, search, favorites, drag-drop upload
- `ViewerPage` — AlphaTab tablature renderer + playback + practice tracking

**Backend** (`server/`) — Express with two route groups:
- `/api/songs` — CRUD + file upload (multer, GP files only, 50MB)
- `/api/progress` — per-song practice progress (upsert)

SQLite via `better-sqlite3` (`jamlog.db`). Schema: `songs` and `progress` tables with CASCADE delete.

**Vite proxy**: `/api` and `/uploads` → `localhost:3001` in dev. AlphaTab worker + soundfont assets copied to `public/alphatab/` at build time.

**AlphaTab**: Guitar tablature library. Initialized in `useAlphaTab.ts` hook — handles lazy loading, API lifecycle, and playback state. Requires worker and soundfont URLs pointing to `public/alphatab/`.

**Metronome** (`Metronome.tsx`): Web Audio API oscillator, `requestAnimationFrame` scheduling, synced to score BPM.

## Key types

Defined in `src/types.ts`: `Song`, `Progress`, `ProgressStatus` (`not_started | learning | comfortable | mastered`).

API client in `src/api.ts` — typed fetch wrappers for all endpoints.

## Git workflow

Always create a new branch for every feature or fix. Never implement directly on `main`.

## Module system

`"type": "module"` in package.json. Server uses `NodeNext` module resolution (`server/tsconfig.json`), frontend uses `ESNext`.
