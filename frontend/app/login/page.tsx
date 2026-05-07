'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Step = 'email' | 'code' | 'sending' | 'pending'
type AuthMode = 'login' | 'register'

export default function LoginPage() {
  const { user, loading, loginWithToken } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [submitting, setSubmitting] = useState(false)

  // If already logged in (or auth disabled → demo user injected), go to dashboard
  useEffect(() => {
    if (!loading && user) router.replace('/')
  }, [loading, user, router])

  // Read backend auth config: skip login page if disabled, hide Google if not configured
  useEffect(() => {
    fetch(`${API}/api/auth/config`)
      .then(r => r.json())
      .then(cfg => {
        if (cfg.auth_disabled) router.replace('/')
        if (cfg.google_enabled) setGoogleEnabled(true)
      })
      .catch(() => {})
  }, [router])

  // Read error / pending from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    const pending = params.get('pending')
    if (pending === 'true') {
      setStep('pending')
    }
    if (err) {
      const messages: Record<string, string> = {
        google_failed: 'Google login failed. Please try again.',
        google_token_failed: 'Google authentication error.',
        google_no_email: 'Could not get your Google email.',
        google_not_configured: 'Google login is not configured on this server.',
      }
      setError(messages[err] || 'An error occurred.')
    }
  }, [])

  const sendCode = async () => {
    if (!email.trim()) return
    setStep('sending')
    setError(null)
    setDevCode(null)
    try {
      const res = await fetch(`${API}/api/auth/send-code`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Failed to send code')
        setStep('email')
        return
      }
      // Dev mode: show code if returned
      if (data._dev_code) setDevCode(data._dev_code)
      setStep('code')
    } catch {
      setError('Connection error')
      setStep('email')
    }
  }

  const verifyCode = async () => {
    if (!code.trim()) return
    setError(null)
    try {
      const res = await fetch(`${API}/api/auth/verify-code`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Invalid code')
        return
      }
      // Account pending activation — show pending state
      if (data.status === 'pending_activation') {
        setPendingMessage(data.message || 'Your account is pending activation by a supervisor.')
        setStep('pending')
        return
      }
      // Login with the token (also sets cookie via response)
      if (data.token) {
        await loginWithToken(data.token)
      }
      router.replace('/')
    } catch {
      setError('Connection error')
    }
  }

  const submitPasswordAuth = async () => {
    if (!email.trim() || !password) return
    if (authMode === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = authMode === 'login'
        ? { email: email.trim(), password }
        : { email: email.trim(), password, display_name: displayName.trim() || undefined }
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Authentication failed')
        return
      }
      if (data.status === 'pending_activation') {
        setPendingMessage(data.message || 'Your account is pending activation by a supervisor.')
        setStep('pending')
        return
      }
      if (data.token) {
        await loginWithToken(data.token)
      }
      router.replace('/')
    } catch {
      setError('Connection error')
    } finally {
      setSubmitting(false)
    }
  }

  const loginWithGoogle = () => {
    window.location.href = `${API}/api/auth/google`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-purple-500">Wing</span>man
          </h1>
          <p className="text-sm text-slate-500 mt-2">CFA Level I Performance Copilot</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-5">

          {/* Password login (primary) */}
          {step === 'email' && (
            <>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-white/[0.04] p-1">
                <button
                  onClick={() => { setAuthMode('login'); setError(null) }}
                  className={`py-2 rounded-md text-sm font-medium transition-colors ${
                    authMode === 'login' ? 'bg-white/[0.10] text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setError(null) }}
                  className={`py-2 rounded-md text-sm font-medium transition-colors ${
                    authMode === 'register' ? 'bg-white/[0.10] text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Create
                </button>
              </div>
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitPasswordAuth()}
                  placeholder="you@example.com"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitPasswordAuth()}
                  placeholder={authMode === 'register' ? '8 characters minimum' : 'Your password'}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                />
              </div>
              <button
                onClick={submitPasswordAuth}
                disabled={!email.trim() || !password || submitting}
                className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                {submitting ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}
              </button>
              <button
                onClick={sendCode}
                disabled={!email.trim()}
                className="w-full text-xs text-slate-500 hover:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Send a one-time code instead
              </button>
            </>
          )}

          {step === 'sending' && (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-slate-400">Sending code...</span>
            </div>
          )}

          {step === 'code' && (
            <>
              <div className="text-center">
                <p className="text-sm text-slate-300">
                  Code sent to <span className="text-purple-400 font-medium">{email}</span>
                </p>
                {devCode && (
                  <p className="mt-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg py-2 px-3">
                    Dev mode — your code: <span className="font-mono font-bold text-lg">{devCode}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">6-digit code</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && verifyCode()}
                  placeholder="000000"
                  autoFocus
                  maxLength={6}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm text-center font-mono text-xl tracking-[0.3em] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <button
                onClick={verifyCode}
                disabled={code.length !== 6}
                className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                Verify & Login
              </button>
              <button
                onClick={() => { setStep('email'); setCode(''); setError(null); setDevCode(null) }}
                className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Use a different email
              </button>
            </>
          )}

          {/* Pending activation */}
          {step === 'pending' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">Account Pending Activation</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {pendingMessage || 'Your account has been registered. A supervisor must activate it before you can log in. You will receive an email once activated.'}
              </p>
              <button
                onClick={() => { setStep('email'); setCode(''); setError(null); setDevCode(null); setPendingMessage(null) }}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                Back to login
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Divider */}
          {step !== 'code' && step !== 'pending' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#0f1117] px-3 text-slate-500">or continue with</span>
                </div>
              </div>

              {/* Social buttons */}
              <div className="flex gap-3">
                <button
                  onClick={loginWithGoogle}
                  disabled={!googleEnabled}
                  title={googleEnabled ? undefined : 'Google login not configured'}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition-colors ${
                    googleEnabled
                      ? 'bg-white/[0.05] hover:bg-white/[0.08] border-white/[0.08] text-white'
                      : 'bg-white/[0.05] border-white/[0.06] text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button
                  disabled
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.06] text-slate-500 text-sm cursor-not-allowed opacity-50"
                  title="Coming soon"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Passwords are stored as secure hashes. New accounts may require activation.
        </p>
      </div>
    </div>
  )
}
