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
