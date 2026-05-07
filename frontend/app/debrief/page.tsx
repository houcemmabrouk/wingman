'use client'

import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ChecklistBlock {
  order: number
  topic_code: string
  lm_code?: string
  activity: string
  minutes_planned: number
  done?: boolean
}

interface ChecklistHistoryItem {
  id: number
  session_date: string
  energy: number | null
  confidence: number | null
  minutes_planned: number
  minutes_actual: number
  block_count: number
  los_count: number
  created_at: string
  pdf_url: string
  blocks?: ChecklistBlock[]
}

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
  has_ai_analysis: boolean
}

const TOPIC_COLORS_HEX: Record<string, string> = {
  ETH: '#ef4444', QM: '#a78bfa', ECO: '#3b82f6', FSA: '#22c55e', CORP: '#f59e0b',
  EQU: '#06b6d4', FI: '#6366f1', DER: '#ec4899', ALT: '#b45309', PM: '#8b5cf6',
}

function getUid(): string {
  if (typeof window === 'undefined') return '00000000-0000-0000-0000-000000000001'
  try {
    const raw = localStorage.getItem('wingman_user')
    if (raw) { const p = JSON.parse(raw); if (p?.user_id) return p.user_id }
  } catch { /* ignore */ }
  return '00000000-0000-0000-0000-000000000001'
}

export default function DebriefPage() {
  const [checklists, setChecklists] = useState<ChecklistHistoryItem[]>([])
  const [sessions, setSessions] = useState<SessionHistoryRow[]>([])

  useEffect(() => {
    fetch(`${API}/api/sessions/checklist/history?limit=20&include_blocks=true`, { credentials: 'include' })
      .then(r => r.json())
      .then((data: ChecklistHistoryItem[]) => Array.isArray(data) && setChecklists(data))
      .catch(() => {})

    fetch(`${API}/api/sessions/history?limit=30`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => Array.isArray(d?.sessions) && setSessions(d.sessions))
      .catch(() => {})
  }, [])

  const handleDeleteQuiz = (id: number) => {
    if (!confirm('Delete this session?')) return
    // Optimistic removal — restore on failure
    const before = sessions
    setSessions(prev => prev.filter(s => s.session_id !== id))
    fetch(`${API}/api/sessions/${id}`, { method: 'DELETE', credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`) })
      .catch(() => setSessions(before))
  }

  const handleDeleteStudy = (id: number) => {
    if (!confirm('Delete this study session?')) return
    const before = checklists
    setChecklists(prev => prev.filter(c => c.id !== id))
    fetch(`${API}/api/sessions/checklist/${id}`, { method: 'DELETE', credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`) })
      .catch(() => setChecklists(before))
  }

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      <DailyActivityCard sessions={sessions} />
      <SessionHistoryPanel
        sessions={sessions}
        checklists={checklists}
        onDeleteQuiz={handleDeleteQuiz}
        onDeleteStudy={handleDeleteStudy}
      />
    </div>
  )
}

// ── Daily activity heatmap (last 30 days) ───────────────────────────
function DailyActivityCard({ sessions }: { sessions: SessionHistoryRow[] }) {
  const days = 30
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // Bucket sessions by yyyy-mm-dd
  const byDay = new Map<string, { count: number; minutes: number }>()
  for (const s of sessions) {
    try {
      const d = new Date(s.started_at)
      const key = d.toISOString().slice(0, 10)
      const entry = byDay.get(key) || { count: 0, minutes: 0 }
      entry.count += 1
      entry.minutes += Math.round((s.duration_sec || 0) / 60)
      byDay.set(key, entry)
    } catch { /* ignore malformed */ }
  }
  // Build the trailing 30-day window oldest→newest
  const cells: { date: string; count: number; minutes: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const entry = byDay.get(key) || { count: 0, minutes: 0 }
    cells.push({ date: key, ...entry })
  }
  const activeCount = cells.filter(c => c.count > 0).length
  const totalMin = cells.reduce((s, c) => s + c.minutes, 0)
  const totalSessions = cells.reduce((s, c) => s + c.count, 0)
  const maxMin = cells.reduce((m, c) => Math.max(m, c.minutes), 0) || 1

  const intensity = (mins: number): { bg: string; border: string } => {
    if (mins === 0) return { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.04)' }
    const ratio = mins / maxMin
    if (ratio < 0.25) return { bg: 'rgba(99,102,241,0.18)', border: 'rgba(99,102,241,0.3)' }
    if (ratio < 0.5)  return { bg: 'rgba(99,102,241,0.32)', border: 'rgba(99,102,241,0.5)' }
    if (ratio < 0.75) return { bg: 'rgba(99,102,241,0.55)', border: 'rgba(99,102,241,0.7)' }
    return                { bg: 'rgba(34,197,94,0.7)',     border: 'rgba(34,197,94,0.85)' }
  }

  return (
    <div className="rounded-xl bg-surface-800/50 border border-white/[0.06] p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-[14px] font-bold text-white">Daily activity</h3>
          <p className="text-[10px] text-slate-500">
            Last {days} days · <span className="text-slate-300">{activeCount}</span> active · <span className="text-slate-300">{totalMin}</span> min · <span className="text-slate-300">{totalSessions}</span> sessions
          </p>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-slate-600">
          <span>Less</span>
          {[0.1, 0.4, 0.7, 1].map((r, i) => {
            const t = intensity(r * maxMin)
            return <span key={i} className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: t.bg, border: `1px solid ${t.border}` }} />
          })}
          <span>More</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {cells.map(c => {
          const t = intensity(c.minutes)
          const tooltip = c.count > 0
            ? `${c.date} · ${c.count} session${c.count > 1 ? 's' : ''} · ${c.minutes} min`
            : `${c.date} · no activity`
          return (
            <span
              key={c.date}
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: t.bg, border: `1px solid ${t.border}` }}
              title={tooltip}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Session history panel — quiz + study sessions merged, sorted by date ─
type UnifiedItem =
  | { kind: 'quiz';  ts: number; data: SessionHistoryRow }
  | { kind: 'study'; ts: number; data: ChecklistHistoryItem }

function SessionHistoryPanel({
  sessions,
  checklists,
  onDeleteQuiz,
  onDeleteStudy,
}: {
  sessions: SessionHistoryRow[]
  checklists: ChecklistHistoryItem[]
  onDeleteQuiz: (id: number) => void
  onDeleteStudy: (id: number) => void
}) {
  if (sessions.length === 0 && checklists.length === 0) return null

  const merged: UnifiedItem[] = [
    ...sessions.map<UnifiedItem>(s => ({
      kind: 'quiz',
      ts: new Date(s.started_at).getTime(),
      data: s,
    })),
    ...checklists.map<UnifiedItem>(c => ({
      kind: 'study',
      // Use created_at if available — falls back to session_date midday so
      // checklists land near the same day's quizzes when sorting.
      ts: new Date(c.created_at || (c.session_date + 'T12:00:00')).getTime(),
      data: c,
    })),
  ].sort((a, b) => b.ts - a.ts)

  const quizCount = sessions.length
  const studyCount = checklists.length

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-[14px] font-bold text-white">Session history</h3>
          <p className="text-[10px] text-slate-500">
            <span className="text-blue-400 font-bold">{quizCount}</span> quiz · <span className="text-emerald-400 font-bold">{studyCount}</span> study
          </p>
        </div>
        <span className="text-[10px] text-slate-500">Most recent first</span>
      </div>
      <div className="space-y-3">
        {merged.map(item => item.kind === 'quiz'
          ? <QuizSessionCard key={`q-${item.data.session_id}`} session={item.data} onDelete={onDeleteQuiz} />
          : <StudySessionCard key={`s-${item.data.id}`} checklist={item.data} onDelete={onDeleteStudy} />,
        )}
      </div>
    </div>
  )
}

function TrashButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title={label}
      aria-label={label}
      className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
      </svg>
    </button>
  )
}

function QuizSessionCard({ session, onDelete }: { session: SessionHistoryRow; onDelete: (id: number) => void }) {
  const score = Math.round(session.score_pct || 0)
  const scoreColor = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const topicColor = TOPIC_COLORS_HEX[session.topic_code] || '#6366f1'
  const minutes = Math.round((session.duration_sec || 0) / 60)
  const date = new Date(session.started_at)
  const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) +
                  ' · ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const typeLabel =
    session.session_type === 'quiz' ? 'QCM' :
    session.session_type === 'mock' ? 'MOCK' :
    session.session_type.toUpperCase()

  return (
    <div className="rounded-xl bg-surface-800/40 border border-white/[0.06] p-3">
      <div className="flex items-start gap-2">
        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
              style={{ background: 'rgba(108,140,255,.15)', color: '#a0b4ff' }}>
          {typeLabel}
        </span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white shrink-0" style={{ background: topicColor }}>
          {session.topic_code}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-white truncate">
            {session.module_code} — {session.module_title}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {dateStr} · {minutes} min · {session.questions_correct}/{session.questions_total} correct
            {session.has_ai_analysis && <span className="text-purple-400 ml-1">· AI analysis</span>}
          </p>
        </div>
        <span className="text-[18px] font-extrabold tabular-nums shrink-0" style={{ color: scoreColor }}>
          {score}%
        </span>
        <TrashButton label="Delete this session" onClick={() => onDelete(session.session_id)} />
      </div>
    </div>
  )
}

function StudySessionCard({ checklist, onDelete }: { checklist: ChecklistHistoryItem; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false)
  const ratio = checklist.minutes_planned > 0 ? checklist.minutes_actual / checklist.minutes_planned : 0
  const ratioColor = ratio >= 0.9 ? '#22c55e' : ratio >= 0.5 ? '#f59e0b' : '#ef4444'
  const ratioPct = Math.round(ratio * 100)
  const blocks = checklist.blocks || []
  const hasBlocks = blocks.length > 0

  return (
    <div className="rounded-xl bg-surface-800/40 border border-white/[0.06] overflow-hidden">
      <div className="flex items-stretch">
        <button
          onClick={() => hasBlocks && setExpanded(v => !v)}
          disabled={!hasBlocks}
          className={`flex-1 text-left p-3 transition-colors ${hasBlocks ? 'hover:bg-white/[0.02] cursor-pointer' : 'cursor-default'}`}
        >
        <div className="flex items-start gap-2">
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                style={{ background: 'rgba(34,197,94,.15)', color: '#6ee7b7' }}>
            STUDY
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white flex items-center gap-1.5">
              Daily plan · {checklist.block_count} blocks
              {hasBlocks && (
                <svg className={`w-3 h-3 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {checklist.session_date} · Energy <span className="text-slate-300 font-bold">{checklist.energy ?? '—'}/5</span>
              <span className="ml-1">· Conf. <span className="text-slate-300 font-bold">{checklist.confidence ?? '—'}/5</span></span>
              <span className="ml-1">· <span className="text-slate-300 font-bold tabular-nums">{checklist.minutes_actual}/{checklist.minutes_planned}</span> min</span>
              <span className="ml-1">· {checklist.los_count} LOS</span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[18px] font-extrabold tabular-nums" style={{ color: ratioColor }}>{ratioPct}%</div>
            <a
              href={`${API}${checklist.pdf_url}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline"
            >
              PDF →
            </a>
          </div>
        </div>
        </button>
        <div className="flex items-start pr-2 pt-3">
          <TrashButton label="Delete this session" onClick={() => onDelete(checklist.id)} />
        </div>
      </div>
      {expanded && hasBlocks && (
        <div className="border-t border-white/[0.04] bg-black/20 divide-y divide-white/[0.04]">
          {blocks.map(b => {
            const tColor = TOPIC_COLORS_HEX[b.topic_code] || '#6366f1'
            return (
              <div key={b.order} className="flex items-center gap-2.5 px-3 py-2 text-[11px]">
                <span className="text-[9px] font-bold text-slate-600 w-4 text-right tabular-nums shrink-0">{b.order}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white shrink-0" style={{ background: tColor }}>{b.topic_code}</span>
                {b.lm_code && <span className="text-[9px] font-mono text-slate-500 shrink-0">{b.lm_code}</span>}
                <span className={`flex-1 min-w-0 truncate ${b.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {b.activity}
                </span>
                <span className="text-[10px] text-slate-500 tabular-nums shrink-0">{b.minutes_planned}m</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider shrink-0 ${b.done ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {b.done ? '✓ Done' : 'Skipped'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


function ChecklistHistorySection({ items }: { items: ChecklistHistoryItem[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-400">Session Checklists ({items.length})</span>
      </div>
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-white/[0.04] text-slate-600">
              <th className="text-left px-3 py-2 font-semibold">Date</th>
              <th className="text-center px-2 py-2 font-semibold">Blocks</th>
              <th className="text-center px-2 py-2 font-semibold">Min (act/plan)</th>
              <th className="text-center px-2 py-2 font-semibold">Energy</th>
              <th className="text-center px-2 py-2 font-semibold">Conf.</th>
              <th className="text-right px-3 py-2 font-semibold">PDF</th>
            </tr>
          </thead>
          <tbody>
            {items.map(c => {
              const ratio = c.minutes_planned > 0 ? (c.minutes_actual / c.minutes_planned) : 0
              const ratioColor = ratio >= 0.9 ? '#4ADE80' : ratio >= 0.5 ? '#FBBF24' : '#F87171'
              return (
                <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2 text-slate-300 tabular-nums">{c.session_date}</td>
                  <td className="px-2 py-2 text-center text-slate-400 tabular-nums">{c.block_count}</td>
                  <td className="px-2 py-2 text-center tabular-nums" style={{ color: ratioColor }}>
                    {c.minutes_actual}/{c.minutes_planned}
                  </td>
                  <td className="px-2 py-2 text-center text-slate-400 tabular-nums">{c.energy ?? '—'}/5</td>
                  <td className="px-2 py-2 text-center text-slate-400 tabular-nums">{c.confidence ?? '—'}/5</td>
                  <td className="px-3 py-2 text-right">
                    <a href={`${API}${c.pdf_url}`} target="_blank" rel="noopener noreferrer"
                       className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline">Open</a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
