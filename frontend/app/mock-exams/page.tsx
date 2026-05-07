'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const FALLBACK_UID = '00000000-0000-0000-0000-000000000001'

function getUID(): string {
  if (typeof window === 'undefined') return FALLBACK_UID
  try {
    const raw = localStorage.getItem('wingman_user')
    if (raw) { const p = JSON.parse(raw); if (p?.user_id) return p.user_id }
  } catch { /* ignore */ }
  return FALLBACK_UID
}

interface SessionRow {
  session_id: number
  session_type: string
  started_at: string
  duration_sec: number
  score_pct: number
  questions_total: number
  questions_correct: number
  module_code: string
  module_title: string
  topic_code: string
  has_ai_analysis: boolean
}

const TOPIC_WEIGHTS: { code: string; name: string; weight: string }[] = [
  { code: 'ETH',  name: 'Ethical & Professional Standards', weight: '15-20%' },
  { code: 'QM',   name: 'Quantitative Methods',             weight: '6-9%'   },
  { code: 'ECO',  name: 'Economics',                        weight: '6-9%'   },
  { code: 'FSA',  name: 'Financial Statement Analysis',     weight: '11-14%' },
  { code: 'CORP', name: 'Corporate Issuers',                weight: '6-9%'   },
  { code: 'EQU',  name: 'Equity Investments',               weight: '11-14%' },
  { code: 'FI',   name: 'Fixed Income',                     weight: '11-14%' },
  { code: 'DER',  name: 'Derivatives',                      weight: '5-8%'   },
  { code: 'ALT',  name: 'Alternative Investments',          weight: '7-10%'  },
  { code: 'PM',   name: 'Portfolio Management',             weight: '8-12%'  },
]

function passColor(score: number): string {
  if (score >= 70) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

function fmtDuration(seconds: number): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}`
  return `${m}m`
}

export default function MockExamsPage() {
  const router = useRouter()
  const [history, setHistory] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/api/sessions/history`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : { sessions: [] })
      .then(d => {
        const all: SessionRow[] = d?.sessions || []
        setHistory(all.filter(s => s.session_type === 'mock'))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const startMock = async () => {
    setStarting(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/mock/start`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || data.detail || 'Failed to start mock exam.')
        setStarting(false)
        return
      }
      // Hand off to the session runner via the same prebuilt-session bridge
      // /session uses (matches the QCM runner's existing mock_exam tab).
      try {
        localStorage.setItem('wingman_prebuilt_session', JSON.stringify({
          qcm: data,
          mode: 'mock',
          label: 'Mock Exam — CFA Level I',
          activeTab: 'mock_exam',
        }))
      } catch { /* ignore */ }
      router.push('/session')
    } catch {
      setError('Server connection error.')
      setStarting(false)
    }
  }

  // Stats for the history block
  const completed = history.length
  const bestScore = completed ? Math.max(...history.map(h => h.score_pct || 0)) : 0
  const avgScore = completed ? Math.round(history.reduce((s, h) => s + (h.score_pct || 0), 0) / completed) : 0
  const lastMock = completed ? history[0] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white mb-1">Mock Exams</h1>
        <p className="text-[12px] text-slate-500">
          Full-length CFA Level I simulation — 180 questions, 4h30, distributed by topic exam weight.
        </p>
      </div>

      {/* Hero — start panel + format info */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
        {/* Left: format card */}
        <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/[0.08] to-transparent p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-white">CFA Level I — Mock Exam</h2>
              <p className="text-[10px] text-slate-500">Real exam conditions</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
              <div className="text-[20px] font-extrabold text-white tabular-nums">180</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">Questions</div>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
              <div className="text-[20px] font-extrabold text-white tabular-nums">4h30</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">Duration</div>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
              <div className="text-[20px] font-extrabold text-white tabular-nums">10</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">Topics</div>
            </div>
          </div>

          <div className="rounded-lg border border-red-500/15 bg-red-500/[0.04] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1.5">Exam conditions</div>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li>Questions distributed by official topic weight</li>
              <li>270-minute timer (4h30) — runs in background</li>
              <li>Detailed results + AI analysis at the end</li>
              <li>One attempt locks the score — only run when you&apos;re ready</li>
            </ul>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[11px] text-red-300">{error}</div>
          )}

          <button
            onClick={startMock}
            disabled={starting}
            className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
          >
            {starting ? 'Preparing exam…' : 'Start mock exam →'}
          </button>
        </div>

        {/* Right: topic distribution */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Topic distribution (CFA L1 weights)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {TOPIC_WEIGHTS.map(t => (
              <div key={t.code} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/[0.02]">
                <span className="text-[10px] font-bold w-10 shrink-0" style={{ color: '#a0b4ff' }}>{t.code}</span>
                <span className="text-[11px] text-slate-300 flex-1 min-w-0 truncate">{t.name}</span>
                <span className="text-[10px] font-mono tabular-nums text-slate-500 shrink-0">{t.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="text-[13px] font-bold text-white">History</h2>
            <p className="text-[10px] text-slate-500">All your past mock attempts.</p>
          </div>
          {completed > 0 && (
            <div className="flex items-center gap-3 text-[10px]">
              <Stat label="Attempts" value={`${completed}`} />
              <Stat label="Best" value={`${Math.round(bestScore)}%`} color={passColor(bestScore)} />
              <Stat label="Avg" value={`${avgScore}%`} color={passColor(avgScore)} />
              {lastMock && <Stat label="Last" value={`${Math.round(lastMock.score_pct)}%`} color={passColor(lastMock.score_pct)} />}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-1.5 animate-pulse">
            {[...Array(3)].map((_, i) => <div key={i} className="h-9 bg-white/[0.04] rounded" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-6 text-center">
            <p className="text-[12px] text-slate-400 mb-1">No mock exams yet.</p>
            <p className="text-[10px] text-slate-600">Run one when you feel ready — your first attempt sets the baseline.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-white/[0.06] divide-y divide-white/[0.04] overflow-hidden">
            {history.map(h => {
              const color = passColor(h.score_pct)
              const passed = h.score_pct >= 70
              return (
                <div key={h.session_id} className="flex items-center gap-3 px-3 py-2 hover:bg-white/[0.02]">
                  <span className="text-[11px] text-slate-500 tabular-nums w-32 shrink-0">{fmtDate(h.started_at)}</span>
                  <span className="text-[11px] text-slate-500 tabular-nums w-14 shrink-0">{fmtDuration(h.duration_sec)}</span>
                  <span className="text-[11px] tabular-nums text-slate-400 w-20 shrink-0">
                    {h.questions_correct}/{h.questions_total}
                  </span>
                  <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden min-w-[60px]">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, h.score_pct)}%`, background: color }} />
                  </div>
                  <span className="text-[12px] font-bold tabular-nums w-12 text-right shrink-0" style={{ color }}>
                    {Math.round(h.score_pct)}%
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 w-[60px] text-center"
                        style={{ background: passed ? 'rgba(34,197,94,.10)' : 'rgba(239,68,68,.10)', color, border: `1px solid ${color}33` }}>
                    {passed ? 'Pass' : 'Below'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span className="rounded bg-white/[0.04] px-2 py-1">
      <span className="text-slate-500 mr-1">{label}</span>
      <span className="font-bold tabular-nums" style={{ color: color || '#cbd5e1' }}>{value}</span>
    </span>
  )
}
