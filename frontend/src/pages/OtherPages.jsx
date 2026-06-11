import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, RotateCcw, FolderOpen, X } from 'lucide-react'
import TopBar from '../components/TopBar'
import PhotoGrid from '../components/PhotoGrid'
import PhotoCard from '../components/PhotoCard'
import api from '../api'

const BASE = 'http://localhost:8000'

// ── Favorites ──────────────────────────────────────────────────────────────

export function Favorites() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/favorites').then(r => setPhotos(r.data.photos)).finally(() => setLoading(false))
  }, [])

  const handleDelete = (id) => setPhotos(p => p.filter(x => x.id !== id))
  const handleFav = (id) => setPhotos(p => p.filter(x => x.id !== id))

  return (
    <div>
      <TopBar title="Favorites" />
      <main className="pt-20 px-6 pb-10">
        {loading
          ? <Spinner />
          : photos.length === 0
            ? <Empty icon="❤️" text="No favorites yet. Heart a photo to save it here." />
            : <PhotoGrid photos={photos} onDelete={handleDelete} onFavoriteToggle={handleFav} />
        }
      </main>
    </div>
  )
}

// ── Albums ──────────────────────────────────────────────────────────────────

export function Albums() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const load = () => api.get('/albums').then(r => setAlbums(r.data.albums)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    await api.post('/albums', { name })
    setName(''); setCreating(false); load()
  }

  const deleteAlbum = async (id) => {
    if (!confirm('Delete album?')) return
    await api.delete(`/albums/${id}`)
    setAlbums(a => a.filter(x => x.id !== id))
  }

  return (
    <div>
      <TopBar title="Albums" />
      <main className="pt-20 px-6 pb-10">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-[#5f6368]">{albums.length} album{albums.length !== 1 ? 's' : ''}</span>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
            <Plus size={16} /> New album
          </button>
        </div>

        {creating && (
          <form onSubmit={create} className="flex gap-2 mb-6 max-w-sm">
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              placeholder="Album name"
              className="flex-1 border border-[#dadce0] rounded-full px-4 py-2 text-sm outline-none focus:border-[#1a73e8]" />
            <button type="submit" className="bg-[#1a73e8] text-white px-4 py-2 rounded-full text-sm">Create</button>
            <button type="button" onClick={() => setCreating(false)} className="p-2 text-[#5f6368] hover:bg-[#f1f3f4] rounded-full">
              <X size={16} />
            </button>
          </form>
        )}

        {loading ? <Spinner /> : albums.length === 0
          ? <Empty icon="🗂️" text="No albums yet. Create one to organize your photos." />
          : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {albums.map(a => (
                <div key={a.id} className="group relative">
                  <Link to={`/albums/${a.id}`}>
                    <div className="aspect-square rounded-xl overflow-hidden bg-[#f1f3f4] mb-2">
                      {a.cover
                        ? <img src={`${BASE}${a.cover}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl"><FolderOpen className="text-[#dadce0]" size={40} /></div>
                      }
                    </div>
                    <p className="text-sm font-medium text-[#202124] truncate">{a.name}</p>
                    <p className="text-xs text-[#5f6368]">{a.photo_count} photo{a.photo_count !== 1 ? 's' : ''}</p>
                  </Link>
                  <button onClick={() => deleteAlbum(a.id)}
                    className="absolute top-2 right-2 p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )
        }
      </main>
    </div>
  )
}

export function AlbumDetail() {
  const { id } = useParams()
  const [album, setAlbum] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/albums/${id}`).then(r => setAlbum(r.data)).finally(() => setLoading(false))
  }, [id])

  const handleDelete = (pid) => setAlbum(a => ({ ...a, photos: a.photos.filter(x => x.id !== pid) }))

  return (
    <div>
      <TopBar title={album?.name || 'Album'} />
      <main className="pt-20 px-6 pb-10">
        {loading ? <Spinner /> : !album ? <Empty icon="🗂️" text="Album not found." /> : (
          <PhotoGrid photos={album.photos} onDelete={handleDelete} groupByDateFlag={false} />
        )}
      </main>
    </div>
  )
}

// ── People (Face Groups) ────────────────────────────────────────────────────

export function People() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/faces').then(r => setGroups(r.data.groups)).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <TopBar title="People" />
      <main className="pt-20 px-6 pb-10">
        {loading ? <Spinner /> : groups.length === 0
          ? <Empty icon="👤" text="No faces detected yet. Upload photos with people to see face groups." />
          : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {groups.map(g => (
                <Link key={g.id} to={`/people/${g.id}`} className="flex flex-col items-center gap-2 group">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-[#f1f3f4] ring-2 ring-transparent group-hover:ring-[#1a73e8] transition-all">
                    {g.cover_url
                      ? <img src={`${BASE}${g.cover_url}`} className="w-full h-full object-cover object-top" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                    }
                  </div>
                  <p className="text-xs text-[#202124] font-medium text-center">{g.name || 'Unknown'}</p>
                  <p className="text-xs text-[#5f6368]">{g.photo_count} photo{g.photo_count !== 1 ? 's' : ''}</p>
                </Link>
              ))}
            </div>
          )
        }
      </main>
    </div>
  )
}

export function PersonDetail() {
  const { id } = useParams()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    api.get(`/faces/${id}`).then(r => { setGroup(r.data); setName(r.data.name || '') }).finally(() => setLoading(false))
  }, [id])

  const saveName = async () => {
    await api.patch(`/faces/${id}`, { name })
    setGroup(g => ({ ...g, name }))
    setEditing(false)
  }

  return (
    <div>
      <TopBar title={group?.name || 'Person'} />
      <main className="pt-20 px-6 pb-10">
        {loading ? <Spinner /> : !group ? null : (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[#f1f3f4]">
                {group.cover_url
                  ? <img src={`${BASE}${group.cover_url}`} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                }
              </div>
              {editing
                ? <div className="flex gap-2">
                    <input value={name} onChange={e => setName(e.target.value)} autoFocus
                      className="border border-[#dadce0] rounded-full px-4 py-1.5 text-sm outline-none focus:border-[#1a73e8]" />
                    <button onClick={saveName} className="bg-[#1a73e8] text-white px-4 py-1.5 rounded-full text-sm">Save</button>
                    <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-full text-sm text-[#5f6368] hover:bg-[#f1f3f4]">Cancel</button>
                  </div>
                : <div>
                    <h2 className="text-xl font-normal text-[#202124]">{group.name || 'Unknown'}</h2>
                    <button onClick={() => setEditing(true)} className="text-xs text-[#1a73e8] hover:underline">
                      {group.name ? 'Edit name' : 'Add name'}
                    </button>
                  </div>
              }
            </div>
            <PhotoGrid photos={group.photos} groupByDateFlag={false} />
          </div>
        )}
      </main>
    </div>
  )
}

// ── Trash ───────────────────────────────────────────────────────────────────

export function Trash() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/trash').then(r => setPhotos(r.data.photos)).finally(() => setLoading(false))
  }, [])

  const restore = async (id) => {
    await api.post(`/photos/${id}/restore`)
    setPhotos(p => p.filter(x => x.id !== id))
  }

  const deletePerm = async (id) => {
    if (!confirm('Permanently delete? This cannot be undone.')) return
    await api.delete(`/photos/${id}/permanent`)
    setPhotos(p => p.filter(x => x.id !== id))
  }

  return (
    <div>
      <TopBar title="Trash" />
      <main className="pt-20 px-6 pb-10">
        {photos.length > 0 && (
          <p className="text-sm text-[#5f6368] mb-4 bg-[#fce8e6] text-[#c5221f] px-4 py-2 rounded-xl">
            Photos in trash are permanently deleted after 30 days.
          </p>
        )}
        {loading ? <Spinner /> : photos.length === 0
          ? <Empty icon="🗑️" text="Trash is empty." />
          : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
              {photos.map(p => (
                <div key={p.id} className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#f1f3f4]">
                    <img src={`${BASE}${p.url}`} alt={p.original_name}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
                  </div>
                  <div className="absolute inset-0 flex items-end justify-center pb-3 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => restore(p.id)}
                      className="flex items-center gap-1 bg-white text-[#202124] px-3 py-1.5 rounded-full text-xs font-medium shadow-md hover:bg-[#f8f9fa]">
                      <RotateCcw size={12} /> Restore
                    </button>
                    <button onClick={() => deletePerm(p.id)}
                      className="flex items-center gap-1 bg-[#c5221f] text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-md hover:bg-[#a50e0e]">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </main>
    </div>
  )
}

// ── Shared photo view ───────────────────────────────────────────────────────

export function SharedPhoto() {
  const { token } = useParams()
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get(`/shared/${token}`).then(r => setPhoto(r.data.photo)).catch(() => setError(true))
  }, [token])

  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-[#5f6368]">
      <div className="text-center">
        <p className="text-4xl mb-4">😕</p>
        <p>This link has expired or doesn't exist.</p>
      </div>
    </div>
  )

  if (!photo) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>

  return (
    <div className="min-h-screen bg-[#202124] flex flex-col items-center justify-center p-6">
      <img src={`${BASE}${photo.url}`} alt={photo.original_name}
        className="max-w-4xl w-full max-h-[80vh] object-contain rounded-xl" />
      <p className="text-white/60 text-sm mt-4">{photo.original_name}</p>
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function Empty({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-[#5f6368]">
      <div className="text-5xl">{icon}</div>
      <p className="text-sm text-center max-w-xs">{text}</p>
    </div>
  )
}
