import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import PhotoGrid from '../components/PhotoGrid'
import api from '../api'

export default function Photos() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await api.get('/photos')
      setPhotos(res.data.photos)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = (id) => setPhotos(p => p.filter(x => x.id !== id))
  const handleFav = (id) => setPhotos(p => p.map(x => x.id === id ? { ...x, favorited: !x.favorited } : x))

  return (
    <div>
      <TopBar />
      <main className="pt-20 px-6 pb-10">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-16 h-16 bg-[#e8f0fe] rounded-full flex items-center justify-center text-2xl">📷</div>
            <p className="text-[#5f6368]">No photos yet. Upload some to get started!</p>
          </div>
        ) : (
          <PhotoGrid photos={photos} onDelete={handleDelete} onFavoriteToggle={handleFav} groupByDateFlag />
        )}
      </main>
    </div>
  )
}
