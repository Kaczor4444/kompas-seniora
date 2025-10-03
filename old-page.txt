'use client'
import { useState } from 'react'

interface Placowka {
  id: number
  nazwa: string
  typ_placowki: string
  miejscowosc: string
  koszt_pobytu: number | null
  telefon: string | null
}

export default function Home() {
  const [search, setSearch] = useState('')
  const [placowki, setPlacowki] = useState<Placowka[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : ''
      const response = await fetch(`/api/placowki${params}`)
      const data = await response.json()
      
      if (data.success) {
        setPlacowki(data.data)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Kompas Seniora
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Znajdź najlepszy dom opieki w Twojej okolicy
          </p>
          
          {/* Search Box */}
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Wpisz miejscowość..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              {loading ? 'Szukam...' : 'Szukaj domów opieki'}
            </button>
          </div>
        </div>

        {/* Results */}
        {placowki.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">
              Znalezione placówki ({placowki.length})
            </h2>
            <div className="grid gap-4">
              {placowki.map((placowka) => (
                <div key={placowka.id} className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-semibold mb-2">{placowka.nazwa}</h3>
                  <div className="text-gray-600 space-y-1">
                    <p><span className="font-medium">Typ:</span> {placowka.typ_placowki}</p>
                    <p><span className="font-medium">Miejscowość:</span> {placowka.miejscowosc}</p>
                    {placowka.koszt_pobytu && (
                      <p><span className="font-medium">Koszt:</span> {placowka.koszt_pobytu} zł/miesiąc</p>
                    )}
                    {placowka.telefon && (
                      <p><span className="font-medium">Telefon:</span> 
                        <a href={`tel:${placowka.telefon}`} className="text-blue-600 hover:underline ml-1">
                          {placowka.telefon}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mt-12">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold text-blue-600">2</h3>
            <p className="text-gray-600">Placówki w bazie</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold text-green-600">100%</h3>
            <p className="text-gray-600">Oficjalne dane</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold text-purple-600">Małopolska</h3>
            <p className="text-gray-600">Aktualnie dostępne</p>
          </div>
        </div>
      </div>
    </main>
  )
}