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
      if (inputRef.current) inputRef.current.value = ''
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
