'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TOPIC_COLORS } from '@/lib/lm-data'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Bucket = 'strong' | 'fading' | 'at_risk' | 'unseen'

interface ModuleRow {
  lm_id: number
  lm_code: string
  lm_title: string
  topic_code: string
  topic_name: string
  raw_mastery: number
  effective_mastery: number
  retention: number          // 0..1
  days_since_review: number | null
  repetitions: number
  studied: boolean
  bucket: Bucket
}

interface GlobalStats {
  avg_retention: number          // 0..1
  avg_effective_mastery: number  // 0..100
  total_lms: number
  studied_lms: number
  strong: number
  fading: number
  at_risk: number
  unseen: number
  median_days_since: number | null
}

interface ApiResp {
  global: GlobalStats
  modules: ModuleRow[]
}

const BUCKET_STYLES: Record<Bucket, { label: string; color: string; tint: string }> = {
  strong:  { label: 'Strong',  color: '#22c55e', tint: 'rgba(34,197,94,.08)'  },
  fading:  { label: 'Fading',  color: '#f59e0b', tint: 'rgba(245,158,11,.08)' },
  at_risk: { label: 'At risk', color: '#ef4444', tint: 'rgba(239,68,68,.08)'  },
  unseen:  { label: 'Unseen',  color: '#64748b', tint: 'rgba(100,116,139,.06)'},
}

function getUserId(): string {
  try {
    const raw = localStorage.getItem('wingman_user')
    if (raw) { const p = JSON.parse(raw); if (p?.user_id) return p.user_id }
  } catch { /* ignore */ }
  return '00000000-0000-0000-0000-000000000001'
}

function barColor(ret: number, studied: boolean): string {
  if (!studied) return '#475569'
  if (ret >= 0.80) return '#22c55e'
  if (ret >= 0.50) return '#f59e0b'
  return '#ef4444'
}

// ── WIDGET 1: Global Retention snapshot ────────────────────

function GlobalRetentionWidget({ g }: { g: GlobalStats }) {
  const retPct = Math.round(g.avg_retention * 100)
  const effPct = g.avg_effective_mastery
  const ringColor = retPct >= 70 ? '#22c55e' : retPct >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="rounded-[18px] p-5"
         style={{ background: 'rgba(9,14,28,.55)', border: '1px solid rgba(255,255,255,.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white">Global Retention</h2>
          <p className="text-[11px] text-slate-500">
            Average memory strength across the {g.studied_lms} LMs you've studied
          </p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Ebbinghaus curve
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5 items-center">
        {/* Big ring */}
        <div className="relative w-[200px] h-[200px] mx-auto">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={ringColor} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(retPct / 100) * 326.7} 326.7`}
              style={{ transition: 'stroke-dasharray 0.6s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[36px] font-extrabold text-white tabular-nums leading-none">{retPct}%</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">avg retention</div>
          </div>
        </div>

        {/* Sub-stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-[10px] p-3"
               style={{ background: BUCKET_STYLES.strong.tint, border: `1px solid ${BUCKET_STYLES.strong.color}33` }}>
            <div className="text-[8px] uppercase tracking-wider" style={{ color: BUCKET_STYLES.strong.color }}>Strong</div>
            <div className="text-[18px] font-extrabold tabular-nums mt-0.5" style={{ color: BUCKET_STYLES.strong.color }}>
              {g.strong}
            </div>
            <div className="text-[9px] text-slate-600 mt-0.5">≥ 80%</div>
          </div>
          <div className="rounded-[10px] p-3"
               style={{ background: BUCKET_STYLES.fading.tint, border: `1px solid ${BUCKET_STYLES.fading.color}33` }}>
            <div className="text-[8px] uppercase tracking-wider" style={{ color: BUCKET_STYLES.fading.color }}>Fading</div>
            <div className="text-[18px] font-extrabold tabular-nums mt-0.5" style={{ color: BUCKET_STYLES.fading.color }}>
              {g.fading}
            </div>
            <div className="text-[9px] text-slate-600 mt-0.5">50–79%</div>
          </div>
          <div className="rounded-[10px] p-3"
               style={{ background: BUCKET_STYLES.at_risk.tint, border: `1px solid ${BUCKET_STYLES.at_risk.color}33` }}>
            <div className="text-[8px] uppercase tracking-wider" style={{ color: BUCKET_STYLES.at_risk.color }}>At risk</div>
            <div className="text-[18px] font-extrabold tabular-nums mt-0.5" style={{ color: BUCKET_STYLES.at_risk.color }}>
              {g.at_risk}
            </div>
            <div className="text-[9px] text-slate-600 mt-0.5">&lt; 50%</div>
          </div>
          <div className="rounded-[10px] p-3"
               style={{ background: BUCKET_STYLES.unseen.tint, border: `1px solid ${BUCKET_STYLES.unseen.color}33` }}>
            <div className="text-[8px] text-slate-500 uppercase tracking-wider">Unseen</div>
            <div className="text-[18px] font-extrabold text-slate-400 tabular-nums mt-0.5">{g.unseen}</div>
            <div className="text-[9px] text-slate-600 mt-0.5">never studied</div>
          </div>
        </div>
      </div>

      {/* Secondary line */}
      <div className="mt-4 pt-3 border-t border-white/[0.04] grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
        <div>
          <div className="text-slate-500 uppercase tracking-wider text-[9px]">Avg effective mastery</div>
          <div className="text-white font-bold tabular-nums">{effPct.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-slate-500 uppercase tracking-wider text-[9px]">Studied LMs</div>
          <div className="text-white font-bold tabular-nums">{g.studied_lms}<span className="text-slate-600 font-normal"> / {g.total_lms}</span></div>
        </div>
        <div>
          <div className="text-slate-500 uppercase tracking-wider text-[9px]">Median days since review</div>
          <div className="text-white font-bold tabular-nums">
            {g.median_days_since == null ? '—' : `${g.median_days_since.toFixed(1)}d`}
          </div>
        </div>
        <div>
          <div className="text-slate-500 uppercase tracking-wider text-[9px]">Coverage</div>
          <div className="text-white font-bold tabular-nums">
            {g.total_lms > 0 ? Math.round((g.studied_lms / g.total_lms) * 100) : 0}%
          </div>
        </div>
      </div>
    </div>
  )
}

// ── WIDGET 2: Per-LM retention (accordion, Coverage-by-Module style) ──

function PerLMWidget({ modules }: { modules: ModuleRow[] }) {
  const [expanded, setExpanded] = useState(true)
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set())

  // Group by topic, preserve first-seen ordering.
  const byTopic = (() => {
    const order: string[] = []
    const map: Record<string, { name: string; modules: ModuleRow[] }> = {}
    for (const m of modules) {
      if (!map[m.topic_code]) {
        order.push(m.topic_code)
        map[m.topic_code] = { name: m.topic_name, modules: [] }
      }
      map[m.topic_code].modules.push(m)
    }
    return order.map(code => ({ code, name: map[code].name, modules: map[code].modules }))
  })()

  // Global aggregate (studied only — unseen shouldn't tank the number).
  const studiedAll = modules.filter(m => m.studied)
  const globalAvg = studiedAll.length
    ? studiedAll.reduce((s, m) => s + m.retention, 0) / studiedAll.length
    : 0
  const globalPct = Math.round(globalAvg * 100)
  const globalColor = barColor(globalAvg, studiedAll.length > 0)

  const toggleTopic = (code: string) => {
    setOpenTopics(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(108,140,255,.10)', border: '1px solid rgba(108,140,255,.55)', color: '#a0b4ff' }}>
            ● Retention by Module
          </span>
          <span className="text-[11px] text-slate-500">
            {modules.length} LMs · {studiedAll.length} studied · Ebbinghaus curve
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-40 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: `${globalPct}%`, background: globalColor }} />
          </div>
          <span className="text-[13px] font-bold tabular-nums w-12 text-right" style={{ color: globalColor }}>
            {studiedAll.length === 0 ? '—' : `${globalPct}%`}
          </span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
               fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
          {byTopic.map(group => {
            const isOpen = openTopics.has(group.code)
            const studied = group.modules.filter(m => m.studied)
            const groupAvg = studied.length
              ? studied.reduce((s, m) => s + m.retention, 0) / studied.length
              : 0
            const groupPct = Math.round(groupAvg * 100)
            const groupColor = barColor(groupAvg, studied.length > 0)
            const topicColor = TOPIC_COLORS[group.code] || '#6366f1'

            return (
              <div key={group.code}>
                {/* Topic row */}
                <button
                  onClick={() => toggleTopic(group.code)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <svg className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                       fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                        style={{ background: topicColor }}>{group.code}</span>
                  <span className="text-[12px] text-slate-200 font-medium flex-1 truncate">{group.name}</span>
                  <span className="text-[10px] text-slate-500 tabular-nums">{group.modules.length} LMs</span>
                  <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                         style={{ width: `${groupPct}%`, background: groupColor }} />
                  </div>
                  <span className="text-[11px] font-semibold tabular-nums w-14 text-right" style={{ color: groupColor }}>
                    {studied.length === 0 ? '—' : `${groupPct}%`}
                  </span>
                  <span className="text-[10px] text-slate-500 tabular-nums w-10 text-right">
                    {studied.length}/{group.modules.length}
                  </span>
                </button>

                {/* Modules */}
                {isOpen && (
                  <div className="bg-black/20">
                    {group.modules.map(m => {
                      const retPct = Math.round(m.retention * 100)
                      const color = barColor(m.retention, m.studied)
                      const bucket = BUCKET_STYLES[m.bucket]
                      return (
                        <div key={m.lm_id} className="flex items-center gap-3 px-4 py-1.5 pl-10 hover:bg-white/[0.01]">
                          <span className="text-[10px] font-mono text-slate-500 w-16 shrink-0">{m.lm_code}</span>
                          <span className="text-[11px] text-slate-300 flex-1 min-w-0 truncate">{m.lm_title}</span>
                          <span className="text-[9px] text-slate-600 tabular-nums shrink-0"
                                title={m.studied ? `${m.days_since_review}d since review` : 'never studied'}>
                            {m.studied ? `${Math.round(m.days_since_review || 0)}d` : 'new'}
                          </span>
                          <div className="w-32 h-1 rounded-full overflow-hidden shrink-0"
                               style={{ background: 'rgba(255,255,255,.04)' }}>
                            <div className="h-full rounded-full transition-all duration-500"
                                 style={{ width: `${m.studied ? retPct : 0}%`, background: color }} />
                          </div>
                          <span className="text-[10px] tabular-nums w-10 text-right shrink-0" style={{ color }}>
                            {m.studied ? `${retPct}%` : '—'}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 w-[72px] text-center"
                                style={{ background: bucket.tint, color: bucket.color, border: `1px solid ${bucket.color}33` }}>
                            {bucket.label}
                          </span>
                          <Link
                            href={`/session?mode=srs&lm=${m.lm_id}`}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 transition-colors"
                            style={{
                              background: m.studied ? 'rgba(245,158,11,.12)' : 'rgba(255,255,255,.04)',
                              color: m.studied ? '#fbbf24' : '#64748b',
                              border: `1px solid ${m.studied ? 'rgba(245,158,11,.3)' : 'rgba(255,255,255,.08)'}`,
                            }}
                            title={m.studied ? 'Open SRS review for this module' : 'Start studying this module'}
                          >
                            {m.studied ? 'Review' : 'Start'}
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────

export default function MemoryRetentionPage() {
  const [data, setData] = useState<ApiResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [includeUnseen, setIncludeUnseen] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${API}/api/v1/memory/retention?include_unseen=${includeUnseen}`,
          { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d?.error) setError(d.error); else setData(d as ApiResp) })
      .catch(() => setError('Server connection error.'))
      .finally(() => setLoading(false))
  }, [includeUnseen])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">Memory Retention</h1>
            <p className="text-sm text-slate-400">
              Ebbinghaus-based snapshot of what's still in your head — and what is fading.
              Retention = <span className="font-mono text-slate-300">exp(−days / stability)</span>
              , where stability grows with each review.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {(() => {
              if (!data) return null
              const dueCount = data.global.fading + data.global.at_risk
              if (dueCount === 0) return null
              const dueLms = data.modules
                .filter(m => m.studied && (m.bucket === 'fading' || m.bucket === 'at_risk'))
                .sort((a, b) => a.retention - b.retention)
              const target = dueLms[0]
              if (!target) return null
              return (
                <Link
                  href={`/session?mode=srs&lm=${target.lm_id}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
                  style={{
                    background: 'rgba(245,158,11,.14)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245,158,11,.4)',
                  }}
                  title={`Start with ${target.lm_code} (lowest retention)`}
                >
                  <span>Review due</span>
                  <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(245,158,11,.2)' }}>
                    {dueCount}
                  </span>
                </Link>
              )
            })()}
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-400 select-none cursor-pointer">
              <input type="checkbox" checked={includeUnseen} onChange={e => setIncludeUnseen(e.target.checked)}
                     className="accent-blue-500" />
              Include unseen LMs
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <>
          <div className="h-64 rounded-[18px] bg-white/[0.04] animate-pulse" />
          <div className="h-96 rounded-[18px] bg-white/[0.04] animate-pulse" />
        </>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">{error}</div>
      ) : !data ? null : (
        <>
          <GlobalRetentionWidget g={data.global} />
          <PerLMWidget modules={data.modules} />
        </>
      )}
    </div>
  )
}
