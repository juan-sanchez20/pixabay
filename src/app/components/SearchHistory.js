'use client'

import { useEffect, useState } from 'react'

export default function SearchHistory({ currentSearch }) {
const [searchHistory, setSearchHistory] = useState([])
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState(null)

// ✅ Cargar historial desde MongoDB
useEffect(() => {
const fetchHistory = async () => {
try {
setIsLoading(true)
const response = await fetch('/api/history')
if (!response.ok) throw new Error('Error obteniendo historial')

    const data = await response.json()
    setSearchHistory(data)
  } catch (err) {
    console.error('❌ Error al cargar historial:', err)
    setError('No se pudo cargar el historial de búsquedas')
  } finally {
    setIsLoading(false)
  }
}

fetchHistory()


}, [])

// ✅ Rebuscar desde el historial
const handleSearchClick = (term) => {
const event = new CustomEvent('searchFromHistory', { detail: { term } })
window.dispatchEvent(event)
}

if (isLoading) {
return (
<section className="bg-white rounded-lg shadow-lg p-6 mt-8 text-center">
<h2 className="text-2xl font-bold text-gray-800 mb-4">
Historial de Búsquedas
</h2>
<p className="text-gray-600">Cargando historial...</p>
</section>
)
}

if (error) {
return (
<section className="bg-white rounded-lg shadow-lg p-6 mt-8 text-center">
<h2 className="text-2xl font-bold text-gray-800 mb-4">
Historial de Búsquedas
</h2>
<p className="text-red-600">{error}</p>
</section>
)
}

if (!searchHistory || searchHistory.length === 0) {
return (
<section className="bg-white rounded-lg shadow-lg p-6 mt-8 text-center">
<h2 className="text-2xl font-bold text-gray-800 mb-4">
Historial de Búsquedas
</h2>
<p className="text-gray-600">No hay búsquedas recientes</p>
</section>
)
}

return (
<section className="bg-white rounded-lg shadow-lg p-6 mt-8">
<h2 className="text-2xl font-bold text-gray-800 mb-4">
Historial de Búsquedas
</h2>
<div className="space-y-3">
{searchHistory.map((item, index) => (
<div
 key={index}
onClick={() => handleSearchClick(item.query)}
className={`flex justify-between items-center p-4 rounded-lg border cursor-pointer transition ${ item.query === currentSearch ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 hover:bg-gray-100 border-gray-200' }`}
>
<span className="font-semibold text-gray-800">
🔍 {item.query}
</span>
<span className="text-sm text-gray-500">
{new Date(item.timestamp).toLocaleString('es-ES')}
</span>
</div>
))}
</div>
</section>
)
}