'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TOPIC_COLORS } from '@/lib/lm-data'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface MonthDay {
  day_offset: number
  date: string
  weekday: string
  focus_topic_codes: string[]
  total_minutes: number
  includes_mock: boolean
  includes_srs: boolean
  is_rest_day: boolean
  source: 'planned' | 'projected'
}

interface MonthOutlookResponse {
  user_id: string
  days: number
  outlook: MonthDay[]
  planned_minutes: number
  rest_days: number
  mock_days: number
  source_split: { planned: number; projected: number }
}

function getUserId(): string {
  try {
    const raw = localStorage.getItem('wingman_user')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.user_id) return parsed.user_id
    }
  } catch { /* ignore */ }
  return '00000000-0000-0000-0000-000000000001'
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch {
    return iso
  }
}

export default function MonthOutlookPage() {
  const [data, setData] = useState<MonthOutlookResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${API}/api/plan/month-outlook?days=${days}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d?.error) setError(d.error)
        else setData(d as MonthOutlookResponse)
      })
      .catch(() => setError('Server connection error.'))
      .finally(() => setLoading(false))
  }, [days])

  const totalHours = data ? Math.round(data.planned_minutes / 60) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-baseline gap-3 mb-1">
              <h1 className="text-xl font-bold text-white">Month Outlook</h1>
              <Link href="/planning" className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline">
                ← Back to 7-day plan
              </Link>
            </div>
            <p className="text-sm text-slate-400">
              {days}-day projection. Days 0–6 come from the live LLM plan; days 7+ extrapolate the weekly pattern.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {[14, 30, 60].map(n => (
              <button
                key={n}
                onClick={() => setDays(n)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  days === n
                    ? 'bg-blue-600 text-white border border-blue-500'
                    : 'bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08]'
                }`}
              >
                {n}d
              </button>
            ))}
          </div>
        </div>

        {/* KPI strip */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <div className="rounded-[10px] p-2.5" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
              <div className="text-[8px] text-slate-500 uppercase tracking-wider">Total time</div>
              <div className="text-[16px] font-extrabold text-white tabular-nums mt-0.5">{totalHours}h</div>
              <div className="text-[9px] text-slate-600">{data.planned_minutes} min planned</div>
            </div>
            <div className="rounded-[10px] p-2.5" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
              <div className="text-[8px] text-slate-500 uppercase tracking-wider">Rest days</div>
              <div className="text-[16px] font-extrabold text-white tabular-nums mt-0.5">{data.rest_days}</div>
            </div>
            <div className="rounded-[10px] p-2.5" style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.18)' }}>
              <div className="text-[8px] text-amber-400 uppercase tracking-wider">Mock days</div>
              <div className="text-[16px] font-extrabold text-amber-400 tabular-nums mt-0.5">{data.mock_days}</div>
            </div>
            <div className="rounded-[10px] p-2.5" style={{ background: 'rgba(108,140,255,.06)', border: '1px solid rgba(108,140,255,.18)' }}>
              <div className="text-[8px] uppercase tracking-wider" style={{ color: '#a0b4ff' }}>Source split</div>
              <div className="text-[12px] font-extrabold text-white tabular-nums mt-0.5">
                <span className="text-emerald-400">{data.source_split.planned}</span>
                <span className="opacity-60"> · </span>
                <span style={{ color: '#a0b4ff' }}>{data.source_split.projected}</span>
              </div>
              <div className="text-[9px] text-slate-600">planned · projected</div>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-7 gap-2">
          {[...Array(14)].map((_, i) => <div key={i} className="h-24 bg-white/[0.04] rounded-lg animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">{error}</div>
      ) : !data ? null : (
        <div className="card">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {data.outlook.map(d => {
              const isProjected = d.source === 'projected'
              return (
                <div
                  key={d.day_offset}
                  className="p-2.5 rounded-lg text-center transition-all hover:scale-[1.02]"
                  style={{
                    background: d.is_rest_day
                      ? 'rgba(255,255,255,.01)'
                      : isProjected ? 'rgba(108,140,255,.04)' : 'rgba(255,255,255,.03)',
                    border: `1px solid ${
                      d.is_rest_day
                        ? 'rgba(255,255,255,.04)'
                        : isProjected ? 'rgba(108,140,255,.18)' : 'rgba(255,255,255,.06)'
                    }`,
                    opacity: isProjected ? 0.85 : 1,
                  }}
                >
                  <div className="text-[8px] text-slate-600 uppercase tracking-wider">
                    {d.day_offset === 0 ? 'Today' : `+${d.day_offset}d`}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                    {d.weekday} {formatDate(d.date)}
                  </div>
                  <div className="text-[12px] font-bold text-white mt-1 tabular-nums">
                    {d.is_rest_day ? 'Rest' : `${d.total_minutes}m`}
                  </div>
                  <div className="flex flex-wrap gap-0.5 justify-center mt-1.5 min-h-[16px]">
                    {d.focus_topic_codes.slice(0, 3).map(t => (
                      <span key={t} className="text-[8px] font-bold px-1 py-0.5 rounded text-white"
                        style={{ background: TOPIC_COLORS[t] || '#6366f1' }}>
                        {t}
                      </span>
                    ))}
                    {d.focus_topic_codes.length > 3 && (
                      <span className="text-[8px] text-slate-500">+{d.focus_topic_codes.length - 3}</span>
                    )}
                  </div>
                  <div className="flex justify-center gap-1 mt-1.5">
                    {d.includes_mock && <span className="text-[10px] text-amber-400" title="Mock">●</span>}
                    {d.includes_srs && <span className="text-[10px] text-emerald-400" title="SRS">●</span>}
                  </div>
                  {isProjected && (
                    <div className="text-[7px] text-slate-600 uppercase tracking-wider mt-1">proj.</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.04] text-[10px]">
            <span className="text-amber-400">● Mock</span>
            <span className="text-emerald-400">● SRS</span>
            <span className="text-slate-500">
              <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: 'rgba(255,255,255,.06)' }} />
              Planned (LLM)
            </span>
            <span className="text-slate-500">
              <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: 'rgba(108,140,255,.18)' }} />
              Projected (cycle)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
