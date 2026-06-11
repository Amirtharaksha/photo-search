import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Photos from './pages/Photos'
import SearchPage from './pages/SearchPage'
import Upload from './pages/Upload'
import AuthCallback from './pages/AuthCallback'
import {
  Favorites, Albums, AlbumDetail,
  People, PersonDetail, Trash, SharedPhoto
} from './pages/OtherPages'

function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-64">{children}</div>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/shared/:token" element={<SharedPhoto />} />

      <Route path="/" element={<PrivateRoute><Photos /></PrivateRoute>} />
      <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
      <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
      <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
      <Route path="/albums" element={<PrivateRoute><Albums /></PrivateRoute>} />
      <Route path="/albums/:id" element={<PrivateRoute><AlbumDetail /></PrivateRoute>} />
      <Route path="/people" element={<PrivateRoute><People /></PrivateRoute>} />
      <Route path="/people/:id" element={<PrivateRoute><PersonDetail /></PrivateRoute>} />
      <Route path="/trash" element={<PrivateRoute><Trash /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}