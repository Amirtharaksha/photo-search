import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import TopBar from '../components/TopBar'
import PhotoCard from '../components/PhotoCard'
import api from '../api'

const SUGGESTIONS = [
  'red dress near beach', 'birthday party with cake', 'dog playing outside',
  'sunset over water', 'friends laughing', 'food on table', 'city at night',
  'mountains with snow', 'baby smiling', 'wedding ceremony', 'flowers in garden',
]

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const doSearch = async (q) => {
    if (!q.trim()) { setResults(null); return }
    setLoading(true)
    try {
      const res = await api.post('/search', { query: q, limit: 30 })
      setResults(res.data.results)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) { setQuery(q); doSearch(q) }
  }, [searchParams])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) { setSearchParams({ q: query }); doSearch(query) }
  }

  const handleDelete = (id) => setResults(r => r.filter(x => x.id !== id))

  return (
    <div>
      <TopBar title="Search" />
      <main className="pt-20 px-6 pb-10">

        {/* Big search bar */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mt-6 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f6368]" size={20} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Describe what you\'re looking for..."
              className="w-full border border-[#dadce0] rounded-full pl-12 pr-6 py-3.5 text-base text-[#202124] placeholder-[#9aa0a6] outline-none focus:shadow-[0_1px_6px_rgba(32,33,36,0.28)] focus:border-transparent transition-all"
              autoFocus
            />
          </div>

          {/* Suggestions */}
          {!results && (
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setQuery(s); setSearchParams({ q: s }); doSearch(s) }}
                  className="text-sm bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#1a73e8] px-4 py-1.5 rounded-full transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-20 text-[#5f6368]">
            <div className="w-8 h-8 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Searching with CLIP AI...</p>
          </div>
        )}

        {/* Results */}
        {!loading && results !== null && (
          <div>
            <p className="text-sm text-[#5f6368] mb-4">
              {results.length} result{results.length !== 1 ? 's' : ''} for
              <span className="text-[#202124] font-medium ml-1">"{searchParams.get('q')}"</span>
            </p>
            {results.length > 0
              ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
                  {results.map(p => <PhotoCard key={p.id} photo={p} onDelete={handleDelete} showScore />)}
                </div>
              : <div className="text-center py-20 text-[#5f6368]">
                  <p>No results found. Try a different description.</p>
                </div>
            }
          </div>
        )}

        {/* Empty state */}
        {!loading && results === null && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-[#5f6368]">Search for any photo using plain words</p>
          </div>
        )}
      </main>
    </div>
  )
}
