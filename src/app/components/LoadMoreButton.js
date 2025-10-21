'use client'
import { useState } from 'react'

export default function LoadMoreButton({ 
  onLoadMore, 
  isLoading, 
  hasMore, 
  currentPage,
  totalResults 
}) {
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return
    
    setIsLoadingMore(true)
    try {
      await onLoadMore()
    } finally {
      setIsLoadingMore(false)
    }
  }

  if (!hasMore && totalResults > 0) {
    return (
      <div className="load-more-section">
        <div className="end-of-results">
          ✅ Has visto todos los resultados ({totalResults.toLocaleString()} imágenes)
        </div>
      </div>
    )
  }

  if (!hasMore) {
    return null
  }

  return (
    <div className="load-more-section">
      <button
        onClick={handleLoadMore}
        disabled={isLoadingMore}
        className="load-more-button"
      >
        {isLoadingMore ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando más imágenes...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Cargar más imágenes (Página {currentPage + 1})
          </>
        )}
      </button>
      
      <div className="pagination-info">
        Página {currentPage} - {Math.ceil(totalResults / 20)} páginas aproximadamente
      </div>
    </div>
  )
}