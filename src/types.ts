export type ProgressStatus = 'not_started' | 'learning' | 'comfortable' | 'mastered'

export interface Song {
  id: number
  title: string
  filename: string
  favorite: number  // 0 | 1 (SQLite integer)
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
