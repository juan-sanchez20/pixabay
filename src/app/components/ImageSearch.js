'use client'

import { useState, useEffect } from 'react'
import LoadMoreButton from './LoadMoreButton'

// Palabras que activan el bloqueo si se usan solas
const BLOCK_WORDS = ['black', 'poor'];

// ✅ Guarda las búsquedas en MongoDB (Mantener esta función como está)
const saveSearchRecord = async (query, results) => {
    // ... (Tu función saveSearchRecord original) ...
    const searchRecord = {
        query: query,
        image_count: results.length,
        results: results.map(img => ({
            id: img.id,
            url: img.webformatURL,
            tags: img.tags,
        })),
    };

    try {
        const response = await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(searchRecord),
        });

        if (response.ok) {
            console.log('✅ Búsqueda registrada en MongoDB.')
        } else {
            console.error('❌ Fallo al registrar búsqueda:', await response.json())
        }
    } catch (error) {
        console.error('❌ Error de red al intentar guardar la búsqueda:', error)
    }
};

// =================================================================
// 🆕 Lógica de Validación Estricta
// =================================================================
const checkStrictBlock = (searchQuery) => {
    const q = searchQuery.trim().toLowerCase();
    const words = q.split(/\s+/).filter(w => w.length > 0);

    // Bloquea si es solo 'black', 'poor', o 'poor black' (en cualquier orden)
    if (words.length > 0 && words.every(w => BLOCK_WORDS.includes(w))) {
        return true;
    }
    return false;
};


export default function ImageSearch({ onSearch }) {
    const [query, setQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [filterInfo, setFilterInfo] = useState('') 
    const [lastError, setLastError] = useState('')
    const [images, setImages] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [totalResults, setTotalResults] = useState(0)
    const [currentSearchTerm, setCurrentSearchTerm] = useState('')
    const [showResults, setShowResults] = useState(false)

    const searchSuggestions = [
        'nature', 'mountains', 'ocean', 'city', 'forest',
        'animals', 'flowers', 'sky', 'beach', 'architecture'
    ]; 

    // ... (useEffect para handleSearchFromHistory) ...
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
    }, []);


    // ✅ Función para manejar los filtros y la URL
    const applyBiasFilters = (searchQuery) => {
        const originalQuery = searchQuery.toLowerCase();
        
        let extraParams = '';
        let message = `
            <div class="filter-info ethical">
                <strong>✅ Búsqueda Ética por Defecto</strong><br/>
                Imágenes de personas excluidas en todas las búsquedas.
            </div>
        `;

        if (originalQuery.includes('black') || originalQuery.includes('poor')) {
            // Si la búsqueda contiene una palabra de riesgo, añadimos categorías de bajo riesgo.
            extraParams = '&category=nature,backgrounds,buildings,science,transportation,animals,objects';
            
            message = `
                <div class="filter-info risky">
                    <strong>🔒 Filtro Ético Reforzado</strong><br/>
                    Se garantiza la exclusión de personas y se priorizan objetos y paisajes para el término "<strong>${searchQuery}</strong>".
                </div>
            `;
        }

        setFilterInfo(message);
        return extraParams; 
    };

    // ✅ Función principal de búsqueda
    const performSearch = async (searchTerm, page = 1, isLoadMore = false) => {
        const q = searchTerm.trim();
        
        if (!q) {
            setLastError('Por favor, escribe algo para buscar');
            return;
        }
        
        // 1. APLICACIÓN DEL BLOQUEO ESTRICTO
        if (checkStrictBlock(q)) {
            setLastError(`⛔ Búsqueda Bloqueada: El término "${q}" es muy sensible y puede inducir un sesgo. Por favor, sé más específico (Ej: "black car", "poor visibility").`);
            setImages([]);
            setFilterInfo('');
            setShowResults(true);
            return;
        }

        if (!isLoadMore) {
            setIsLoading(true);
            setImages([]);
            setCurrentPage(1);
            setCurrentSearchTerm(searchTerm);
            setShowResults(false);
        } else {
            setIsLoading(true);
        }

        setLastError('');
        
        try {
            const extraParams = applyBiasFilters(q); 
            const apiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
            
            // 2. CONSTRUCCIÓN DE LA URL
            // Usamos &people=false y &safesearch=true para excluir personas en CUALQUIER búsqueda.
            const response = await fetch(
                `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(q)}&image_type=photo&per_page=20&page=${page}&safesearch=true&people=false${extraParams}`
            );

            if (!response.ok) throw new Error(`Error del servidor Pixabay: ${response.status}`);

            const data = await response.json();
            let results = data.hits || [];

            // 3. 🚫 Post-Filtrado Suavizado (Solo para tags obvios de persona)
            // Se mantiene una capa de filtro para máxima seguridad, pero es mucho menos agresiva.
            results = results.filter(img => {
                const tags = img.tags.toLowerCase();
                return !(
                    tags.includes('person') ||
                    tags.includes('people') ||
                    tags.includes('portrait')
                );
            });

            if (isLoadMore) {
                setImages(prev => [...prev, ...results]);
            } else {
                setImages(results);
                setShowResults(true);
            }

            setCurrentPage(page);
            setHasMore(results.length === 20); 
            setTotalResults(data.totalHits || 0);

            if (!isLoadMore && results.length > 0) {
                await saveSearchRecord(searchTerm, results);
            }

            if (!isLoadMore) onSearch && onSearch(searchTerm);
        } catch (error) {
            console.error('Error en búsqueda:', error);
            setLastError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ... (El resto de las funciones: handleLoadMore, handleSearch, handleSuggestionClick) ...
    const handleLoadMore = async () => {
        if (!hasMore || isLoading) return;
        await performSearch(currentSearchTerm, currentPage + 1, true);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        await performSearch(query, 1, false);
    };

    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion);
        performSearch(suggestion, 1, false);
    };


    // 🖼️ Componente de resultados y return (mantener el resto del código como está)
    const ResultsSection = () => {
        // ... (Tu código ResultsSection) ...
        // Código para renderizar resultados y manejo de estados (sin cambios funcionales)
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
                <div className="error text-center py-12">
                    <div className="text-4xl mb-4">😔</div>
                    <h3 className="text-xl font-semibold mb-2">No se encontraron imágenes</h3>
                    <p className="text-gray-600">No hay resultados para "<strong>{currentSearchTerm}</strong>"</p>
                </div>
            )
        }

        return (
            <>
                <div className="results-header text-center mb-6">
                    <h2 className="results-title text-2xl font-semibold">
                        🎨 Resultados para: <span className="text-blue-600">"{currentSearchTerm}"</span>
                    </h2>
                    <p className="results-count text-gray-600">
                        📊 {totalResults.toLocaleString()} imágenes encontradas
                    </p>
                </div>

                {/* Mostramos el mensaje de filtro en un div estilizado */}
                {filterInfo && (
                    <div 
                        className="mb-6 p-4 rounded-lg text-sm"
                        dangerouslySetInnerHTML={{ __html: filterInfo }} 
                        style={{ backgroundColor: '#f0f4ff', border: '1px solid #c7d2fe' }}
                    />
                )}

                <div className="gallery-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <div key={`${image.id}-${index}`} className="image-card group">
                            <div className="relative overflow-hidden rounded-lg shadow-md">
                                <img
                                    src={image.webformatURL}
                                    alt={image.tags || 'Imagen'}
                                    loading={index < 20 ? 'eager' : 'lazy'}
                                    className="w-full h-60 object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-md">
                                    ❤️ {image.likes || 0}
                                </div>
                            </div>
                            <div className="text-sm mt-2">
                                <p className="text-gray-700 truncate">{image.tags}</p>
                                <p className="text-gray-500 text-xs">👤 {image.user || 'Desconocido'}</p>
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
        // ... (Tu código de retorno del componente ImageSearch) ...
        <>
            <div className="search-container text-center p-6">
                <h2 className="text-2xl font-bold mb-4">🔍 Buscador de Imágenes Éticas</h2>

                {lastError && (
                    <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-700 rounded-md">
                        ❌ {lastError}
                    </div>
                )}

                <form onSubmit={handleSearch} className="flex justify-center mb-4 gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ej: animales, paisajes, ciudades..."
                        className="border border-gray-400 px-4 py-2 rounded-lg w-72"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Buscando...' : 'Buscar'}
                    </button>
                </form>

                <div className="search-suggestions flex flex-wrap justify-center gap-2">
                    {searchSuggestions.map((s) => (
                        <button
                            key={s}
                            onClick={() => handleSuggestionClick(s)}
                            className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-full"
                            disabled={isLoading}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div id="results-section" className="px-4">
                <ResultsSection />
            </div>
        </>
    )
}