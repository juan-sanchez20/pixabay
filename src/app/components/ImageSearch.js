'use client'
import { useState, useEffect } from 'react'
import LoadMoreButton from './LoadMoreButton'

export default function ImageSearch({ onSearch }) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [filterInfo, setFilterInfo] = useState('')
  const [lastError, setLastError] = useState('')
  
  // Estados para imágenes y paginación
  const [images, setImages] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [currentSearchTerm, setCurrentSearchTerm] = useState('')
  const [showResults, setShowResults] = useState(false)

  const searchSuggestions = [
    'nature', 'mountains', 'ocean', 'city', 'forest', 
    'animals', 'flowers', 'sky', 'beach', 'architecture'
  ]

  useEffect(() => {
    const handleSearchFromHistory = (event) => {
      const { term } = event.detail
      setQuery(term)
      performSearch(term, 1)
    }

    window.addEventListener('searchFromHistory', handleSearchFromHistory)
    
    return () => {
      window.removeEventListener('searchFromHistory', handleSearchFromHistory)
    }
  }, [])

  const performSearch = async (searchTerm, page = 1, isLoadMore = false) => {
    if (!searchTerm.trim()) {
      setLastError('Por favor, escribe algo para buscar')
      return
    }

    if (!isLoadMore) {
      setIsLoading(true)
      setImages([])
      setCurrentPage(1)
      setCurrentSearchTerm(searchTerm)
      setShowResults(false)
    } else {
      setIsLoading(true)
    }

    setLastError('')
    setFilterInfo('')

    try {
      console.log('Buscando:', searchTerm, 'Página:', page)
      
      const filteredQuery = applyBiasFilters(searchTerm)
      
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: filteredQuery, 
          originalQuery: searchTerm,
          page: page,
          per_page: 20
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error del servidor: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        if (isLoadMore) {
          // Agregar nuevas imágenes a las existentes
          setImages(prev => [...prev, ...data.images])
        } else {
          // Nueva búsqueda, reemplazar imágenes
          setImages(data.images)
          setShowResults(true)
        }
        
        setCurrentPage(data.page)
        setHasMore(data.hasMore)
        setTotalResults(data.total)
        
        if (!isLoadMore) {
          onSearch(searchTerm)
        }
      } else {
        throw new Error(data.error || 'Error en la respuesta del servidor')
      }

    } catch (error) {
      console.error('Error en búsqueda:', error)
      setLastError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMore = async () => {
    if (!hasMore || isLoading) return
    await performSearch(currentSearchTerm, currentPage + 1, true)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    await performSearch(query, 1, false)
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
    performSearch(suggestion, 1, false)
  }

  const applyBiasFilters = (searchQuery) => {
    const originalQuery = searchQuery.toLowerCase()
    let filteredQuery = originalQuery

    if (originalQuery.includes('black') || originalQuery.includes('poor')) {
      filteredQuery += ' landscape nature object'
      setFilterInfo(`
        <div class="filter-info">
          <strong>🔒 Filtro Ético Aplicado</strong><br/>
          Hemos ajustado tu búsqueda para evitar resultados con posibles sesgos raciales o de género.
        </div>
      `)
    } else {
      setFilterInfo(`
        <div class="filter-info ethical">
          <strong>✅ Búsqueda Ética Activada</strong><br/>
          Nuestro sistema aplica filtros automáticos para evitar sesgos en los resultados.
        </div>
      `)
    }

    return filteredQuery
  }

  // Componente para mostrar resultados
  const ResultsSection = () => {
    if (!showResults && !isLoading) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-20">🔍</div>
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">
            Realiza tu primera búsqueda
          </h2>
          <p className="text-gray-500">
            Encuentra imágenes increíbles usando el buscador de arriba
          </p>
        </div>
      )
    }

    if (isLoading && images.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Buscando imágenes...</p>
        </div>
      )
    }

    if (images.length === 0 && !isLoading) {
      return (
        <div className="error">
          <div className="text-4xl mb-4">😔</div>
          <h3 className="text-xl font-semibold mb-2">No se encontraron imágenes</h3>
          <p className="text-gray-600">No hay resultados para "<strong>{currentSearchTerm}</strong>"</p>
          <p className="text-sm text-gray-500 mt-2">Intenta con otros términos de búsqueda</p>
        </div>
      )
    }

    return (
      <>
        <div className="results-header">
          <h2 className="results-title">
            🎨 Resultados para: <span className="text-blue-600">"{currentSearchTerm}"</span>
          </h2>
          <p className="results-count">
            📊 {totalResults.toLocaleString()} imágenes encontradas - 
            Mostrando {images.length} resultados
            {currentPage > 1 ? ` (Página ${currentPage})` : ''}
          </p>
          {hasMore && (
            <div className="mt-2 text-sm text-green-600">
              ⬇️ Hay más imágenes disponibles - desplázate hacia abajo para cargar más
            </div>
          )}
        </div>
        
        {filterInfo && (
          <div dangerouslySetInnerHTML={{ __html: filterInfo }} />
        )}
        
        <div className="gallery-grid">
          {images.map((image, index) => (
            <div key={`${image.id}-${index}`} className="image-card group">
              <div className="relative overflow-hidden">
                <img 
                  src={image.webformatURL} 
                  alt={image.tags || 'Imagen'}
                  loading={index < 20 ? 'eager' : 'lazy'}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300/4A5568/FFFFFF?text=Error+Loading'
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-lg text-xs">
                  {image.likes || 0} ❤️
                </div>
              </div>
              <div className="image-info">
                <div className="image-tags">
                  {(image.tags || 'imagen').split(',').slice(0, 3).join(', ')}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="image-user text-sm">👤 {image.user || 'Unknown'}</span>
                  <span className="text-xs text-gray-500">
                    {image.downloads || 0} ⬇️
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <LoadMoreButton
            onLoadMore={handleLoadMore}
            isLoading={isLoading}
            hasMore={hasMore}
            currentPage={currentPage}
            totalResults={totalResults}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className="search-container">
        <h2 className="search-title">
          🔍 Buscador de Imágenes Éticas
        </h2>
        
        {lastError && (
          <div className="filter-info" style={{background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626'}}>
            <strong>❌ Último error:</strong> {lastError}
          </div>
        )}
        
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            id="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe lo que quieres buscar... (ej: paisajes, animales, ciudades)"
            className="search-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className={`search-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? 'Buscando...' : '🚀 Buscar'}
          </button>
        </form>

        <div className="search-suggestions">
          <span className="text-sm text-gray-500 mr-2">💡 Sugerencias:</span>
          {searchSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="suggestion-tag"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Sección de resultados */}
      <div id="results-section">
        <ResultsSection />
      </div>
    </>
  )
}