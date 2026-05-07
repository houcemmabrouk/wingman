'use client'

import { useEffect, useState, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Session {
  session_id: number
  session_type: string
  started_at: string
  duration_sec: number | null
  score_pct: number | null
  questions_total: number | null
  questions_correct: number | null
  module_code: string | null
  module_title: string | null
  topic_code: string | null
  has_ai_analysis: boolean
}

interface Props {
  userId: string
  onViewSession: (sessionId: number) => void
}

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  quiz: { label: 'QCM', cls: 'bg-blue-500/15 text-blue-400' },
  mock_exam: { label: 'Mock', cls: 'bg-purple-500/15 text-purple-400' },
  review: { label: 'Review', cls: 'bg-amber-500/15 text-amber-400' },
  study: { label: 'Etude', cls: 'bg-emerald-500/15 text-emerald-400' },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatDuration(sec: number | null) {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  return m < 60 ? `${m}min` : `${Math.floor(m / 60)}h${(m % 60).toString().padStart(2, '0')}`
}

export default function SessionHistory({ userId, onViewSession }: Props) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/sessions/history?limit=30`, { credentials: 'include' })
      const data = await res.json()
      setSessions(data.sessions || [])
      setTotal(data.total || 0)
    } catch { /* ignore */ }
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.session_type === filter)

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-white/[0.04] rounded-lg" />)}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-500">{total} sessions</span>
        <div className="flex gap-1 ml-auto">
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'quiz', label: 'QCM' },
            { key: 'mock_exam', label: 'Mock' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                filter === f.key ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-600 text-center py-8">No completed sessions</p>
      ) : (
        <div className="space-y-1">
          {filtered.map(s => {
            const badge = TYPE_BADGE[s.session_type] || TYPE_BADGE.study
            const scoreColor = s.score_pct != null
              ? s.score_pct >= 80 ? 'text-emerald-400' : s.score_pct >= 60 ? 'text-amber-400' : 'text-red-400'
              : 'text-slate-600'
            return (
              <button
                key={s.session_id}
                onClick={() => onViewSession(s.session_id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all text-left"
              >
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-300 truncate">
                    {s.module_code ? `${s.module_code} — ${s.module_title || ''}` : 'Exam complet'}
                  </p>
                  <p className="text-[9px] text-slate-600">{s.started_at ? formatDate(s.started_at) : '—'}</p>
                </div>
                {s.score_pct != null && (
                  <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>{Math.round(s.score_pct)}%</span>
                )}
                <span className="text-[10px] text-slate-600">{formatDuration(s.duration_sec)}</span>
                {s.has_ai_analysis && (
                  <span className="w-2 h-2 rounded-full bg-purple-500" title="AI analysis available" />
                )}
                <svg className="w-3 h-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
