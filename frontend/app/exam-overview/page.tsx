'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import HeatmapGrid from '@/components/HeatmapGrid'
import { EXAM_WEIGHTS as TOPIC_WEIGHTS } from '@/lib/lm-data'

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

interface HeatmapRow {
  lm_code: string
  lm_title: string
  topic: string
  mastery_level: number
  attempts: number
}

interface MemoryRow {
  lm_id: number
  lm_code: string
  lm_title: string
  topic_code: string
  topic_name: string
  raw_mastery: number
  effective_mastery: number
  retention: number
  days_since_review: number | null
  repetitions: number
  studied: boolean
  bucket: 'strong' | 'fading' | 'at_risk' | 'unseen'
}

interface OutcomeRow { id: number; code: string; description: string; bloom_level: number }

interface SessionHistoryRow {
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
}

interface KpiSummary {
  mastery_score: number
  readiness_score: number
  coverage_pct: number
  total_questions_attempted: number
  study_days_last_14: number
  consistency_score: number
}

const BUCKET_THEME: Record<MemoryRow['bucket'], { label: string; color: string; bg: string }> = {
  strong:  { label: 'Strong',  color: '#22c55e', bg: 'rgba(34,197,94,.10)' },
  fading:  { label: 'Fading',  color: '#f59e0b', bg: 'rgba(245,158,11,.10)' },
  at_risk: { label: 'At risk', color: '#ef4444', bg: 'rgba(239,68,68,.10)' },
  unseen:  { label: 'Unseen',  color: '#64748b', bg: 'rgba(100,116,139,.08)' },
}

function daysToExam(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('wingman_onboarding')
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data.exam_date) return null
    const diff = Math.ceil((new Date(data.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  } catch { return null }
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded bg-white/[0.03] px-2 py-1.5">
      <div className="text-[8px] uppercase tracking-wider text-slate-600">{label}</div>
      <div className="text-[12px] font-bold tabular-nums" style={{ color: color || '#cbd5e1' }}>{value}</div>
    </div>
  )
}

export default function ExamOverviewPage() {
  const [heatmap, setHeatmap] = useState<HeatmapRow[]>([])
  const [memory, setMemory] = useState<MemoryRow[]>([])
  const [kpi, setKpi] = useState<KpiSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [outcomes, setOutcomes] = useState<OutcomeRow[]>([])
  const [history, setHistory] = useState<SessionHistoryRow[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const dExam = daysToExam()

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/progress/heatmap`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/api/v1/memory/retention?include_unseen=true`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/kpis`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([h, mem, k]) => {
      if (Array.isArray(h)) setHeatmap(h)
      if (mem?.modules) setMemory(mem.modules)
      if (k) setKpi(k)
    }).finally(() => setLoading(false))
  }, [])

  // Lazy fetch LOS + history when an LM is selected.
  useEffect(() => {
    if (!selectedCode) { setOutcomes([]); setHistory([]); return }
    const selected = memory.find(m => m.lm_code === selectedCode)
    if (!selected) return
    setDetailLoading(true)
    Promise.all([
      fetch(`${API}/api/admin/outcomes/${selected.lm_id}`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/api/sessions/history`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : { sessions: [] }).catch(() => ({ sessions: [] })),
    ]).then(([outs, hist]) => {
      if (Array.isArray(outs)) setOutcomes(outs)
      const sessions: SessionHistoryRow[] = (hist?.sessions || [])
        .filter((s: SessionHistoryRow) => s.module_code === selectedCode)
        .slice(0, 8)
      setHistory(sessions)
    }).finally(() => setDetailLoading(false))
  }, [selectedCode, memory])

  const selected = useMemo(
    () => memory.find(m => m.lm_code === selectedCode) || null,
    [memory, selectedCode],
  )

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-white/[0.04] rounded-xl" />
        <div className="h-72 bg-white/[0.04] rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white mb-0.5">Exam Overview</h1>
          <p className="text-[12px] text-slate-500">
            Heatmap of all 91 modules. Click a cell to inspect that LM in full.
          </p>
        </div>
        {dExam != null && (
          <span className="text-[11px] text-slate-400">
            <span className="font-bold text-white tabular-nums">{dExam}</span> days to exam
          </span>
        )}
      </div>

      {/* Hero KPI strip */}
      {kpi && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile
            label="Mastery"
            value={`${Math.round(kpi.mastery_score)}%`}
            color={kpi.mastery_score >= 70 ? '#22c55e' : kpi.mastery_score >= 50 ? '#f59e0b' : '#ef4444'}
          />
          <KpiTile
            label="Readiness"
            value={`${Math.round(kpi.readiness_score)}%`}
            color={kpi.readiness_score >= 70 ? '#22c55e' : kpi.readiness_score >= 50 ? '#f59e0b' : '#ef4444'}
          />
          <KpiTile
            label="Coverage"
            value={`${Math.round(kpi.coverage_pct)}%`}
            sub={`${kpi.total_questions_attempted} Qs`}
          />
          <KpiTile
            label="Consistency"
            value={`${kpi.study_days_last_14}/14d`}
            sub={`${Math.round(kpi.consistency_score)}%`}
          />
        </div>
      )}

      {/* Heatmap (interactive) */}
      <HeatmapGrid
        items={heatmap}
        onSelect={item => setSelectedCode(prev => prev === item.lm_code ? null : item.lm_code)}
        selectedCode={selectedCode || undefined}
      />

      {/* Detail card (anchored, scrolls into view on selection) */}
      {selected ? (
        <LmDetailCard
          row={selected}
          outcomes={outcomes}
          history={history}
          detailLoading={detailLoading}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-6 text-center text-[12px] text-slate-500">
          Click any cell on the heatmap above to inspect the module.
        </div>
      )}
    </div>
  )
}

function KpiTile({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-surface-800/60 border border-white/[0.06] p-4">
      <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <div className="text-[24px] font-extrabold leading-none tabular-nums" style={{ color: color || '#fff' }}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}

function LmDetailCard({ row, outcomes, history, detailLoading }: {
  row: MemoryRow
  outcomes: OutcomeRow[]
  history: SessionHistoryRow[]
  detailLoading: boolean
}) {
  const theme = BUCKET_THEME[row.bucket]
  const retPct = Math.round(row.retention * 100)
  const examWeight = TOPIC_WEIGHTS[row.topic_code as keyof typeof TOPIC_WEIGHTS] ?? 0
  const passGap = Math.max(0, 60 - row.raw_mastery)
  const examPtsAtStake = Math.round((passGap * examWeight) / 100 * 10) / 10
  const lastSession = history[0]
  const avgRecentScore = history.length
    ? Math.round(history.reduce((s, h) => s + (h.score_pct || 0), 0) / history.length)
    : null
  const totalAttempts = history.reduce((s, h) => s + (h.questions_total || 0), 0)
  const totalCorrect = history.reduce((s, h) => s + (h.questions_correct || 0), 0)
  const totalDurationMin = Math.round(history.reduce((s, h) => s + (h.duration_sec || 0), 0) / 60)

  return (
    <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: `${theme.color}33`, background: theme.bg }}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0" style={{ background: theme.color }}>
          {row.topic_code}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[12px] font-mono text-slate-400">{row.lm_code}</span>
            <h3 className="text-[14px] font-bold text-white truncate">{row.lm_title}</h3>
          </div>
          <span className="text-[10px] text-slate-500">{row.topic_name} · {examWeight}% exam weight</span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0"
              style={{ background: theme.bg, color: theme.color, border: `1px solid ${theme.color}55` }}>
          {theme.label}
        </span>
      </div>

      {/* Memory state */}
      <div>
        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Memory state</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <Stat label="Mastery" value={`${Math.round(row.raw_mastery)}%`} color={theme.color} />
          <Stat label="Effective" value={row.studied ? `${Math.round(row.effective_mastery)}%` : '—'} color={row.studied ? theme.color : '#64748b'} />
          <Stat label="Retention" value={row.studied ? `${retPct}%` : '—'} color={row.studied ? theme.color : '#64748b'} />
          <Stat label="Days since" value={row.studied ? `${Math.round(row.days_since_review || 0)}d` : 'never'} />
          <Stat label="Reviews" value={`${row.repetitions}`} />
          <Stat label="Bucket" value={theme.label} color={theme.color} />
        </div>
      </div>

      {/* Exam impact */}
      <div>
        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Exam impact</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Topic weight" value={`${examWeight}%`} />
          <Stat label="Gap to pass" value={`${passGap}pt`} color={passGap > 0 ? '#f59e0b' : '#22c55e'} />
          <Stat label="Pts at stake" value={`+${examPtsAtStake}`} color="#a78bfa" />
          <Stat label="Sessions tried" value={`${history.length}`} />
        </div>
      </div>

      {/* Activity */}
      {history.length > 0 && (
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Activity (last {history.length} sessions on this LM)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            <Stat
              label="Avg score"
              value={avgRecentScore != null ? `${avgRecentScore}%` : '—'}
              color={avgRecentScore != null && avgRecentScore >= 70 ? '#22c55e' : avgRecentScore != null && avgRecentScore >= 50 ? '#f59e0b' : '#ef4444'}
            />
            <Stat label="Last score" value={lastSession ? `${Math.round(lastSession.score_pct)}%` : '—'} />
            <Stat label="Q attempted" value={`${totalAttempts} (${totalCorrect}✓)`} />
            <Stat label="Time spent" value={`${totalDurationMin}m`} />
          </div>
          <div className="rounded border border-white/[0.06] bg-black/20 divide-y divide-white/[0.04] overflow-hidden">
            {history.map(h => {
              const date = new Date(h.started_at)
              return (
                <div key={h.session_id} className="flex items-center gap-2 px-2 py-1 text-[10px]">
                  <span className="text-slate-500 tabular-nums w-24 shrink-0">
                    {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-600 w-12 shrink-0">{h.session_type}</span>
                  <span className="font-mono tabular-nums w-12 shrink-0"
                        style={{ color: h.score_pct >= 70 ? '#22c55e' : h.score_pct >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {Math.round(h.score_pct)}%
                  </span>
                  <span className="text-slate-500 tabular-nums">{h.questions_correct}/{h.questions_total}</span>
                  <span className="text-slate-600 tabular-nums">{Math.round((h.duration_sec || 0) / 60)}m</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* LOS list */}
      {detailLoading ? (
        <div className="text-[10px] text-slate-500 italic">Loading LOS…</div>
      ) : outcomes.length > 0 ? (
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Learning Outcomes ({outcomes.length})
          </div>
          <div className="rounded border border-white/[0.06] bg-black/20 divide-y divide-white/[0.04] overflow-hidden">
            {outcomes.map(o => (
              <div key={o.id} className="flex items-start gap-2 px-2.5 py-1.5">
                <span className="text-[9px] font-mono text-slate-500 w-20 shrink-0 mt-0.5">{o.code}</span>
                <span className="text-[11px] text-slate-300 flex-1">{o.description}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-600 shrink-0">B{o.bloom_level}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-[10px] text-slate-600 italic">No LOS recorded for this LM.</div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-white/[0.05]">
        <Link
          href={`/sessions?mode=focus_lm&topic=${row.topic_code}&lm=${row.lm_id}`}
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
        >
          Drill QBank →
        </Link>
        <Link
          href={`/session?mode=srs&lm=${row.lm_id}`}
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
        >
          Review SRS →
        </Link>
        <Link
          href={`/library?lm=${row.lm_id}`}
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-white/[0.05] text-slate-300 border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
        >
          Open in Library →
        </Link>
      </div>
    </div>
  )
}
