import { useState } from 'react'
import { Heart, Trash2, Share2, ZoomIn, Plus } from 'lucide-react'
import api from '../api'

const BASE = 'http://localhost:8000'

export default function PhotoCard({ photo, onDelete, onFavoriteToggle, onShare, compact = false }) {
  const [hovered, setHovered] = useState(false)
  const [preview, setPreview] = useState(false)
  const [fav, setFav] = useState(photo.favorited)

  const handleFav = async (e) => {
    e.stopPropagation()
    try {
      await api.post(`/photos/${photo.id}/favorite`)
      setFav(f => !f)
      onFavoriteToggle?.(photo.id)
    } catch {}
  }

  const handleTrash = async (e) => {
    e.stopPropagation()
    if (!confirm('Move to trash?')) return
    try {
      await api.delete(`/photos/${photo.id}`)
      onDelete?.(photo.id)
    } catch {}
  }

  const handleShare = async (e) => {
    e.stopPropagation()
    try {
      const res = await api.post(`/photos/${photo.id}/share`)
      const url = `${window.location.origin}/shared/${res.data.token}`
      await navigator.clipboard.writeText(url)
      onShare?.(url)
      alert('Share link copied to clipboard!')
    } catch {}
  }

  return (
    <>
      <div
        className={`relative overflow-hidden bg-[#f1f3f4] cursor-pointer select-none group
          ${compact ? 'rounded-lg' : 'rounded-xl'}`}
        style={{ aspectRatio: '1' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setPreview(true)}
      >
        <img
          src={`${BASE}${photo.url}`}
          alt={photo.original_name}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/20 transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`} />

        {/* Top actions */}
        <div className={`absolute top-2 right-2 flex gap-1.5 transition-all duration-150 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}>
          <button onClick={handleFav}
            className={`p-1.5 rounded-full backdrop-blur-sm transition-colors ${fav ? 'bg-white/90 text-red-500' : 'bg-black/40 text-white hover:bg-black/60'}`}>
            <Heart size={14} fill={fav ? 'currentColor' : 'none'} />
          </button>
          <button onClick={handleShare}
            className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm">
            <Share2 size={14} />
          </button>
          <button onClick={handleTrash}
            className="p-1.5 rounded-full bg-black/40 text-white hover:bg-red-500/80 backdrop-blur-sm">
            <Trash2 size={14} />
          </button>
        </div>

        {/* Favorite indicator */}
        {fav && !hovered && (
          <div className="absolute top-2 left-2">
            <Heart size={14} className="text-white drop-shadow-md" fill="white" />
          </div>
        )}

        {/* Similarity badge */}
        {photo.similarity !== undefined && (
          <div className={`absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm
            ${photo.similarity >= 70 ? 'bg-green-500/80 text-white' :
              photo.similarity >= 45 ? 'bg-amber-400/80 text-white' : 'bg-black/50 text-white'}`}>
            {photo.similarity}%
          </div>
        )}
      </div>

      {/* Lightbox */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setPreview(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
            <ZoomIn size={20} />
          </button>
          <img
            src={`${BASE}${photo.url}`}
            alt={photo.original_name}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
          <div className="absolute bottom-6 text-center space-y-1">
            <p className="text-white/80 text-sm">{photo.original_name}</p>
            {photo.similarity !== undefined && (
              <p className="text-white/50 text-xs">{photo.similarity}% match</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
