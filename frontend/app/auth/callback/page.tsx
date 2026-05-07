'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function AuthCallbackPage() {
  const { loginWithToken } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('No token provided')
      return
    }

    loginWithToken(token)
      .then(() => router.replace('/'))
      .catch(() => {
        setError('Invalid or expired token')
        setTimeout(() => router.replace('/login'), 3000)
      })
  }, [searchParams, loginWithToken, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm text-red-400 mb-2">{error}</p>
            <p className="text-xs text-slate-500">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-400">Logging in...</p>
          </>
        )}
      </div>
    </div>
  )
}
