'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TOPICS, TOPIC_COLORS, TOPIC_ORDER, LM_DATA, EXAM_WEIGHTS as TOPIC_WEIGHTS } from '@/lib/lm-data'

// ── Types ──
interface Task {
  id: string
  type: 'study' | 'review' | 'practice' | 'diagnostic' | 'generate' | 'analyse' | 'passive'
  etape: number         // 1-11 step in the learning progression
  etapeLabel: string    // Human label for the step
  topic: string
  lmCode: string
  title: string
  reason: string
  duration: string
  priority: 'critical' | 'high' | 'medium'
  matrixPriority: number // 1-3 from the priority matrix
  action: string
  href?: string
}

type EnergyLevel = 'high' | 'medium' | 'low'
type TimeSlot = '30' | '60' | '90' | '120'

// ── Constants ──

// ══════════════════════════════════════════════════════════
// PRIORITY MATRIX — from the Method document
// Rows: steps 1-11 | Cols: CORP, FI, EQU, QM, ETH, FSA, ECO, DER, ALT, PM
// Values: 1 = low priority, 2 = standard, 3 = high priority for that topic
// ══════════════════════════════════════════════════════════
const MATRIX_TOPICS = ['CORP', 'FI', 'EQU', 'QM', 'ETH', 'FSA', 'ECO', 'DER', 'ALT', 'PM'] as const

const PRIORITY_MATRIX: Record<number, Record<string, number>> = {
  1:  { CORP: 2, FI: 2, EQU: 2, QM: 2, ETH: 1, FSA: 2, ECO: 2, DER: 2, ALT: 1, PM: 2 }, // Reading Summary
  2:  { CORP: 2, FI: 1, EQU: 2, QM: 1, ETH: 0, FSA: 2, ECO: 1, DER: 1, ALT: 1, PM: 1 }, // Essential Sheet
  3:  { CORP: 2, FI: 1, EQU: 2, QM: 2, ETH: 1, FSA: 3, ECO: 2, DER: 2, ALT: 1, PM: 2 }, // LOS Sheet
  4:  { CORP: 2, FI: 1, EQU: 2, QM: 2, ETH: 0, FSA: 3, ECO: 2, DER: 2, ALT: 1, PM: 2 }, // Concept Check
  5:  { CORP: 2, FI: 2, EQU: 2, QM: 2, ETH: 3, FSA: 3, ECO: 2, DER: 2, ALT: 2, PM: 2 }, // QBank (diagnostic)
  6:  { CORP: 2, FI: 2, EQU: 2, QM: 2, ETH: 3, FSA: 3, ECO: 2, DER: 2, ALT: 2, PM: 2 }, // Error Analysis
  7:  { CORP: 3, FI: 2, EQU: 2, QM: 2, ETH: 3, FSA: 3, ECO: 2, DER: 2, ALT: 2, PM: 2 }, // Exam Traps
  8:  { CORP: 2, FI: 3, EQU: 2, QM: 2, ETH: 3, FSA: 3, ECO: 2, DER: 2, ALT: 2, PM: 2 }, // QBank (reinforcement)
  9:  { CORP: 1, FI: 3, EQU: 1, QM: 3, ETH: 0, FSA: 2, ECO: 1, DER: 3, ALT: 1, PM: 2 }, // Calculator
  10: { CORP: 3, FI: 1, EQU: 2, QM: 1, ETH: 0, FSA: 2, ECO: 1, DER: 2, ALT: 1, PM: 2 }, // Decision Tree
  11: { CORP: 1, FI: 1, EQU: 2, QM: 2, ETH: 3, FSA: 3, ECO: 2, DER: 2, ALT: 2, PM: 2 }, // Repetition
}

// ── Steps: the 11-step learning progression ──
interface Etape {
  id: number
  label: string
  labelFr: string
  type: Task['type']
  action: string       // CTA button label
  icon: string         // SVG path
  durationMin: number  // base duration in minutes
  progressMin: number  // progress % where this step starts
  progressMax: number  // progress % where this step ends
  energyMin: EnergyLevel // minimum energy level needed
}

const ETAPES: Etape[] = [
  { id: 1,  label: 'Reading Summary',       labelFr: 'Reading Summary',       type: 'study',      action: 'Read Now',        icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', durationMin: 30, progressMin: 0,  progressMax: 15, energyMin: 'high' },
  { id: 2,  label: 'Essential Sheet',        labelFr: 'Essential Sheet',    type: 'study',      action: 'Study Sheet',     icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', durationMin: 20, progressMin: 15, progressMax: 25, energyMin: 'high' },
  { id: 3,  label: 'LOS Sheet',              labelFr: 'LOS Sheet',            type: 'study',      action: 'Review LOS',      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', durationMin: 20, progressMin: 25, progressMax: 35, energyMin: 'medium' },
  { id: 4,  label: 'Concept Check',           labelFr: 'Concept Check', type: 'review',    action: 'Check',           icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', durationMin: 15, progressMin: 35, progressMax: 45, energyMin: 'medium' },
  { id: 5,  label: 'QBank Diagnostic',        labelFr: 'QBank Diagnostic',      type: 'diagnostic', action: 'Run Diagnostic',  icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', durationMin: 25, progressMin: 45, progressMax: 55, energyMin: 'high' },
  { id: 6,  label: 'Error Analysis',          labelFr: 'Error Analysis',       type: 'analyse',    action: 'Analyze',         icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', durationMin: 20, progressMin: 55, progressMax: 65, energyMin: 'medium' },
  { id: 7,  label: 'Exam Traps',              labelFr: 'Exam Traps',         type: 'practice',   action: 'Spot Traps',      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z', durationMin: 20, progressMin: 65, progressMax: 72, energyMin: 'high' },
  { id: 8,  label: 'QBank Reinforcement',     labelFr: 'QBank Reinforcement',    type: 'practice',   action: 'Practice',        icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', durationMin: 25, progressMin: 72, progressMax: 80, energyMin: 'medium' },
  { id: 9,  label: 'Calculator Mastery',       labelFr: 'Calculator',          type: 'practice',   action: 'Drill Calc',      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', durationMin: 20, progressMin: 80, progressMax: 88, energyMin: 'medium' },
  { id: 10, label: 'Decision Tree',            labelFr: 'Decision Tree',        type: 'practice',   action: 'Map Decisions',   icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', durationMin: 15, progressMin: 88, progressMax: 94, energyMin: 'high' },
  { id: 11, label: 'Spaced Repetition',        labelFr: 'Spaced Repetition',    type: 'review',     action: 'Repeat',          icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', durationMin: 15, progressMin: 94, progressMax: 100, energyMin: 'low' },
]

const ENERGY_CONFIG: Record<EnergyLevel, { label: string; icon: string; color: string; tip: string }> = {
  high:   { label: 'High Energy',   icon: '⚡', color: '#22c55e', tip: 'Deep learning, diagnostics & new concepts' },
  medium: { label: 'Medium Energy', icon: '🔋', color: '#f59e0b', tip: 'Review, practice & reinforcement' },
  low:    { label: 'Low Energy',    icon: '🌙', color: '#6366f1', tip: 'Flashcards, audio & spaced repetition' },
}

const ENERGY_RANK: Record<EnergyLevel, number> = { low: 0, medium: 1, high: 2 }

const TASK_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  study:      { bg: 'rgba(59,130,246,0.12)',  text: '#60A5FA' },
  review:     { bg: 'rgba(139,92,246,0.12)',   text: '#A78BFA' },
  practice:   { bg: 'rgba(245,158,11,0.12)',   text: '#FBBF24' },
  diagnostic: { bg: 'rgba(236,72,153,0.12)',   text: '#F472B6' },
  analyse:    { bg: 'rgba(239,68,68,0.12)',    text: '#F87171' },
  generate:   { bg: 'rgba(34,197,94,0.12)',    text: '#4ADE80' },
  passive:    { bg: 'rgba(99,102,241,0.12)',   text: '#818CF8' },
}

// ── Intelligence Engine ──
function getProgress(): Record<string, number> {
  try {
    const stored = localStorage.getItem('wingman_topic_progress')
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return { ETH: 42, QM: 28, ECO: 35, FSA: 51, CORP: 19, EQU: 69, FI: 22, DER: 15, ALT: 38, PM: 44 }
}

/**
 * Determine the current step for a topic based on its progress %
 */
function getCurrentEtape(pct: number): Etape {
  for (let i = ETAPES.length - 1; i >= 0; i--) {
    if (pct >= ETAPES[i].progressMin) return ETAPES[i]
  }
  return ETAPES[0]
}

/**
 * Compute a composite score for a (topic, step) pair:
 *   score = examWeight × gap × matrixPriority × energyBonus
 */
function scoreCandidates(
  progress: Record<string, number>,
  energy: EnergyLevel,
): { topic: string; etape: Etape; score: number; pct: number; matrixPri: number }[] {
  const candidates: { topic: string; etape: Etape; score: number; pct: number; matrixPri: number }[] = []

  TOPIC_ORDER.forEach(topic => {
    const pct = progress[topic] ?? 0
    const weight = TOPIC_WEIGHTS[topic] ?? 5
    const gap = 100 - pct
    const etape = getCurrentEtape(pct)
    const matrixPri = PRIORITY_MATRIX[etape.id]?.[topic] ?? 1

    // Skip activities that need higher energy than available
    const etapeEnergyRank = ENERGY_RANK[etape.energyMin]
    const userEnergyRank = ENERGY_RANK[energy]

    // If user energy is lower than step needs, check if there's a fallback step
    if (userEnergyRank < etapeEnergyRank) {
      // Suggest a lighter alternative: spaced repetition or passive review
      const fallbackEtape = energy === 'low' ? ETAPES[10] : ETAPES[3] // Spaced Repetition or Concept Check
      const fallbackPri = PRIORITY_MATRIX[fallbackEtape.id]?.[topic] ?? 1
      if (fallbackPri > 0) {
        candidates.push({
          topic,
          etape: fallbackEtape,
          score: weight * gap * fallbackPri * 0.7, // reduced score for fallback
          pct,
          matrixPri: fallbackPri,
        })
      }
      return
    }

    // Priority 0 means this step is irrelevant for this topic (e.g., Calculator for ETH)
    if (matrixPri === 0) {
      // Skip to next step or repetition
      const nextEtape = ETAPES.find(e => e.id > etape.id && (PRIORITY_MATRIX[e.id]?.[topic] ?? 0) > 0)
      if (nextEtape) {
        const nextPri = PRIORITY_MATRIX[nextEtape.id]?.[topic] ?? 1
        candidates.push({
          topic,
          etape: nextEtape,
          score: weight * gap * nextPri * 0.8,
          pct,
          matrixPri: nextPri,
        })
      }
      return
    }

    // Energy bonus: if user has excess energy relative to the task, small bonus
    const energyBonus = userEnergyRank > etapeEnergyRank ? 1.1 : 1.0

    candidates.push({
      topic,
      etape,
      score: weight * gap * matrixPri * energyBonus,
      pct,
      matrixPri,
    })
  })

  return candidates.sort((a, b) => b.score - a.score)
}

function generateTasks(energy: EnergyLevel, timeMin: number, progress: Record<string, number>): Task[] {
  const tasks: Task[] = []
  let taskId = 0
  let usedMin = 0
  const usedTopics = new Set<string>()

  const candidates = scoreCandidates(progress, energy)

  // Add primary tasks from the ranked candidates
  for (const cand of candidates) {
    if (usedMin >= timeMin) break
    if (usedTopics.has(cand.topic)) continue // one task per topic max

    const lmEntry = LM_DATA.find(([t]) => t === cand.topic)
    if (!lmEntry) continue

    const pct = cand.pct
    const weight = TOPIC_WEIGHTS[cand.topic] ?? 5
    const etape = cand.etape
    const dur = Math.min(etape.durationMin, timeMin - usedMin)
    if (dur < 5) continue

    // Priority level
    const priority: Task['priority'] =
      cand.matrixPri === 3 ? 'critical' :
      cand.matrixPri === 2 ? 'high' : 'medium'

    // Build reason text based on context
    let reason = ''
    if (pct < 25) {
      reason = `⬆ ${weight}% exam weight at only ${pct}% — ${etape.label} is the right first step`
    } else if (cand.matrixPri === 3) {
      reason = `★ HIGH PRIORITY for ${cand.topic}: ${etape.label} is critical at this stage (${pct}%)`
    } else if (pct >= 65) {
      reason = `${pct}% mastery — ${etape.label} to push toward exam readiness`
    } else {
      reason = `${weight}% exam weight, ${pct}% mastery → ${etape.label} (priority ${cand.matrixPri}/3)`
    }

    tasks.push({
      id: `task-${taskId++}`,
      type: etape.type,
      etape: etape.id,
      etapeLabel: etape.label,
      topic: cand.topic,
      lmCode: lmEntry[1],
      title: `${etape.label}: ${lmEntry[2]}`,
      reason,
      duration: `${dur} min`,
      priority,
      matrixPriority: cand.matrixPri,
      action: etape.action,
      href: `/library?lm=${cand.topic}/${lmEntry[1]}`,
    })

    usedMin += dur
    usedTopics.add(cand.topic)
  }

  // Low energy: add a passive audio/generate task if there's time left
  if (energy === 'low' && usedMin < timeMin) {
    const top = candidates.find(c => !usedTopics.has(c.topic))
    if (top) {
      const lm = LM_DATA.find(([t]) => t === top.topic)
      if (lm) {
        tasks.push({
          id: `task-${taskId++}`,
          type: 'passive',
          etape: 0,
          etapeLabel: 'Audio Synthesis',
          topic: top.topic,
          lmCode: lm[1],
          title: `🎧 Listen: ${lm[2]}`,
          reason: `Passive learning — audio reinforces ${top.topic} (${top.pct}%) with zero effort`,
          duration: `${Math.min(15, timeMin - usedMin)} min`,
          priority: 'medium',
          matrixPriority: 1,
          action: 'Listen',
          href: `/library?lm=${top.topic}/${lm[1]}`,
        })
      }
    }
  }

  return tasks
}

// ── Component ──
export default function Navigator({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [energy, setEnergy] = useState<EnergyLevel>('high')
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('60')
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) setProgress(getProgress())
  }, [open])

  const tasks = useMemo(
    () => generateTasks(energy, parseInt(timeSlot), progress),
    [energy, timeSlot, progress]
  )

  const completedCount = tasks.filter(t => completedTasks.has(t.id)).length
  const totalDuration = tasks.reduce((acc, t) => acc + (parseInt(t.duration) || 0), 0)

  const toggleComplete = useCallback((id: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Matrix priority badge colors
  const matrixColor = (pri: number) =>
    pri === 3 ? { bg: 'rgba(239,68,68,0.15)', text: '#F87171' } :
    pri === 2 ? { bg: 'rgba(245,158,11,0.15)', text: '#FBBF24' } :
               { bg: 'rgba(100,116,139,0.15)', text: '#94A3B8' }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-surface-900 border-l border-white/[0.06] z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent-blue/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Navigator</h2>
                <p className="text-[10px] text-slate-600">AI task assignment · Priority Matrix</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Energy selector */}
          <div className="mb-3">
            <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600 mb-2">Energy Level</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.entries(ENERGY_CONFIG) as [EnergyLevel, typeof ENERGY_CONFIG[EnergyLevel]][]).map(([key, conf]) => (
                <button
                  key={key}
                  onClick={() => setEnergy(key)}
                  className={`px-2.5 py-2 rounded-lg text-center transition-all border ${
                    energy === key
                      ? 'border-white/[0.15] bg-white/[0.06]'
                      : 'border-transparent bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="text-sm mb-0.5">{conf.icon}</div>
                  <div className={`text-[10px] font-semibold ${energy === key ? 'text-white' : 'text-slate-500'}`}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 text-center">{ENERGY_CONFIG[energy].tip}</p>
          </div>

          {/* Time selector */}
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600 mb-2">Time Available</div>
            <div className="flex gap-1.5">
              {(['30', '60', '90', '120'] as TimeSlot[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTimeSlot(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    timeSlot === t
                      ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30'
                      : 'bg-white/[0.03] text-slate-500 border border-transparent hover:bg-white/[0.05]'
                  }`}
                >
                  {t}m
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{tasks.length} tasks</span>
              <span className="text-xs text-slate-600">~{totalDuration} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold" style={{ color: completedCount === tasks.length && tasks.length > 0 ? '#22c55e' : '#64748b' }}>
                {completedCount}/{tasks.length}
              </span>
              <span className="text-[10px] text-slate-600">done</span>
            </div>
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {tasks.map((task, index) => {
            const done = completedTasks.has(task.id)
            const style = TASK_TYPE_STYLES[task.type] || TASK_TYPE_STYLES.study
            const mc = matrixColor(task.matrixPriority)

            return (
              <div
                key={task.id}
                className={`rounded-xl border p-3.5 transition-all ${
                  done
                    ? 'opacity-40 border-emerald-500/20 bg-emerald-500/[0.03]'
                    : index === 0
                      ? 'border-accent-blue/25 bg-accent-blue/[0.04] shadow-[0_0_20px_rgba(59,130,246,0.06)]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                {/* Top row: number + step badge + matrix priority + duration */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    done ? 'bg-emerald-500 text-white' : 'bg-white/[0.06] text-slate-500'
                  }`}>
                    {done ? '✓' : index + 1}
                  </span>

                  {/* Step badge */}
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: style.bg, color: style.text }}>
                    S{task.etape > 0 ? task.etape : '•'} {task.etapeLabel}
                  </span>

                  {/* Matrix priority pip */}
                  <span
                    className="text-[8px] font-bold px-1 py-0.5 rounded"
                    style={{ background: mc.bg, color: mc.text }}
                    title={`Matrix priority: ${task.matrixPriority}/3`}
                  >
                    P{task.matrixPriority}
                  </span>

                  <span className="text-[9px] text-slate-600 ml-auto">{task.duration}</span>
                </div>

                {/* Topic + LM */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: TOPIC_COLORS[task.topic] }}>
                    {task.topic}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{task.lmCode}</span>
                  <span className="text-[10px] text-slate-600">
                    {progress[task.topic] ?? 0}%
                  </span>
                </div>

                {/* Title */}
                <h4 className={`text-[12px] font-semibold mb-1 leading-snug ${done ? 'text-slate-600 line-through' : 'text-white'}`}>
                  {task.title}
                </h4>

                {/* Reason */}
                <p className="text-[10px] text-slate-500 leading-relaxed mb-3">{task.reason}</p>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (task.href) router.push(task.href)
                      onClose()
                    }}
                    disabled={done}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all ${
                      done
                        ? 'bg-white/[0.03] text-slate-700 cursor-not-allowed'
                        : index === 0
                          ? 'bg-accent-blue hover:bg-blue-600 text-white shadow-lg shadow-blue-500/15'
                          : 'bg-white/[0.06] text-white hover:bg-white/[0.1]'
                    }`}
                  >
                    {task.action}
                  </button>
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className={`px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                      done
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-white/[0.04] text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    {done ? 'Undo' : 'Done'}
                  </button>
                </div>
              </div>
            )
          })}

          {tasks.length === 0 && (
            <div className="text-center py-12 text-slate-600">
              <div className="text-3xl mb-3 opacity-30">🎯</div>
              <p className="text-sm">No tasks generated.</p>
              <p className="text-xs mt-1">Adjust energy or time.</p>
            </div>
          )}
        </div>

        {/* Footer — step progression legend */}
        <div className="p-4 border-t border-white/[0.06] bg-surface-800/30 shrink-0">
          <div className="text-[8px] font-bold uppercase tracking-wider text-slate-700 mb-2">11-Step Method</div>
          <div className="flex flex-wrap gap-1">
            {ETAPES.map(e => {
              // Check if any task uses this step
              const active = tasks.some(t => t.etape === e.id)
              return (
                <span
                  key={e.id}
                  className={`text-[8px] px-1.5 py-0.5 rounded transition-all ${
                    active
                      ? 'bg-accent-blue/20 text-accent-blue font-bold'
                      : 'bg-white/[0.03] text-slate-700'
                  }`}
                  title={`Step ${e.id}: ${e.label} (${e.progressMin}-${e.progressMax}%)`}
                >
                  {e.id}.{e.label.split(' ')[0]}
                </span>
              )
            })}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <span className="text-[8px] px-1 rounded font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171' }}>P3</span>
              <span className="text-[8px] text-slate-600">Critical</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px] px-1 rounded font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: '#FBBF24' }}>P2</span>
              <span className="text-[8px] text-slate-600">Standard</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px] px-1 rounded font-bold" style={{ background: 'rgba(100,116,139,0.15)', color: '#94A3B8' }}>P1</span>
              <span className="text-[8px] text-slate-600">Low</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
