import { NextResponse } from 'next/server'

const PIXABAY_API_KEY = '52858994-c49502cb3f4edaa8433247040'

export async function POST(request) {
  try {
    const body = await request.json()
    const { query, originalQuery, page = 1, per_page = 20 } = body
    
    console.log('Búsqueda con paginación:', { query, originalQuery, page, per_page })

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Query vacía'
        },
        { status: 400 }
      )
    }

    // Construir URL con paginación
    const pixabayUrl = `https://pixabay.com/api/?
      key=${PIXABAY_API_KEY}
      &q=${encodeURIComponent(query)}
      &image_type=photo
      &per_page=${per_page}
      &page=${page}
      &safesearch=true`

    console.log('URL de Pixabay:', pixabayUrl.replace(/\s/g, ''))

    const pixabayResponse = await fetch(pixabayUrl.replace(/\s/g, ''))

    if (!pixabayResponse.ok) {
      const errorText = await pixabayResponse.text()
      console.error('Error Pixabay:', errorText)
      throw new Error(`Error en Pixabay API: ${pixabayResponse.status}`)
    }

    const data = await pixabayResponse.json()
    console.log('Resultados paginados:', {
      page: page,
      per_page: per_page,
      total: data.totalHits,
      results: data.hits?.length
    })

    // Guardar solo la primera página en el historial
    if (page === 1) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            term: originalQuery || query,
            filteredTerm: query,
            timestamp: new Date().toISOString(),
            resultsCount: data.totalHits || 0,
            filtersApplied: query !== (originalQuery || query)
          }),
        })
      } catch (historyError) {
        console.log('Historial no disponible')
      }
    }

    return NextResponse.json({
      success: true,
      images: data.hits || [],
      total: data.totalHits || 0,
      page: parseInt(page),
      per_page: parseInt(per_page),
      hasMore: data.hits && data.hits.length === per_page && 
               (page * per_page) < (data.totalHits || 0),
      totalPages: Math.ceil((data.totalHits || 0) / per_page)
    })

  } catch (error) {
    console.error('Error en API search:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message
      },
      { status: 500 }
    )
  }
}