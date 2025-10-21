import { NextResponse } from 'next/server'
// import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = 'pixabay_search'
const COLLECTION_NAME = 'search_history'

let client
let db

async function connectToDatabase() {
  if (db) return db

  try {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    db = client.db(DB_NAME)
    return db
  } catch (error) {
    console.error('Error conectando a MongoDB:', error)
    throw error
  }
}

export async function GET() {
  try {
    const database = await connectToDatabase()
    const collection = database.collection(COLLECTION_NAME)
    
    const history = await collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray()

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error obteniendo historial:', error)
    
    // Fallback a localStorage para desarrollo
    if (process.env.NODE_ENV === 'development') {
      // Simular respuesta vacía para desarrollo
      return NextResponse.json([])
    }
    
    return NextResponse.json(
      { error: 'Error obteniendo historial' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const searchData = await request.json()
    
    const database = await connectToDatabase()
    const collection = database.collection(COLLECTION_NAME)
    
    await collection.insertOne({
      ...searchData,
      timestamp: new Date(),
    })

    // Mantener solo las últimas 50 búsquedas
    await collection
      .find({})
      .sort({ timestamp: -1 })
      .skip(50)
      .toArray()
      .then(oldDocs => {
        if (oldDocs.length > 0) {
          const idsToDelete = oldDocs.map(doc => doc._id)
          collection.deleteMany({ _id: { $in: idsToDelete } })
        }
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error guardando en historial:', error)
    
    // Fallback para desarrollo
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json(
      { error: 'Error guardando en historial' },
      { status: 500 }
    )
  }
}