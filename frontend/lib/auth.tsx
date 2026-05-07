'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const USER_KEY = 'wingman_user'

export interface AuthUser {
  user_id: string
  email: string
  display_name: string
  provider?: string
  image?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  loginWithToken: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount: check if auth is disabled, otherwise check session cookie
  useEffect(() => {
    fetch(`${API}/api/auth/config`)
      .then(res => res.json())
      .then(cfg => {
        if (cfg.auth_disabled) {
          const demo: AuthUser = {
            user_id: '00000000-0000-0000-0000-000000000001',
            email: 'demo@wingman.dev',
            display_name: 'Demo User',
          }
          setUser(demo)
          setLoading(false)
          return
        }
        // Normal auth flow
        const cached = localStorage.getItem(USER_KEY)
        if (cached) {
          try { setUser(JSON.parse(cached)) } catch { /* ignore */ }
        }
        return fetch(`${API}/api/auth/session`, { credentials: 'include' })
          .then(res => {
            if (!res.ok) {
              localStorage.removeItem(USER_KEY)
              setUser(null)
              return null
            }
            return res.json()
          })
          .then((data: AuthUser | null | undefined) => {
            if (data) {
              setUser(data)
              localStorage.setItem(USER_KEY, JSON.stringify(data))
            }
          })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Per-user caches the app writes opportunistically. Listed here so a single
  // helper can flush them whenever the active user changes — otherwise the
  // new account inherits the previous account's progress, exam date, plan
  // snapshot, etc. (e.g. Progress Focus showing 16.8% ETH for a fresh user
  // because the demo user wrote it earlier).
  const PER_USER_CACHE_KEYS = [
    'wingman_topic_progress',
    'wingman_lm_progress',
    'wingman_exam_date_cache',
    'wingman_last_debrief',
    'wingman_last_debrief_ts',
    'wingman_notif_snapshot_v1',
    'wingman_notifs_v1',
    'wingman_pomodoro',
    'wingman_current_session_topic',
    'wingman_current_session_lm',
  ]

  const flushPerUserCaches = async () => {
    for (const k of PER_USER_CACHE_KEYS) {
      try { localStorage.removeItem(k) } catch { /* ignore */ }
    }
    try {
      const { resetUserIdCache } = await import('./wingmanApi')
      resetUserIdCache()
    } catch { /* ignore */ }
  }

  const loginWithToken = useCallback(async (token: string) => {
    const res = await fetch(`${API}/api/auth/me/${token}`, { credentials: 'include' })
    if (!res.ok) throw new Error('Invalid token')
    const data: AuthUser = await res.json()
    // If we're switching to a different user, flush the previous user's caches
    // so we don't show their data on the new account's first paint.
    let prev: AuthUser | null = null
    try {
      const raw = localStorage.getItem(USER_KEY)
      if (raw) prev = JSON.parse(raw)
    } catch { /* ignore */ }
    if (!prev || prev.user_id !== data.user_id) {
      await flushPerUserCaches()
    }
    setUser(data)
    localStorage.setItem(USER_KEY, JSON.stringify(data))
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    } catch { /* ignore */ }
    localStorage.removeItem(USER_KEY)
    setUser(null)
    await flushPerUserCaches()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getAuthHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json' }
}
