'use client'
import { useEffect, useState } from 'react'

export default function SearchHistory({ history, currentSearch }) {
  const [searchHistory, setSearchHistory] = useState([])

  useEffect(() => {
    setSearchHistory(history)
  }, [history])

  if (!searchHistory || searchHistory.length === 0) {
    return (
      <section className="bg-white rounded-lg shadow-lg p-6 mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Historial de Búsquedas</h2>
        <p className="text-gray-600">No hay búsquedas recientes</p>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-lg shadow-lg p-6 mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Historial de Búsquedas</h2>
      <div className="space-y-3">
        {searchHistory.map((item, index) => (
          <div 
            key={index}
            className={`flex justify-between items-center p-4 rounded-lg border ${
              item.term === currentSearch 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <span className="font-semibold text-gray-800">{item.term}</span>
            <span className="text-sm text-gray-500">
              {new Date(item.timestamp).toLocaleString('es-ES')}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}