import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Images, Heart, Trash2, BookImage,
  Users, CloudUpload, Search, LogOut
} from 'lucide-react'

const NAV = [
  { to: '/', icon: Images, label: 'Photos' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/favorites', icon: Heart, label: 'Favorites' },
  { to: '/albums', icon: BookImage, label: 'Albums' },
  { to: '/people', icon: Users, label: 'People' },
  { to: '/upload', icon: CloudUpload, label: 'Upload' },
  { to: '/trash', icon: Trash2, label: 'Trash' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const avatar = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.email

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white flex flex-col z-30 border-r border-[#e8eaed]">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16">
        <div className="flex gap-1">
          {['#4285F4','#EA4335','#FBBC04','#34A853'].map((c, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <span className="text-lg font-medium text-[#202124]">PhotoSearch</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors mb-0.5
              ${isActive
                ? 'bg-[#e8f0fe] text-[#1a73e8]'
                : 'text-[#202124] hover:bg-[#f1f3f4]'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-[#e8eaed] flex items-center gap-3">
        {avatar
          ? <img src={avatar} className="w-8 h-8 rounded-full" alt={name} />
          : <div className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center text-white text-xs font-medium">
              {name?.[0]?.toUpperCase()}
            </div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#202124] truncate">{name}</p>
          <p className="text-xs text-[#5f6368] truncate">{user?.email}</p>
        </div>
        <button onClick={signOut} className="p-1.5 hover:bg-[#f1f3f4] rounded-full text-[#5f6368]" title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
