import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import songsRouter from './routes/songs.js'
import progressRouter from './routes/progress.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/api/songs', songsRouter)
app.use('/api/progress', progressRouter)

app.get('/healthz', (_req, res) => res.json({ ok: true }))

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, () => console.log(`Server on ${PORT}`))

export { app }
