import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signInWithGoogle } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-8 max-w-sm w-full px-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            {['#4285F4','#EA4335','#FBBC04','#34A853'].map((c, i) => (
              <div key={i} className="w-4 h-4 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <h1 className="text-3xl font-normal text-[#202124]">Photo Search</h1>
          <p className="text-sm text-[#5f6368] text-center">
            Search your photos with natural language.<br />
            Find any moment, instantly.
          </p>
        </div>

        {/* Sign in card */}
        <div className="w-full border border-[#dadce0] rounded-xl p-8 flex flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-xl font-normal text-[#202124]">Sign in</h2>
            <p className="text-sm text-[#5f6368] mt-1">to continue to PhotoSearch</p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 border border-[#dadce0] rounded-full py-2.5 px-6 text-sm font-medium text-[#3c4043] hover:bg-[#f8f9fa] hover:border-[#c6c6c6] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.31z"/>
            </svg>
            Sign in with Google
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 w-full text-center">
          {[
            { icon: '🔍', label: 'Natural language search' },
            { icon: '🗂️', label: 'Auto-organized albums' },
            { icon: '👤', label: 'Face recognition' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <span className="text-2xl">{icon}</span>
              <span className="text-xs text-[#5f6368]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
