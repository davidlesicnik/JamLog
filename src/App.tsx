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
        <Route path="*" element={<p className="p-8 text-gray-400">Not found</p>} />
      </Routes>
    </div>
  )
}
