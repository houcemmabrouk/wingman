'use client'

import { useCallback, useEffect, useState } from 'react'
import StatusBanner from '@/components/readiness/StatusBanner'
import BlockersCard, { Blocker, Focus } from '@/components/readiness/BlockersCard'
import TopicBreakdownTable, { TopicRow } from '@/components/readiness/TopicBreakdownTable'
import { styleFor, fmtPct } from '@/components/readiness/status'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

interface Metrics {
  global_retention_pct: number
  coverage_retention_pct: number
  coverage_pct: number
  exam_readiness_pct: number
  total_lms: number
  seen_lms: number
  by_topic: TopicRow[]
}

interface Readiness {
  is_ready: boolean
  global_status: string
  global_message: string
  global_pct: number
  global_target_pct: number
  blockers: Blocker[]
  on_track: Blocker[]
  recommended_focus: Focus[]
  verdict_message: string
}

interface ApiResp {
  metrics: Metrics
  readiness: Readiness
}

function getUserId(): string {
  if (typeof window === 'undefined') return '00000000-0000-0000-0000-000000000001'
  try {
    const raw = localStorage.getItem('wingman_user')
    if (raw) { const p = JSON.parse(raw); if (p?.user_id) return p.user_id }
  } catch { /* ignore */ }
  return '00000000-0000-0000-0000-000000000001'
}

// Mock data — only used when NEXT_PUBLIC_USE_MOCK_DATA=true (never in final build).
const MOCK: ApiResp = {
  metrics: {
    global_retention_pct: 62.3,
    coverage_retention_pct: 68.7,
    coverage_pct: 90.6,
    exam_readiness_pct: 62.3,
    total_lms: 93,
    seen_lms: 48,
    by_topic: [
      { topic_id: 1, topic_name: 'Ethics', topic_weight_pct: 15.0, coverage_pct: 100, global_retention_pct: 72, coverage_retention_pct: 72, seen_lms: 5, total_lms: 5 },
      { topic_id: 4, topic_name: 'Financial Statement Analysis', topic_weight_pct: 15.0, coverage_pct: 58, global_retention_pct: 35, coverage_retention_pct: 60, seen_lms: 7, total_lms: 12 },
      { topic_id: 6, topic_name: 'Equity Investments', topic_weight_pct: 11.0, coverage_pct: 50, global_retention_pct: 30, coverage_retention_pct: 60, seen_lms: 4, total_lms: 8 },
    ],
  },
  readiness: {
    is_ready: false,
    global_status: 'building',
    global_message: 'You are building your base. Keep going.',
    global_pct: 62.3,
    global_target_pct: 70,
    blockers: [
      { topic_name: 'Financial Statement Analysis', topic_weight_pct: 15, tier: 'major', retention_pct: 42, floor_pct: 55, gap_pct: 13, seen_lms: 7, total_lms: 12 },
      { topic_name: 'Equity Investments', topic_weight_pct: 11, tier: 'minor', retention_pct: 38, floor_pct: 45, gap_pct: 7, seen_lms: 4, total_lms: 8 },
    ],
    on_track: [],
    recommended_focus: [
      { topic_name: 'Financial Statement Analysis', current_pct: 42, target_pct: 55, weight_pct: 15 },
      { topic_name: 'Equity Investments',          current_pct: 38, target_pct: 45, weight_pct: 11 },
    ],
    verdict_message: 'Good trajectory — 2 topics to lift before T-30 days.',
  },
}

// ── Page ──────────────────────────────────────────────────

export default function ReadinessPage() {
  const [data, setData] = useState<ApiResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (USE_MOCK) {
      setData(MOCK)
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`${API}/api/readiness/`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json as ApiResp)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">Readiness</h1>
            <p className="text-sm text-slate-400">
              Consolidated view: global retention × coverage × readiness. Updates after every session ends.
            </p>
          </div>
          {!loading && !error && (
            <button
              onClick={fetchData}
              className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
            >
              ↻ Refresh
            </button>
          )}
        </div>
      </div>

      {loading && <ReadinessSkeleton />}

      {error && !loading && (
        <div
          className="rounded-[18px] p-5"
          style={{ background: 'rgba(255,77,77,.06)', border: '1px solid rgba(255,77,77,.30)' }}
        >
          <p className="text-[13px] text-red-300 mb-2">Failed to load the dashboard. <span className="font-mono opacity-70">({error})</span></p>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-red-500/80 hover:bg-red-500"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Banner */}
          <StatusBanner
            status={data.readiness.global_status}
            message={data.readiness.global_message}
            verdict={data.readiness.verdict_message}
            isReady={data.readiness.is_ready}
            globalPct={data.readiness.global_pct}
            targetPct={data.readiness.global_target_pct}
          />

          {/* 3 metrics — single compact strip (was 3 big GaugeCards) */}
          <MetricsStrip
            items={[
              {
                label: 'Global Retention',
                pct: data.metrics.global_retention_pct,
                target: data.readiness.global_target_pct,
                status: data.readiness.global_status,
              },
              {
                label: 'Coverage',
                pct: data.metrics.coverage_pct,
                target: 100,
                status: coverageStatus(data.metrics.coverage_pct),
                hint: `${data.metrics.seen_lms}/${data.metrics.total_lms} LMs`,
              },
              {
                label: 'Exam Readiness',
                pct: data.metrics.exam_readiness_pct,
                target: data.readiness.global_target_pct,
                status: data.readiness.global_status,
              },
            ]}
          />

          {/* Blockers + breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4">
            <BlockersCard
              blockers={data.readiness.blockers}
              recommendedFocus={data.readiness.recommended_focus}
            />
            <TopicBreakdownTable topics={data.metrics.by_topic} />
          </div>
        </>
      )}
    </div>
  )
}

function coverageStatus(pct: number): string {
  if (pct >= 85) return 'excellent'
  if (pct >= 70) return 'ready'
  if (pct >= 55) return 'approaching'
  if (pct >= 40) return 'building'
  if (pct >= 20) return 'behind'
  return 'critical'
}

function ReadinessSkeleton() {
  return (
    <>
      <div className="h-20 rounded-[14px] bg-white/[0.04] animate-pulse" />
      <div className="h-14 rounded-[12px] bg-white/[0.04] animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4">
        <div className="h-64 rounded-[18px] bg-white/[0.04] animate-pulse" />
        <div className="h-64 rounded-[18px] bg-white/[0.04] animate-pulse" />
      </div>
    </>
  )
}

interface MetricItem {
  label: string
  pct: number
  target: number
  status: string
  hint?: string
}

function MetricsStrip({ items }: { items: MetricItem[] }) {
  return (
    <div className="rounded-[12px] border border-white/[0.06] bg-white/[0.02] divide-y md:divide-y-0 md:divide-x divide-white/[0.05] grid grid-cols-1 md:grid-cols-3">
      {items.map(m => {
        const s = styleFor(m.status)
        const clamped = Math.max(0, Math.min(100, m.pct))
        return (
          <div key={m.label} className="px-3.5 py-2.5 min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 truncate">{m.label}</span>
              <span className="text-[9px] tabular-nums text-slate-600 shrink-0">/ {fmtPct(m.target)}</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-[20px] font-extrabold leading-none tabular-nums" style={{ color: s.color }}>
                {fmtPct(clamped)}
              </span>
              {m.hint && <span className="text-[10px] text-slate-500 truncate">{m.hint}</span>}
            </div>
            <div className="relative h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
              <div className="h-full rounded-full" style={{ width: `${clamped}%`, background: s.color }} />
              <div className="absolute top-[-2px] bottom-[-2px] pointer-events-none"
                   style={{ left: `${Math.min(100, m.target)}%`, width: 0, borderLeft: '1px dashed rgba(255,255,255,.4)' }}
                   aria-hidden />
            </div>
          </div>
        )
      })}
    </div>
  )
}
