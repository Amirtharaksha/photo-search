import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Signing you in...')

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash
      const query = window.location.search
      console.log('Hash:', hash)
      console.log('Query:', query)

      if (hash?.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token') || ''

        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })
        console.log('setSession:', data?.session?.user?.email, error)

        if (data?.session) {
          navigate('/', { replace: true })
          return
        }
      }

      // Try just getting existing session
      const { data: { session } } = await supabase.auth.getSession()
      console.log('getSession:', session?.user?.email)
      if (session) {
        navigate('/', { replace: true })
      } else {
        setStatus('Sign in failed. Redirecting...')
        setTimeout(() => navigate('/login', { replace: true }), 2000)
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
      <p className="text-[#5f6368] text-sm">{status}</p>
    </div>
  )
}