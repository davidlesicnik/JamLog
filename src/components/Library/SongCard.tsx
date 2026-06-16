import { Link } from 'react-router-dom'
import type { Song } from '../../types'

interface Props {
  song: Song
  onFavorite: (id: number) => void
  onDelete: (id: number) => void
}

export default function SongCard({ song, onFavorite, onDelete }: Props) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
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
