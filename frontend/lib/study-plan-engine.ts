import { TOPIC_ORDER, TOPIC_COLORS, TOPICS, LM_DATA, EXAM_WEIGHTS as CANONICAL_WEIGHTS } from './lm-data'

// ── Types ─────────────────────────────────────────────────
export type StudyPhase = 'discovery' | 'consolidation' | 'simulation' | 'sprint'

export interface PhaseConfig {
  key: StudyPhase; label: string; labelFr: string; pct: number; color: string
}

export interface SessionSlot {
  topic: string; lmCode: string; lmTitle: string
  durationMin: number; type: 'new' | 'review' | 'mock' | 'sprint'
}

export interface DayPlan {
  date: string; dayLabel: string; isStudyDay: boolean; sessions: SessionSlot[]
}

export interface WeekPlan {
  week: number; startDate: string; endDate: string; phase: StudyPhase; days: DayPlan[]
}

export interface PhaseRange {
  phase: StudyPhase; startWeek: number; endWeek: number
  startDate: string; endDate: string; label: string; color: string
}

export interface StudyPlanOutput {
  generatedAt: string; examDate: string; totalWeeks: number
  phases: PhaseRange[]; weeks: WeekPlan[]
}

// ── Constants ─────────────────────────────────────────────
export const EXAM_WEIGHTS = CANONICAL_WEIGHTS

export const PHASES: PhaseConfig[] = [
  { key: 'discovery',     label: 'Discovery',     labelFr: 'Discovery',      pct: 0.40, color: '#3b82f6' },
  { key: 'consolidation', label: 'Consolidation',  labelFr: 'Consolidation', pct: 0.25, color: '#a855f7' },
  { key: 'simulation',    label: 'Simulation',     labelFr: 'Simulation',    pct: 0.20, color: '#f59e0b' },
  { key: 'sprint',        label: 'Final Sprint',   labelFr: 'Final Sprint',  pct: 0.15, color: '#ef4444' },
]

const DAY_MAP: Record<string, number> = { Su: 0, M: 1, T: 2, W: 3, Th: 4, F: 5, S: 6 }
const DAY_LABELS = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S']

const LM_BY_TOPIC: Record<string, [string, string, string][]> = {}
for (const t of TOPIC_ORDER) LM_BY_TOPIC[t] = LM_DATA.filter(([tt]) => tt === t)

// ── Helpers ───────────────────────────────────────────────
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function getMondayOfWeek(d: Date): Date {
  const r = new Date(d)
  const day = r.getDay()
  const diff = day === 0 ? -6 : 1 - day
  r.setDate(r.getDate() + diff)
  return r
}

// ── Generator ─────────────────────────────────────────────
export function generateStudyPlan(
  examDate: string | null,
  hoursPerWeek: number,
  sessionDurationMin: number,
  preferredDays: string[],
  level: string,
  topicProgress: Record<string, number>,
): StudyPlanOutput {
  const now = new Date()
  const exam = examDate ? new Date(examDate) : addDays(now, 24 * 7)
  const totalDays = Math.max(7, Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7))

  const studyDayIndices = new Set(preferredDays.map(d => DAY_MAP[d] ?? 1))
  const studyDaysPerWeek = Math.max(1, studyDayIndices.size)
  const sessionsPerDay = Math.max(1, Math.round((hoursPerWeek / studyDaysPerWeek) * 60 / sessionDurationMin))

  // ── Phase ranges ──
  const phaseWeeks: number[] = []
  let remaining = totalWeeks
  for (let i = 0; i < 4; i++) {
    if (i === 3) { phaseWeeks.push(remaining); break }
    const w = Math.max(1, Math.round(totalWeeks * PHASES[i].pct))
    phaseWeeks.push(Math.min(w, remaining))
    remaining -= phaseWeeks[i]
    if (remaining <= 0) { remaining = 0 }
  }
  // Ensure we have 4 entries
  while (phaseWeeks.length < 4) phaseWeeks.push(0)

  const monday = getMondayOfWeek(now)
  const phases: PhaseRange[] = []
  let weekOffset = 0
  for (let i = 0; i < 4; i++) {
    if (phaseWeeks[i] <= 0) continue
    const start = addDays(monday, weekOffset * 7)
    const end = addDays(monday, (weekOffset + phaseWeeks[i]) * 7 - 1)
    phases.push({
      phase: PHASES[i].key,
      startWeek: weekOffset + 1,
      endWeek: weekOffset + phaseWeeks[i],
      startDate: fmtDate(start),
      endDate: fmtDate(end),
      label: PHASES[i].label,
      color: PHASES[i].color,
    })
    weekOffset += phaseWeeks[i]
  }

  // ── Topic allocation per phase ──
  function getPhaseForWeek(w: number): StudyPhase {
    let acc = 0
    for (let i = 0; i < 4; i++) {
      acc += phaseWeeks[i]
      if (w <= acc) return PHASES[i].key
    }
    return 'sprint'
  }

  // Track LM cursor per topic for sequential assignment
  const lmCursor: Record<string, number> = {}
  for (const t of TOPIC_ORDER) lmCursor[t] = 0

  function nextLM(topic: string): [string, string] {
    const lms = LM_BY_TOPIC[topic]
    if (!lms || lms.length === 0) return ['LM01', topic]
    const idx = lmCursor[topic] % lms.length
    lmCursor[topic]++
    return [lms[idx][1], lms[idx][2]]
  }

  function allocateTopicsForPhase(phase: StudyPhase, count: number, progress: Record<string, number>): string[] {
    const weights: Record<string, number> = {}
    for (const t of TOPIC_ORDER) {
      const ew = EXAM_WEIGHTS[t]
      const gap = Math.max(0, 100 - (progress[t] || 0))
      const lmCount = LM_BY_TOPIC[t]?.length || 1
      switch (phase) {
        case 'discovery':
          weights[t] = ew * lmCount * (level === 'advanced' && gap < 30 ? 0.2 : 1)
          break
        case 'consolidation':
          weights[t] = ew * gap
          break
        case 'simulation':
          weights[t] = ew // balanced for mocks
          break
        case 'sprint':
          weights[t] = ew * gap * 1.5
          break
      }
    }
    const totalW = Object.values(weights).reduce((a, b) => a + b, 0) || 1
    const result: string[] = []
    // Weighted round-robin
    const quotas: Record<string, number> = {}
    for (const t of TOPIC_ORDER) quotas[t] = Math.round((weights[t] / totalW) * count)
    // Fill remaining
    let filled = Object.values(quotas).reduce((a, b) => a + b, 0)
    const sorted = [...TOPIC_ORDER].sort((a, b) => weights[b] - weights[a])
    while (filled < count) { quotas[sorted[0]]++; filled++ }
    while (filled > count) {
      const last = sorted[sorted.length - 1]
      if (quotas[last] > 0) { quotas[last]--; filled-- }
      else { sorted.pop(); if (sorted.length === 0) break }
    }
    // Interleave
    let passes = true
    while (passes) {
      passes = false
      for (const t of TOPIC_ORDER) {
        if (quotas[t] > 0) { result.push(t); quotas[t]--; passes = true }
      }
    }
    return result
  }

  const sessionTypeMap: Record<StudyPhase, SessionSlot['type']> = {
    discovery: 'new', consolidation: 'review', simulation: 'mock', sprint: 'sprint',
  }

  // ── Build weeks ──
  const weeks: WeekPlan[] = []
  // Pre-allocate all sessions per phase
  const phaseQueues: Record<StudyPhase, string[]> = {
    discovery: [], consolidation: [], simulation: [], sprint: [],
  }
  for (let i = 0; i < 4; i++) {
    const totalSessions = phaseWeeks[i] * studyDaysPerWeek * sessionsPerDay
    phaseQueues[PHASES[i].key] = allocateTopicsForPhase(PHASES[i].key, totalSessions, topicProgress)
  }
  const phaseIdx: Record<StudyPhase, number> = { discovery: 0, consolidation: 0, simulation: 0, sprint: 0 }

  for (let w = 0; w < totalWeeks; w++) {
    const weekStart = addDays(monday, w * 7)
    const phase = getPhaseForWeek(w + 1)
    const days: DayPlan[] = []

    for (let d = 0; d < 7; d++) {
      const dayDate = addDays(weekStart, d)
      const dow = dayDate.getDay()
      const isStudy = studyDayIndices.has(dow)
      const sessions: SessionSlot[] = []

      if (isStudy) {
        for (let s = 0; s < sessionsPerDay; s++) {
          const queue = phaseQueues[phase]
          const idx = phaseIdx[phase]
          if (idx < queue.length) {
            const topic = queue[idx]
            phaseIdx[phase]++
            const [lmCode, lmTitle] = nextLM(topic)
            sessions.push({
              topic, lmCode, lmTitle,
              durationMin: sessionDurationMin,
              type: sessionTypeMap[phase],
            })
          }
        }
      }

      days.push({
        date: fmtDate(dayDate),
        dayLabel: DAY_LABELS[dow],
        isStudyDay: isStudy,
        sessions,
      })
    }

    weeks.push({
      week: w + 1,
      startDate: fmtDate(weekStart),
      endDate: fmtDate(addDays(weekStart, 6)),
      phase,
      days,
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    examDate: fmtDate(exam),
    totalWeeks,
    phases,
    weeks,
  }
}

// ── Utilities ─────────────────────────────────────────────
export function getCurrentWeekIndex(plan: StudyPlanOutput): number {
  const today = fmtDate(new Date())
  for (let i = 0; i < plan.weeks.length; i++) {
    if (today >= plan.weeks[i].startDate && today <= plan.weeks[i].endDate) return i
  }
  return 0
}

export function getPhaseColor(phase: StudyPhase): string {
  return PHASES.find(p => p.key === phase)?.color || '#6b7280'
}

export function getTopicColor(topic: string): string {
  return TOPIC_COLORS[topic] || '#6b7280'
}

export function getTopicName(topic: string): string {
  return TOPICS[topic] || topic
}
