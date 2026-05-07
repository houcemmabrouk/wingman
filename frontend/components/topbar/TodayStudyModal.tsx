'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Modal, ModalCard } from '@/components/ui/Modal'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const FALLBACK_UID = '00000000-0000-0000-0000-000000000001'

interface TodayStats {
  sessions_today: number
  total_minutes: number
  quiz_minutes: number
  quiz_sessions: number
  study_minutes: number
  study_sessions: number
  study_planned_minutes: number
  study_blocks: number
  daily_goal_minutes: number
  global_minutes?: number
  global_quiz_minutes?: number
  global_study_minutes?: number
  global_sessions?: number
  global_active_days?: number
}

const WORK_MIN_LOCAL = 45  // mirror PomodoroWidget's WORK_MIN

interface PomodoroLocalState {
  todayMin: number
  todayCount: number
  phase: 'idle' | 'work' | 'break'
}

function readPomodoroLocal(): PomodoroLocalState {
  try {
    const raw = localStorage.getItem('wingman_pomodoro')
    if (!raw) return { todayMin: 0, todayCount: 0, phase: 'idle' }
    const ps = JSON.parse(raw)
    const count = Number(ps?.todayPomodoros) || 0
    let mins = count * WORK_MIN_LOCAL
    if (ps?.phase === 'work' && typeof ps.secondsLeft === 'number') {
      const elapsed = Math.max(0, WORK_MIN_LOCAL * 60 - ps.secondsLeft)
      mins += Math.round(elapsed / 60)
    }
    return { todayMin: mins, todayCount: count, phase: ps?.phase || 'idle' }
  } catch {
    return { todayMin: 0, todayCount: 0, phase: 'idle' }
  }
}

function fmtHours(min: number): string {
  if (min < 60) return `${Math.round(min)} min`
  const h = Math.floor(min / 60)
  const m = Math.round(min - h * 60)
  return `${h}h ${m.toString().padStart(2, '0')}`
}

interface Props {
  open: boolean
  onClose: () => void
}

function getUid(): string {
  if (typeof window === 'undefined') return FALLBACK_UID
  try {
    const raw = localStorage.getItem('wingman_user')
    if (raw) { const p = JSON.parse(raw); if (p?.user_id) return p.user_id }
  } catch { /* ignore */ }
  return FALLBACK_UID
}

export default function TodayStudyModal({ open, onClose }: Props) {
  const [stats, setStats] = useState<TodayStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [pomo, setPomo] = useState<PomodoroLocalState>({ todayMin: 0, todayCount: 0, phase: 'idle' })

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const fetchStats = () =>
      fetch(`${API}/api/kpis/today-stats`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(d => setStats(d))
        .catch(() => {})
        .finally(() => setLoading(false))
    fetchStats()
    // Live refresh every 15s while modal is open + tick the local pomodoro each second.
    const statsId = setInterval(fetchStats, 15_000)
    const pomoId = setInterval(() => setPomo(readPomodoroLocal()), 1_000)
    setPomo(readPomodoroLocal())
    return () => { clearInterval(statsId); clearInterval(pomoId) }
  }, [open])

  // Today minutes shown = backend (quiz+study) + pomodoro live counter.
  const backendToday = stats?.total_minutes ?? 0
  const total = Math.round(backendToday + pomo.todayMin)
  const goal = stats?.daily_goal_minutes ?? 90
  const goalPct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0
  const goalColor = goalPct >= 100 ? '#22c55e' : goalPct >= 60 ? '#f59e0b' : '#ef4444'

  const quizMin = stats?.quiz_minutes ?? 0
  const studyMin = stats?.study_minutes ?? 0
  const pomoMin = pomo.todayMin
  const denom = Math.max(1, quizMin + studyMin + pomoMin)
  const quizShare = (quizMin / denom) * 100
  const studyShare = (studyMin / denom) * 100
  const pomoShare = (pomoMin / denom) * 100

  return (
    <Modal open={open} onClose={onClose} panelClassName="w-full max-w-[480px]">
      <ModalCard>
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-[15px] font-bold text-white">Today&apos;s study time</h2>
            <p className="text-[10px] text-slate-500">All sources combined · live from backend</p>
          </div>
          <button onClick={onClose}
                  aria-label="Close"
                  className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading && !stats ? (
            <div className="px-5 py-8 text-center text-[12px] text-slate-500">Loading…</div>
          ) : !stats ? (
            <div className="px-5 py-8 text-center text-[12px] text-red-400">Failed to load today&apos;s stats.</div>
          ) : (
            <>
              {/* Hero — total + goal progress */}
              <div className="px-5 py-5 border-b border-white/[0.04]">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[44px] font-black leading-none tabular-nums" style={{ color: goalColor }}>
                    {total}
                  </span>
                  <span className="text-[14px] text-slate-500">min</span>
                  <span className="ml-auto text-[10px] text-slate-500 tabular-nums">
                    Goal <span className="font-bold text-white">{goal}m</span>
                  </span>
                </div>
                <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                       style={{ width: `${goalPct}%`, background: goalColor }} />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-slate-500 tabular-nums">
                  <span>{goalPct}% of daily goal</span>
                  <span>{Math.max(0, goal - total).toFixed(0)} min to go</span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="px-5 py-4 border-b border-white/[0.04]">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-3">Where the time went</div>

                {/* Stacked bar */}
                <div className="relative h-2 rounded-full overflow-hidden flex mb-3" style={{ background: 'rgba(255,255,255,.04)' }}>
                  {studyMin > 0 && <div style={{ width: `${studyShare}%`, background: '#10b981' }} />}
                  {quizMin > 0 && <div style={{ width: `${quizShare}%`, background: '#6c8cff' }} />}
                  {pomoMin > 0 && <div style={{ width: `${pomoShare}%`, background: '#f59e0b' }} />}
                </div>

                <div className="space-y-2 text-[12px]">
                  <Row
                    color="#10b981"
                    label="Study sessions"
                    sub={`${stats.study_sessions} checklist${stats.study_sessions > 1 ? 's' : ''} · ${stats.study_blocks} block${stats.study_blocks > 1 ? 's' : ''} · planned ${stats.study_planned_minutes}m`}
                    minutes={studyMin}
                    href="/debrief"
                  />
                  <Row
                    color="#6c8cff"
                    label="Quiz / Mock"
                    sub={`${stats.quiz_sessions} session${stats.quiz_sessions > 1 ? 's' : ''}`}
                    minutes={quizMin}
                    href="/results"
                  />
                  <Row
                    color="#f59e0b"
                    label={pomo.phase === 'work' ? 'Pomodoro · running' : 'Pomodoro'}
                    sub={`${pomo.todayCount} cycle${pomo.todayCount > 1 ? 's' : ''} today${pomo.phase === 'work' ? ' · live tick' : ''}`}
                    minutes={pomoMin}
                  />
                </div>
              </div>

              {/* Global cumulative */}
              {stats.global_minutes != null && (
                <div className="px-5 py-4 border-b border-white/[0.04]">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-3">All-time total</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
                    <GlobalStat label="Total time" value={fmtHours(stats.global_minutes || 0)} color="#cbd5e1" />
                    <GlobalStat label="Sessions" value={`${stats.global_sessions ?? 0}`} color="#a0b4ff" />
                    <GlobalStat label="Active days" value={`${stats.global_active_days ?? 0}`} color="#a78bfa" />
                    <GlobalStat
                      label="Avg / day"
                      value={
                        (stats.global_active_days || 0) > 0
                          ? fmtHours((stats.global_minutes || 0) / (stats.global_active_days || 1))
                          : '—'
                      }
                      color="#10b981"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                    <span>Quiz/Mock <span className="font-bold text-slate-300">{fmtHours(stats.global_quiz_minutes || 0)}</span></span>
                    <span>Study <span className="font-bold text-slate-300">{fmtHours(stats.global_study_minutes || 0)}</span></span>
                  </div>
                </div>
              )}

              {/* Encouragement / actions */}
              <div className="px-5 py-3 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500">
                  {goalPct >= 100
                    ? 'Goal hit — bonus minutes count too.'
                    : goalPct >= 60
                      ? 'Halfway there — push through.'
                      : 'Time to start a session.'}
                </span>
                <Link href="/" onClick={onClose}
                      className="text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300">
                  Today Mission →
                </Link>
              </div>
            </>
          )}
        </div>
      </ModalCard>
    </Modal>
  )
}

function Row({ color, label, sub, minutes, href }: {
  color: string
  label: string
  sub: string
  minutes: number
  href?: string
}) {
  const inner = (
    <>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-white">{label}</div>
        <div className="text-[10px] text-slate-500 truncate">{sub}</div>
      </div>
      <span className="text-[14px] font-bold tabular-nums shrink-0" style={{ color }}>
        {minutes}<span className="text-[10px] text-slate-500 ml-0.5 font-normal">m</span>
      </span>
    </>
  )
  if (href) {
    return (
      <Link href={href} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
        {inner}
      </Link>
    )
  }
  return <div className="flex items-center gap-3 p-2 rounded-lg">{inner}</div>
}

function GlobalStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-[14px] font-bold tabular-nums mt-0.5" style={{ color }}>{value}</div>
    </div>
  )
}
