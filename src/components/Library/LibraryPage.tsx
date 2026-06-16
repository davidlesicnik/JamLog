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
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSongs(await getSongs())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load songs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleFavorite = async (id: number) => {
    const prev = songs
    setSongs(s => s.map(x => x.id === id ? { ...x, favorite: x.favorite ? 0 : 1 } : x))
    try {
      await toggleFavorite(id)
    } catch {
      setSongs(prev)
    }
  }

  const handleDelete = async (id: number) => {
    const prev = songs
    setSongs(s => s.filter(x => x.id !== id))
    try {
      await deleteSong(id)
    } catch {
      setSongs(prev)
    }
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
      {error && <p className="text-red-400 text-sm">{error}</p>}
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
