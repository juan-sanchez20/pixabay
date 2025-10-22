'use client'
import { useState, useEffect } from 'react'
import ImageSearch from './components/ImageSearch'
import SearchHistory from './components/SearchHistory'

export default function Home() {
const [searchHistory, setSearchHistory] = useState([])
const [currentSearch, setCurrentSearch] = useState('')
const [isLoadingHistory, setIsLoadingHistory] = useState(true)

useEffect(() => {
loadSearchHistory()

const handleSearchFromHistory = (event) => {
  const { term } = event.detail
  setCurrentSearch(term)
}

window.addEventListener('searchFromHistory', handleSearchFromHistory)

return () => {
  window.removeEventListener('searchFromHistory', handleSearchFromHistory)
}


}, [])

const loadSearchHistory = async () => {
try {
setIsLoadingHistory(true)
const response = await fetch('/api/history')
if (response.ok) {
const data = await response.json()
setSearchHistory(data)
}
} catch (error) {
console.error('Error cargando historial:', error)
} finally {
setIsLoadingHistory(false)
}
}

const handleSearch = async (query) => {
setCurrentSearch(query)

try {
  // 🔹 Guardar la búsqueda en MongoDB
  const response = await fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })

  if (!response.ok) {
    console.error('Error al guardar la búsqueda en MongoDB')
  }

  // 🔹 Luego de guardar, recarga el historial
  await loadSearchHistory()
} catch (error) {
  console.error('Error durante la búsqueda:', error)
}


}

return (
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
{/* Header */}
<header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-16 relative overflow-hidden">
<div className="absolute inset-0 bg-black opacity-10"></div>
<div className="container mx-auto px-4 text-center relative z-10">
<h1 className="text-5xl font-bold mb-6 drop-shadow-lg">
🎨 Buscador de Imágenes sin Sesgos
</h1>
<p className="text-xl opacity-95 max-w-2xl mx-auto leading-relaxed">
Descubre imágenes increíbles sin prejuicios raciales o de género.
Tecnología ética para resultados responsables.
</p>
</div>
</header>

  {/* Main Content */}
  <main className="container mx-auto px-4 py-8 max-w-6xl">
    <ImageSearch onSearch={handleSearch} />

    {/* History Section */}
    {!isLoadingHistory && (
      <SearchHistory history={searchHistory} currentSearch={currentSearch} />
    )}
  </main>

  {/* Footer */}
  <footer className="bg-white border-t border-gray-200 py-12 mt-16">
    <div className="container mx-auto px-4 text-center">
      <div className="max-w-2xl mx-auto">
        <p className="text-gray-600 text-lg mb-4">
          🚀 Aplicación desarrollada para demostrar la eliminación de sesgos en búsquedas de imágenes
        </p>
      </div>
    </div>
  </footer>
</div>


)
}