import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { CloudUpload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import TopBar from '../components/TopBar'
import api from '../api'

export default function Upload() {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [previews, setPreviews] = useState([])
  const navigate = useNavigate()

  const onDrop = useCallback(async (files) => {
    if (!files.length) return
    setPreviews(files.map(f => ({ name: f.name, url: URL.createObjectURL(f) })))
    setStatus('uploading')
    setProgress(0)
    setMessage(`Uploading ${files.length} photo${files.length > 1 ? 's' : ''}...`)

    const formData = new FormData()
    files.forEach(f => formData.append('files', f))

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100))
      })
      setStatus('success')
      setMessage(`${res.data.total} photo${res.data.total !== 1 ? 's' : ''} uploaded and indexed!`)
      setTimeout(() => navigate('/'), 2000)
    } catch (e) {
      setStatus('error')
      setMessage(e.response?.data?.detail || 'Upload failed. Is the backend running?')
    }
  }, [navigate])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg','.jpeg','.png','.webp','.gif','.heic'] },
    multiple: true,
    disabled: status === 'uploading',
  })

  return (
    <div>
      <TopBar title="Upload photos" />
      <main className="pt-20 px-6 pb-10 max-w-2xl mx-auto">
        <div className="mt-8 space-y-6">

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-[#1a73e8] bg-[#e8f0fe]' : 'border-[#dadce0] hover:border-[#1a73e8] hover:bg-[#f8f9fa]'}
              ${status === 'uploading' ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              {status === 'uploading'
                ? <Loader2 className="w-12 h-12 text-[#1a73e8] animate-spin" />
                : <CloudUpload className="w-12 h-12 text-[#5f6368]" />
              }
              <div>
                <p className="text-base font-medium text-[#202124]">
                  {isDragActive ? 'Drop your photos here' : 'Drag photos here or click to browse'}
                </p>
                <p className="text-sm text-[#5f6368] mt-1">JPG, PNG, WebP, HEIC supported</p>
              </div>
              {status === 'idle' && (
                <button className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors">
                  Select photos
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {status === 'uploading' && (
            <div>
              <div className="h-1 bg-[#e8eaed] rounded-full overflow-hidden">
                <div className="h-full bg-[#1a73e8] transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-[#5f6368] mt-2 text-center">{message} — Generating CLIP embeddings...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 text-[#137333] bg-[#e6f4ea] rounded-xl px-4 py-3">
              <CheckCircle size={18} />
              <span className="text-sm font-medium">{message} Redirecting to your photos...</span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 text-[#c5221f] bg-[#fce8e6] rounded-xl px-4 py-3">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}

          {/* Preview grid */}
          {previews.length > 0 && status !== 'success' && (
            <div className="grid grid-cols-4 gap-2">
              {previews.slice(0, 8).map((p, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-[#f1f3f4]">
                  <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                </div>
              ))}
              {previews.length > 8 && (
                <div className="aspect-square rounded-lg bg-[#f1f3f4] flex items-center justify-center text-sm text-[#5f6368]">
                  +{previews.length - 8}
                </div>
              )}
            </div>
          )}

          {/* Info box */}
          <div className="bg-[#f8f9fa] rounded-xl p-4 text-sm text-[#5f6368] space-y-1">
            <p className="font-medium text-[#202124]">How it works</p>
            <p>Each photo is processed by OpenAI CLIP to generate a 512-dimensional semantic embedding — a numerical fingerprint of what's in the photo.</p>
            <p>When you search with words, CLIP encodes your text the same way, and we find the closest matching photos.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
