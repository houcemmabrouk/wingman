'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { TOPICS, TOPIC_COLORS, TOPIC_ORDER, EXAM_WEIGHTS as TOPIC_WEIGHTS } from '@/lib/lm-data'
import HelpTooltip from '@/components/ui/HelpTooltip'

// ── Types ──
type Verdict = 'on_track' | 'slight_delay' | 'behind' | 'ahead'

interface SkillAssessment {
  topic: string
  name: string
  pct: number
  color: string
  weight: number
  status: 'strong' | 'developing' | 'weak' | 'critical'
  trend: 'up' | 'stable' | 'down'
}

// ── Constants ──

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  strong:     { bg: 'rgba(34,197,94,0.12)',   text: '#4ADE80', label: 'Strong' },
  developing: { bg: 'rgba(59,130,246,0.12)',  text: '#60A5FA', label: 'Developing' },
  weak:       { bg: 'rgba(245,158,11,0.12)',  text: '#FBBF24', label: 'Weak' },
  critical:   { bg: 'rgba(239,68,68,0.12)',   text: '#F87171', label: 'Critical' },
}

const VERDICT_CONFIG: Record<Verdict, { emoji: string; title: string; color: string }> = {
  ahead:        { emoji: '🚀', title: 'Ahead of Schedule', color: '#22c55e' },
  on_track:     { emoji: '✅', title: 'On Track',          color: '#3b82f6' },
  slight_delay: { emoji: '⚡', title: 'Slight Delay',      color: '#f59e0b' },
  behind:       { emoji: '🔥', title: 'Behind Schedule',   color: '#ef4444' },
}

// ── Dynamic insight generator ──
function generateInsight(
  weaknesses: SkillAssessment[],
  strengths: SkillAssessment[],
  skills: SkillAssessment[],
  overallMastery: number,
  delta: number,
  daysToExam: number,
): string {
  const lines: string[] = []

  // Critical weakness detection
  const criticals = weaknesses.filter(w => w.status === 'critical')
  const heavyWeaks = weaknesses.filter(w => w.weight >= 10)

  if (criticals.length > 0) {
    const c = criticals[0]
    const potentialGain = Math.round(c.weight * 0.35)
    lines.push(`Alert: ${c.topic} (${c.name}) is at ${c.pct}% with ${c.weight}% exam weight — this is your biggest leak. Closing this gap to 50% could gain you ~${potentialGain} points on exam day.`)
  }

  if (heavyWeaks.length > 0 && (criticals.length === 0 || heavyWeaks[0].topic !== criticals[0]?.topic)) {
    const h = heavyWeaks[0]
    lines.push(`${h.topic} is underperforming at ${h.pct}% for a ${h.weight}%-weighted topic. Each session here has outsized ROI — prioritize it.`)
  }

  // Imbalance detection
  const maxPct = Math.max(...skills.map(s => s.pct))
  const minPct = Math.min(...skills.map(s => s.pct))
  const gap = maxPct - minPct
  if (gap > 45) {
    const best = skills.find(s => s.pct === maxPct)!
    const worst = skills.find(s => s.pct === minPct)!
    lines.push(`Imbalance detected: ${gap}pt spread between ${best.topic} (${maxPct}%) and ${worst.topic} (${minPct}%). The CFA penalizes weak areas more than it rewards strong ones — rebalance your time.`)
  }

  // Cluster analysis
  const below35 = skills.filter(s => s.pct < 35)
  if (below35.length >= 3) {
    lines.push(`${below35.length} topics are below 35%: ${below35.map(s => s.topic).join(', ')}. This is a red zone cluster — dedicate 2+ sessions/week to each until they break 40%.`)
  }

  // Time pressure
  if (daysToExam < 60 && overallMastery < 50) {
    lines.push(`With J-${daysToExam} and ${overallMastery}% average mastery, every hour counts. Focus exclusively on high-weight topics (ETH, FSA, FI, EQU) to maximize your score ceiling.`)
  } else if (daysToExam < 90 && below35.length > 2) {
    lines.push(`J-${daysToExam}: ${below35.length} weak topics need attention before mocks start. Target 45%+ across all subjects in the next 3 weeks.`)
  }

  // Strength leverage
  if (strengths.length >= 2) {
    const strongNames = strengths.map(s => s.topic).join(' & ')
    lines.push(`${strongNames} are solid — shift time from these to weaker high-weight areas. Maintaining 65%+ requires only light review.`)
  }

  // Quick win detection
  const nearBreakthrough = skills.filter(s => s.pct >= 40 && s.pct < 50 && s.weight >= 10)
  if (nearBreakthrough.length > 0) {
    const n = nearBreakthrough[0]
    lines.push(`Quick win: ${n.topic} is at ${n.pct}% — just ${50 - n.pct} points from the "developing" zone. One strong session could flip it.`)
  }

  // Fallback
  if (lines.length === 0) {
    if (delta >= 0) lines.push(`Mastery at ${overallMastery}% with ${daysToExam} days remaining — you're tracking well. Continue systematic coverage and increase mock frequency.`)
    else lines.push(`${Math.abs(delta)}% behind target pace. Focus high-weight weak topics this week to close the gap.`)
  }

  return lines.join('\n\n')
}

// ── Analysis engine ──
function getProgress(): Record<string, number> {
  try {
    const stored = localStorage.getItem('wingman_topic_progress')
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return { ETH: 42, QM: 28, ECO: 35, FSA: 51, CORP: 19, EQU: 69, FI: 22, DER: 15, ALT: 38, PM: 44 }
}

function getDaysToExam(): number {
  try {
    const raw = localStorage.getItem('wingman_onboarding')
    if (raw) {
      const data = JSON.parse(raw)
      if (data.exam_date) {
        return Math.max(0, Math.ceil((new Date(data.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      }
    }
  } catch { /* ignore */ }
  return 120 // default
}

// Optional peerStats override — when supplied (from /api/kpis/peer-stats),
// the analysis uses those benchmarks instead of any local hardcoded fallback.
function analyze(progress: Record<string, number>, daysToExam: number, _peerStats?: Record<string, number>) {
  // Weighted average mastery
  let totalWeight = 0
  let weightedSum = 0
  const skills: SkillAssessment[] = []

  TOPIC_ORDER.forEach(t => {
    const pct = progress[t] ?? 0
    const w = TOPIC_WEIGHTS[t] ?? 5
    totalWeight += w
    weightedSum += pct * w

    const status: SkillAssessment['status'] =
      pct >= 65 ? 'strong' : pct >= 45 ? 'developing' : pct >= 25 ? 'weak' : 'critical'

    // Simulated trend based on mastery level
    const trend: SkillAssessment['trend'] =
      pct >= 50 ? 'up' : pct >= 30 ? 'stable' : 'down'

    skills.push({ topic: t, name: TOPICS[t], pct, color: TOPIC_COLORS[t], weight: w, status, trend })
  })

  const overallMastery = Math.round(weightedSum / totalWeight)

  // Expected mastery based on time elapsed
  // Assuming 180-day total prep, linear target = 70% at exam
  const totalPrepDays = 180
  const daysElapsed = Math.max(1, totalPrepDays - daysToExam)
  const expectedMastery = Math.round((daysElapsed / totalPrepDays) * 70)
  const delta = overallMastery - expectedMastery

  const verdict: Verdict =
    delta >= 10 ? 'ahead' : delta >= -5 ? 'on_track' : delta >= -15 ? 'slight_delay' : 'behind'

  // Top strengths and weaknesses
  const sorted = [...skills].sort((a, b) => b.pct - a.pct)
  const strengths = sorted.filter(s => s.status === 'strong').slice(0, 3)
  const weaknesses = sorted.filter(s => s.status === 'weak' || s.status === 'critical')
    .sort((a, b) => b.weight - a.weight) // prioritize high-weight weaknesses
    .slice(0, 3)

  // Weighted exam readiness score (0-100)
  const readiness = Math.min(100, Math.round(overallMastery * 1.1))

  // Data-driven coaching insight
  const insight = generateInsight(weaknesses, strengths, skills, overallMastery, delta, daysToExam)

  return {
    overallMastery,
    expectedMastery,
    delta,
    verdict,
    readiness,
    skills,
    strengths,
    weaknesses,
    daysToExam,
    insight,
  }
}

// ── Component ──
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getUid(): string {
  if (typeof window === 'undefined') return '00000000-0000-0000-0000-000000000001'
  try {
    const raw = localStorage.getItem('wingman_user')
    if (raw) { const p = JSON.parse(raw); if (p?.user_id) return p.user_id }
  } catch { /* ignore */ }
  return '00000000-0000-0000-0000-000000000001'
}

export default function Coach({ open = true, onClose, embedded = false }: { open?: boolean; onClose?: () => void; embedded?: boolean }) {
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [daysToExam, setDaysToExam] = useState(120)
  // Backend-sourced single source of truth (sidebar + topbar use the same).
  const [backendReadiness, setBackendReadiness] = useState<number | null>(null)
  const [backendMastery, setBackendMastery] = useState<number | null>(null)
  const [peerStats, setPeerStats] = useState<Record<string, number>>({})

  useEffect(() => {
    if (open) {
      setProgress(getProgress())
      setDaysToExam(getDaysToExam())
      // Pull real exam-readiness, mastery, and peer benchmarks from backend so
      // the Coach widgets match the rest of the app (sidebar, results page).
      fetch(`${API_BASE}/api/readiness/`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          const pct = d?.metrics?.exam_readiness_pct
          if (typeof pct === 'number') setBackendReadiness(Math.round(pct))
        })
        .catch(() => {})
      fetch(`${API_BASE}/api/kpis`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          const m = d?.mastery_score
          if (typeof m === 'number') setBackendMastery(Math.round(m))
        })
        .catch(() => {})
      fetch(`${API_BASE}/api/kpis/peer-stats`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.peers) setPeerStats(d.peers) })
        .catch(() => {})
    }
  }, [open])

  const analysis = useMemo(() => analyze(progress, daysToExam, peerStats), [progress, daysToExam, peerStats])
  const vc = VERDICT_CONFIG[analysis.verdict]
  // Prefer backend score, fall back to the local proxy until it loads.
  const readinessDisplay = backendReadiness ?? analysis.readiness
  const masteryDisplay = backendMastery ?? analysis.overallMastery

  // Pre-compute sorted skill map (avoid mutating during render)
  const sortedSkills = useMemo(
    () => [...analysis.skills].sort((a, b) => b.weight * (100 - b.pct) - a.weight * (100 - a.pct)),
    [analysis.skills],
  )

  // KPI-driven, agent-style action plan. Each item couples a quantified diagnosis with
  // a concrete CTA — clicking jumps straight into the relevant flow (session builder,
  // memory review, mock exam) with the topic preset.
  type AgentAction = {
    icon: string
    color: string
    title: string        // headline — the diagnosis
    rationale: string    // the agent voice — why this matters
    metrics: { label: string; value: string }[]  // structured KPI badges
    cta: { label: string; href: string }
  }

  const actionPlan = useMemo<AgentAction[]>(() => {
    const actions: AgentAction[] = []
    const days = Math.max(1, analysis.daysToExam)
    const weeks = Math.max(0.5, days / 7)
    const PASS_TARGET = 60
    const GAIN_PER_SESSION = 1.5

    type Item = { topic: string; pct: number; weight: number; status: SkillAssessment['status']; name: string }
    const targets: Item[] = analysis.skills
      .filter(s => s.status !== 'strong')
      .map(s => ({ topic: s.topic, pct: s.pct, weight: s.weight, status: s.status, name: s.name }))
      .sort((a, b) => (PASS_TARGET - b.pct) * b.weight - (PASS_TARGET - a.pct) * a.weight)

    const cadenceText = (perWeek: number) =>
      perWeek >= 7 ? `${Math.ceil(perWeek / 7)} session/day`
      : perWeek >= 4 ? `${perWeek}/week (≈daily)`
      :                `${perWeek}/week`

    const buildTopicAction = (t: Item, severity: 'critical' | 'weak' | 'developing'): AgentAction => {
      const gap = Math.max(0, PASS_TARGET - t.pct)
      const sessionsTotal = Math.ceil(gap / GAIN_PER_SESSION)
      const perWeek = Math.max(1, Math.ceil(sessionsTotal / weeks))
      const examPts = Math.round((gap * t.weight) / 100 * 10) / 10
      const cadence = cadenceText(perWeek)
      const config = {
        critical: { icon: '🔴', color: '#F87171', verb: 'biggest leak' },
        weak:     { icon: '🟡', color: '#FBBF24', verb: 'leaking points' },
        developing: { icon: '🟠', color: '#FB923C', verb: 'almost there' },
      }[severity]
      const rationaleParts = [
        severity === 'critical' ? `${t.topic} is your ${config.verb} — gap of ${gap}pt against passing.` :
        severity === 'weak'     ? `${t.topic} ${config.verb} — close ${gap}pt to clear ${PASS_TARGET}%.` :
                                  `${t.topic} is ${config.verb} — last push of ${gap}pt would unlock the topic.`,
        `At ${t.weight}% exam weight, recovering this is worth +${examPts}pt on score day.`,
        `${cadence} for ~${weeks.toFixed(0)} weeks gets you there.`,
      ]
      return {
        icon: config.icon,
        color: config.color,
        title: `${t.topic} ${t.pct}% → ${PASS_TARGET}%`,
        rationale: rationaleParts.join(' '),
        metrics: [
          { label: 'gap',      value: `${gap}pt` },
          { label: 'weight',   value: `${t.weight}%` },
          { label: 'cadence',  value: cadence },
          { label: 'exam impact', value: `+${examPts}pt` },
        ],
        cta: {
          label: `Drill ${t.topic} now →`,
          href: `/sessions?mode=focus_lm&topic=${t.topic}`,
        },
      }
    }

    const criticals = targets.filter(t => t.status === 'critical').slice(0, 3)
    const weaks     = targets.filter(t => t.status === 'weak').slice(0, 2)
    const developing = targets.filter(t => t.status === 'developing').slice(0, 2)

    criticals.forEach(c => actions.push(buildTopicAction(c, 'critical')))
    weaks.forEach(w => actions.push(buildTopicAction(w, 'weak')))
    developing.forEach(d => actions.push(buildTopicAction(d, 'developing')))

    if (analysis.strengths.length > 0) {
      const totalLockedWeight = analysis.strengths.reduce((sum, s) => sum + s.weight, 0)
      const labels = analysis.strengths.map(s => `${s.topic} (${s.pct}%)`).join(', ')
      const target = analysis.strengths[0].topic
      actions.push({
        icon: '🟢',
        color: '#4ADE80',
        title: `Lock in ${analysis.strengths.length} strong topic${analysis.strengths.length > 1 ? 's' : ''}`,
        rationale: `${labels} — high mastery, but Ebbinghaus decay is real. One light review/week keeps retention >80% and locks ≈${totalLockedWeight}% of exam weight you've already earned.`,
        metrics: [
          { label: 'topics',  value: `${analysis.strengths.length}` },
          { label: 'locked',  value: `${totalLockedWeight}%w` },
          { label: 'cadence', value: '1 review/week' },
        ],
        cta: { label: `SRS review ${target} →`, href: `/memory` },
      })
    }

    if (analysis.delta < -5) {
      const minPerDay = Math.min(180, Math.max(15, Math.round(Math.abs(analysis.delta) * 6)))
      const extraSessions = Math.ceil(minPerDay / 25) // ~25 min per session
      actions.push({
        icon: '⏱',
        color: '#A78BFA',
        title: `Off pace by ${Math.abs(analysis.delta)}pt`,
        rationale: `You're tracking below the D-${days} trajectory. Adding ≈${minPerDay} min/day (${extraSessions} extra session${extraSessions > 1 ? 's' : ''}) until ${weeks > 4 ? 'next month' : 'exam day'} closes the gap.`,
        metrics: [
          { label: 'delta',     value: `${analysis.delta}pt` },
          { label: 'add',       value: `${minPerDay} min/day` },
          { label: 'days left', value: `${days}d` },
        ],
        cta: { label: 'Start a recovery session →', href: '/sessions?mode=weaknesses' },
      })
    } else if (analysis.delta > 8) {
      actions.push({
        icon: '✨',
        color: '#60A5FA',
        title: `Ahead by ${analysis.delta}pt — bank the lead`,
        rationale: `You're ahead of pace. Best return now: alternate full mock exams and adaptive sessions on remaining weak spots so the lead doesn't erode.`,
        metrics: [
          { label: 'lead',      value: `+${analysis.delta}pt` },
          { label: 'days left', value: `${days}d` },
        ],
        cta: { label: 'Run a mock exam →', href: '/session?mode=mock' },
      })
    }

    if (actions.length === 0) {
      actions.push({
        icon: '🎯',
        color: '#60A5FA',
        title: 'All topics safe',
        rationale: `Every topic is ≥ ${PASS_TARGET}%. Switch to mock exams and spaced retention to convert mastery into exam-day stamina.`,
        metrics: [{ label: 'status', value: 'cruising' }],
        cta: { label: 'Run a mock exam →', href: '/session?mode=mock' },
      })
    }
    return actions
  }, [analysis.skills, analysis.weaknesses, analysis.strengths, analysis.daysToExam, analysis.delta])

  return (
    <>
      {/* Backdrop (panel mode only) */}
      {!embedded && open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      )}

      {/* Panel / Embedded content */}
      <div
        className={
          embedded
            ? 'w-full bg-surface-900 border border-white/[0.06] rounded-2xl'
            : `fixed top-0 right-0 h-full w-full md:w-[400px] bg-surface-900 border-l border-white/[0.06] z-50 transform transition-transform duration-300 ease-out flex flex-col ${
                open ? 'translate-x-0' : 'translate-x-full'
              }`
        }
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Coach</h2>
                <p className="text-[10px] text-slate-600">Real-time situation assessment</p>
              </div>
            </div>
            {!embedded && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Verdict banner */}
          <div
            className="rounded-xl p-4 border"
            style={{ background: `${vc.color}08`, borderColor: `${vc.color}20` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{vc.emoji}</span>
              <div>
                <h3 className="text-sm font-bold" style={{ color: vc.color }}>{vc.title}</h3>
                <span className="text-[10px] text-slate-500">J-{analysis.daysToExam} before exam</span>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-extrabold text-white tabular-nums">{readinessDisplay}</div>
                <div className="text-[9px] text-slate-600 uppercase flex items-center gap-1.5 justify-end">
                  Readiness
                  <HelpTooltip title="Readiness score">
                    <span className="font-mono text-blue-400">coverage × retention</span> pondéré
                    par le poids d&apos;examen de chaque topic. Source backend
                    {' '}<span className="font-mono text-slate-500">/api/readiness/</span>,
                    identique au badge sidebar. <span className="text-slate-400 font-bold">Cible passing : 70+.</span>
                    {' '}Tant que tu n&apos;as pas couvert les LMs <i>et</i> que ta rétention reste haute,
                    ce chiffre stagne — le passing CFA L1 exige couverture <i>et</i> mémorisation.
                  </HelpTooltip>
                </div>
              </div>
            </div>
          </div>

          {/* AI Coaching Insight */}
          <div className="mt-3 rounded-xl bg-purple-500/[0.04] border border-purple-500/10 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Diagnostic Coach</span>
            </div>
            <div className="space-y-2">
              {analysis.insight.split('\n\n').map((paragraph, i) => (
                <p key={i} className="text-[11px] text-slate-300 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Content — embedded: flow naturally so the page scrolls; slide-out: scroll inside */}
        <div className={embedded ? 'p-5 space-y-5' : 'flex-1 overflow-y-auto p-5 space-y-5'}>

          {/* ── Mastery vs Expected (compact single-row) ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600 flex items-center gap-1.5">
                Schedule Status
                <HelpTooltip title="Schedule Status">
                  Mastery <span className="font-mono text-blue-400">{masteryDisplay}%</span> from
                  {' '}<span className="font-mono text-slate-500">/api/kpis.mastery_score</span>
                  {' '}(weighted topic accuracy + retention).
                  Target = linear interpolation toward 70% over a 180-day prep window:
                  <span className="font-mono text-blue-400"> ((180 − days_to_exam) / 180) × 70</span>.
                  Delta = mastery − target.
                </HelpTooltip>
              </span>
              <span className="text-[10px] text-slate-500 tabular-nums">
                <span className="text-white font-bold">{masteryDisplay}%</span>
                <span className="text-slate-600"> / </span>
                <span>{analysis.expectedMastery}% target</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-surface-700 overflow-hidden relative">
                <div
                  className="absolute top-0 h-full w-0.5 bg-slate-500 z-10"
                  style={{ left: `${Math.min(100, analysis.expectedMastery)}%` }}
                  title={`Expected: ${analysis.expectedMastery}%`}
                />
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, masteryDisplay)}%`,
                    background: (masteryDisplay - analysis.expectedMastery) >= 0
                      ? 'linear-gradient(90deg, #3b82f6, #22c55e)'
                      : 'linear-gradient(90deg, #f59e0b, #ef4444)',
                  }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: vc.color }}>
                {(masteryDisplay - analysis.expectedMastery) >= 0 ? '+' : ''}{masteryDisplay - analysis.expectedMastery}%
              </span>
            </div>
          </div>

          {/* ── Strengths ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-400">Strengths</span>
              <span className="text-[9px] text-slate-600">{analysis.strengths.length} topics</span>
            </div>
            {analysis.strengths.length === 0 ? (
              <p className="text-[11px] text-slate-600 pl-5">Keep working — strengths will emerge as you pass 65%</p>
            ) : (
              <div className="space-y-2">
                {analysis.strengths.map(s => (
                  <div key={s.topic} className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-white">{s.topic}</span>
                        <span className="text-[10px] text-slate-500 truncate">{s.name}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 tabular-nums">{s.pct}%</span>
                    <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Weaknesses ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-400">Weaknesses to Attack</span>
            </div>
            {analysis.weaknesses.length === 0 ? (
              <p className="text-[11px] text-emerald-400 pl-5">No critical weaknesses — you&apos;re in great shape!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {analysis.weaknesses.map(w => {
                  const st = STATUS_STYLES[w.status]
                  const pts = w.status === 'critical'
                    ? Math.round(w.weight * 0.3)
                    : Math.round(w.weight * 0.15)
                  const goal = w.status === 'critical' ? '50%' : 'unlock'
                  return (
                    <div
                      key={w.topic}
                      className="flex items-center gap-2 rounded-lg border px-2 py-1.5"
                      style={{ background: st.bg, borderColor: `${st.text}20` }}
                    >
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0" style={{ background: w.color }}>
                        {w.topic}
                      </span>
                      <div className="flex-1 h-1 rounded-full bg-surface-700 overflow-hidden min-w-0">
                        <div className="h-full rounded-full" style={{ width: `${w.pct}%`, background: st.text }} />
                      </div>
                      <span className="text-[10px] font-mono tabular-nums shrink-0" style={{ color: st.text }}>{w.pct}%</span>
                      <span className="text-[9px] text-slate-500 shrink-0">·</span>
                      <span className="text-[9px] text-slate-500 shrink-0">{w.weight}%w</span>
                      <span className="text-[9px] shrink-0" style={{ color: st.text }}>+{pts}pt → {goal}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Full Skill Map (compact multi-column) ── */}
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600 mb-3">Skill Map</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-2">
              {sortedSkills.map(s => {
                const st = STATUS_STYLES[s.status]
                return (
                  <div key={s.topic} className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-bold w-7 shrink-0" style={{ color: s.color }}>{s.topic}</span>
                    <div className="flex-1 h-1 rounded-full bg-surface-700 overflow-hidden min-w-0">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${s.pct}%`, background: st.text }}
                      />
                    </div>
                    <span className="text-[9px] font-mono tabular-nums text-right w-8 shrink-0" style={{ color: st.text }}>{s.pct}%</span>
                    <svg className={`w-2.5 h-2.5 shrink-0 ${s.trend === 'up' ? 'text-emerald-500' : s.trend === 'down' ? 'text-red-400' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      {s.trend === 'up' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      ) : s.trend === 'down' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                      )}
                    </svg>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer — agent action plan */}
        <div className="p-4 border-t border-white/[0.06] bg-surface-800/30 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Agent Action Plan</div>
            <span className="text-[9px] text-slate-600">{actionPlan.length} prescription{actionPlan.length > 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {actionPlan.map((a, i) => (
              <div
                key={i}
                className="rounded-lg border p-3 flex flex-col gap-2 min-w-0"
                style={{ background: `${a.color}0d`, borderColor: `${a.color}33` }}
              >
                {/* Header: icon + title */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[14px] leading-none shrink-0">{a.icon}</span>
                  <span className="text-[12px] font-bold truncate" style={{ color: a.color }}>{a.title}</span>
                </div>

                {/* Agent voice rationale */}
                <p className="text-[11px] text-slate-300 leading-snug">{a.rationale}</p>

                {/* KPI chips */}
                <div className="flex flex-wrap gap-1">
                  {a.metrics.map((m, j) => (
                    <span
                      key={j}
                      className="text-[9px] px-1.5 py-0.5 rounded font-mono tabular-nums"
                      style={{ background: 'rgba(255,255,255,0.04)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <span className="text-slate-500 mr-1">{m.label}</span>
                      <span style={{ color: a.color }}>{m.value}</span>
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href={a.cta.href}
                  className="self-start text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded transition-colors"
                  style={{
                    background: `${a.color}1f`,
                    color: a.color,
                    border: `1px solid ${a.color}55`,
                  }}
                >
                  {a.cta.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
