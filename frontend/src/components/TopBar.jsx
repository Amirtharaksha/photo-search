import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'

export default function TopBar({ title }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white z-20 flex items-center px-6 gap-4 border-b border-[#e8eaed]">
      {title
        ? <h1 className="text-xl font-normal text-[#202124]">{title}</h1>
        : (
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f6368]" size={18} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder='Search your photos...'
                className="w-full bg-[#f1f3f4] rounded-full pl-11 pr-10 py-2.5 text-sm text-[#202124] placeholder-[#9aa0a6] outline-none focus:bg-white focus:shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-all border border-transparent focus:border-[#dadce0]"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] hover:text-[#202124]">
                  <X size={16} />
                </button>
              )}
            </div>
          </form>
        )
      }
    </header>
  )
}
