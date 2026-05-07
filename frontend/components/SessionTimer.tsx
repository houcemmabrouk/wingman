'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { api } from '@/lib/api'
import { TOPICS, TOPIC_COLORS, TOPIC_ORDER, LM_DATA, EXAM_WEIGHTS as TOPIC_WEIGHTS } from '@/lib/lm-data'
import EndOfSessionModal from './EndOfSessionModal'

type TimerState = 'idle' | 'running' | 'paused' | 'summary'

export interface SelectedLM {
  topic: string
  lmCode: string
  title: string
}

// ── Priority Matrix (from Method document) ──
// étape → topic → priority (1-3, 0=skip)
const PRIORITY_MATRIX: Record<number, Record<string, number>> = {
  1:  { CORP: 2, FI: 2, EQU: 2, QM: 2, ETH: 1, FSA: 2, ECO: 2, DER: 2, ALT: 1, PM: 2 },
  2:  { CORP: 2, FI: 1, EQU: 2, QM: 1, ETH: 0, FSA: 2, ECO: 1, DER: 1, ALT: 1, PM: 1 },
  3:  { CORP: 2, FI: 1, EQU: 2, QM: 2, ETH: 1, FSA: 3, ECO: 2, DER: 2, ALT: 1, PM: 2 },
  4:  { CORP: 2, FI: 1, EQU: 2, QM: 2, ETH: 0, FSA: 3, ECO: 2, DER: 2, ALT: 1, PM: 2 },
  5:  { CORP: 2, FI: 2, EQU: 2, QM: 2, ETH: 3, FSA: 3, ECO: 2, DER: 2, ALT: 2, PM: 2 },
  6:  { CORP: 2, FI: 2, EQU: 2, QM: 2, ETH: 3, FSA: 3, ECO: 2, DER: 2, ALT: 2, PM: 2 },
  7:  { CORP: 3, FI: 2, EQU: 2, QM: 2, ETH: 3, FSA: 3, ECO: 2, DER: 2, ALT: 2, PM: 2 },
  8:  { CORP: 2, FI: 3, EQU: 2, QM: 2, ETH: 3, FSA: 3, ECO: 2, DER: 2, ALT: 2, PM: 2 },
  9:  { CORP: 1, FI: 3, EQU: 1, QM: 3, ETH: 0, FSA: 2, ECO: 1, DER: 3, ALT: 1, PM: 2 },
  10: { CORP: 3, FI: 1, EQU: 2, QM: 1, ETH: 0, FSA: 2, ECO: 1, DER: 2, ALT: 1, PM: 2 },
  11: { CORP: 1, FI: 1, EQU: 2, QM: 2, ETH: 3, FSA: 3, ECO: 2, DER: 2, ALT: 2, PM: 2 },
}

const ETAPE_LABELS: Record<number, string> = {
  1: 'Reading Summary', 2: 'Essential Sheet', 3: 'LOS Sheet',
  4: 'Concept Check', 5: 'QBank Diagnostic', 6: 'Error Analysis',
  7: 'Exam Traps', 8: 'QBank Reinforcement', 9: 'Calculator Mastery',
  10: 'Decision Tree', 11: 'Spaced Repetition',
}

const ETAPE_THRESHOLDS = [0, 15, 25, 35, 45, 55, 65, 72, 80, 88, 94]

function getEtapeForProgress(pct: number): number {
  for (let i = ETAPE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (pct >= ETAPE_THRESHOLDS[i]) return i + 1
  }
  return 1
}

// ── Progress helper ──
function getTopicProgress(): Record<string, number> {
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
  return 120
}

function getTodaySessionCount(): number {
  try {
    const raw = localStorage.getItem('wingman_session_log')
    if (raw) {
      const log = JSON.parse(raw) as { date: string }[]
      const today = new Date().toISOString().slice(0, 10)
      return log.filter(e => e.date === today).length
    }
  } catch { /* ignore */ }
  return 1
}

function getTodayTotalMinutes(): number {
  try {
    const raw = localStorage.getItem('wingman_session_log')
    if (raw) {
      const log = JSON.parse(raw) as { date: string; minutes: number }[]
      const today = new Date().toISOString().slice(0, 10)
      return log.filter(e => e.date === today).reduce((sum, e) => sum + (e.minutes || 0), 0)
    }
  } catch { /* ignore */ }
  return 0
}

// ── Session debrief generator ──
interface SessionDebrief {
  kpis: {
    duration: number          // seconds
    durationMin: number       // minutes
    topicStudied: string
    topicName: string
    topicColor: string
    topicProgress: number
    topicWeight: number
    todaySessions: number
    todayTotalMin: number
    dailyGoalMin: number
    dailyPct: number
    daysToExam: number
  }
  weaknesses: { topic: string; name: string; pct: number; color: string; weight: number; potentialGain: number }[]
  strengths: { topic: string; name: string; pct: number; color: string }[]
  commentary: string[]       // paragraphs of advice
  nextSession: {
    topic: string
    name: string
    color: string
    lmCode: string | null
    lmTitle: string | null
    reason: string
    etape: number
    etapeLabel: string
    matrixPriority: number
  } | null
}

function buildDebrief(elapsed: number, selectedLM: SelectedLM | null): SessionDebrief {
  const progress = getTopicProgress()
  const daysToExam = getDaysToExam()
  const durationMin = Math.round(elapsed / 60)
  const topic = selectedLM?.topic ?? TOPIC_ORDER[0]
  const todaySessions = getTodaySessionCount()
  const todayTotalMin = getTodayTotalMinutes() + durationMin
  const dailyGoalMin = 90

  // Log this session
  try {
    const raw = localStorage.getItem('wingman_session_log')
    const log = raw ? JSON.parse(raw) : []
    log.push({ date: new Date().toISOString().slice(0, 10), topic, minutes: durationMin, elapsed })
    localStorage.setItem('wingman_session_log', JSON.stringify(log))
  } catch { /* ignore */ }

  const kpis: SessionDebrief['kpis'] = {
    duration: elapsed,
    durationMin,
    topicStudied: topic,
    topicName: TOPICS[topic] || topic,
    topicColor: TOPIC_COLORS[topic] || '#6366f1',
    topicProgress: progress[topic] ?? 0,
    topicWeight: TOPIC_WEIGHTS[topic] ?? 5,
    todaySessions,
    todayTotalMin,
    dailyGoalMin,
    dailyPct: Math.min(100, Math.round((todayTotalMin / dailyGoalMin) * 100)),
    daysToExam,
  }

  // Analyze all topics
  type TopicInfo = { topic: string; name: string; pct: number; color: string; weight: number; score: number }
  const allTopics: TopicInfo[] = TOPIC_ORDER.map(t => ({
    topic: t,
    name: TOPICS[t],
    pct: progress[t] ?? 0,
    color: TOPIC_COLORS[t],
    weight: TOPIC_WEIGHTS[t] ?? 5,
    score: (TOPIC_WEIGHTS[t] ?? 5) * (100 - (progress[t] ?? 0)),
  }))

  // Weaknesses: below 45%, sorted by weight desc
  const weaknesses = allTopics
    .filter(t => t.pct < 45)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4)
    .map(t => ({ ...t, potentialGain: Math.round(t.weight * 0.3) }))

  // Strengths: above 60%
  const strengths = allTopics
    .filter(t => t.pct >= 60)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3)

  // Commentary
  const commentary: string[] = []

  // Session quality
  if (durationMin >= 60) {
    commentary.push(`Excellent session — ${durationMin} minutes of focused study on ${TOPICS[topic]}. Deep sessions like this are where real encoding happens.`)
  } else if (durationMin >= 30) {
    commentary.push(`Solid ${durationMin}-minute session on ${TOPICS[topic]}. Consistent moderate sessions build strong retention.`)
  } else if (durationMin >= 10) {
    commentary.push(`Quick ${durationMin}-minute session on ${TOPICS[topic]}. Even short bursts reinforce neural pathways — but try to target 45+ min for deeper encoding.`)
  } else {
    commentary.push(`${durationMin}-minute micro-session on ${TOPICS[topic]}. Consider longer sessions for better concept integration.`)
  }

  // Topic-specific feedback with étape awareness
  const topicPct = progress[topic] ?? 0
  const topicWeight = TOPIC_WEIGHTS[topic] ?? 5
  const currentEtape = getEtapeForProgress(topicPct)
  const etName = ETAPE_LABELS[currentEtape] || `Step ${currentEtape}`
  const matPri = PRIORITY_MATRIX[currentEtape]?.[topic] ?? 1

  // Étape-based guidance
  const etapeAdvice = matPri === 3
    ? `★ ${etName} is HIGH PRIORITY for ${topic} — invest maximum effort here before advancing.`
    : matPri === 0
    ? `${etName} can be skipped for ${topic} — move to the next step in the method.`
    : `Current step: É${currentEtape} ${etName} (priority ${matPri}/3 for ${topic}).`

  if (topicPct < 30) {
    commentary.push(`${topic} is at ${topicPct}% (${topicWeight}% exam weight). ${etapeAdvice} Focus on reading summaries and essential sheets before diagnostics.`)
  } else if (topicPct < 50) {
    commentary.push(`${topic} at ${topicPct}% — approaching the breakthrough zone. ${etapeAdvice} Push past 50% by completing concept checks and diagnostic QBanks.`)
  } else if (topicPct < 70) {
    commentary.push(`${topic} at ${topicPct}% is developing well. ${etapeAdvice} Shift toward error analysis and exam traps.`)
  } else {
    commentary.push(`${topic} at ${topicPct}% — strong! ${etapeAdvice} Maintenance mode with spaced repetition is enough.`)
  }

  // Weakness alert
  const criticalWeaks = weaknesses.filter(w => w.pct < 25 && w.weight >= 10)
  if (criticalWeaks.length > 0) {
    const names = criticalWeaks.map(w => `${w.topic} (${w.pct}%, ${w.weight}% weight)`).join(', ')
    commentary.push(`⚠ Critical gaps detected: ${names}. These high-weight topics below 25% represent your biggest point losses on exam day. Prioritize them in your next sessions.`)
  }

  // Imbalance check
  const maxPct = Math.max(...allTopics.map(t => t.pct))
  const minPct = Math.min(...allTopics.map(t => t.pct))
  if (maxPct - minPct > 45) {
    const best = allTopics.find(t => t.pct === maxPct)!
    const worst = allTopics.find(t => t.pct === minPct)!
    commentary.push(`Profile imbalance: ${maxPct - minPct}pt spread between ${best.topic} (${maxPct}%) and ${worst.topic} (${minPct}%). The CFA penalizes weak areas more than it rewards strong ones — rebalance your allocation.`)
  }

  // Daily progress
  if (kpis.dailyPct >= 100) {
    commentary.push(`🎯 Daily goal reached! ${todayTotalMin} min across ${todaySessions} session${todaySessions > 1 ? 's' : ''}. Take a recovery break — your brain consolidates during rest.`)
  } else if (kpis.dailyPct >= 60) {
    commentary.push(`You're ${kpis.dailyPct}% toward your daily goal (${todayTotalMin}/${dailyGoalMin} min). ${dailyGoalMin - todayTotalMin} more minutes and you hit target — one more session tonight?`)
  }

  // Time pressure
  if (daysToExam < 60) {
    const avgMastery = Math.round(allTopics.reduce((s, t) => s + t.pct * t.weight, 0) / allTopics.reduce((s, t) => s + t.weight, 0))
    if (avgMastery < 50) {
      commentary.push(`J-${daysToExam}: With ${avgMastery}% weighted mastery, focus exclusively on high-weight weak areas. Every session should target maximum point recovery.`)
    }
  }

  // Next session recommendation — using priority matrix
  const nextCandidates = allTopics
    .filter(t => t.topic !== topic) // different from what was just studied
    .map(t => {
      const etape = getEtapeForProgress(t.pct)
      const matrixPri = PRIORITY_MATRIX[etape]?.[t.topic] ?? 1
      // Composite score: weight × gap × matrixPriority
      const compositeScore = t.weight * (100 - t.pct) * Math.max(matrixPri, 1)
      return { ...t, etape, matrixPri, compositeScore }
    })
    .sort((a, b) => b.compositeScore - a.compositeScore)

  // Pick best candidate, or fallback to highest-score topic
  let nextTopic: string, nextPct: number, nextWeight: number, nextName: string, nextColor: string
  let nextEtape: number, nextMatrixPri: number

  if (nextCandidates.length > 0) {
    const c = nextCandidates[0]
    nextTopic = c.topic; nextPct = c.pct; nextWeight = c.weight; nextName = c.name; nextColor = c.color
    nextEtape = c.etape; nextMatrixPri = c.matrixPri
  } else {
    const fb = [...allTopics].sort((a, b) => b.score - a.score)[0]
    nextTopic = fb.topic; nextPct = fb.pct; nextWeight = fb.weight; nextName = fb.name; nextColor = fb.color
    nextEtape = getEtapeForProgress(fb.pct); nextMatrixPri = PRIORITY_MATRIX[nextEtape]?.[fb.topic] ?? 1
  }

  const nextLMs = LM_DATA.filter(([t]) => t === nextTopic)
  const nextLM = nextLMs.length > 0 ? nextLMs[0] : null

  let nextReason = ''
  const etLabel = ETAPE_LABELS[nextEtape] || `Step ${nextEtape}`
  if (nextMatrixPri === 3) {
    nextReason = `★ HIGH PRIORITY — É${nextEtape} ${etLabel} is critical for ${nextTopic} (${nextPct}%, ${nextWeight}% weight)`
  } else if (nextPct < 25) {
    nextReason = `Critical gap — ${nextPct}% mastery, ${nextWeight}% weight → Start with É${nextEtape} ${etLabel}`
  } else if (nextPct < 45) {
    nextReason = `High ROI — É${nextEtape} ${etLabel} at ${nextPct}% (${nextWeight}% weight)`
  } else {
    nextReason = `Strategic — É${nextEtape} ${etLabel}, ${nextWeight}% weight at ${nextPct}%`
  }

  const nextSession: SessionDebrief['nextSession'] = {
    topic: nextTopic,
    name: nextName,
    color: nextColor,
    lmCode: nextLM ? `${nextTopic}/${nextLM[1]}` : null,
    lmTitle: nextLM ? nextLM[2] : null,
    reason: nextReason,
    etape: nextEtape,
    etapeLabel: ETAPE_LABELS[nextEtape] || `Step ${nextEtape}`,
    matrixPriority: nextMatrixPri,
  }

  return { kpis, weaknesses, strengths, commentary, nextSession }
}


// ── Pomodoro constants ──
const POMODORO_WORK = 45 * 60   // 45 minutes in seconds
const POMODORO_BREAK = 15 * 60  // 15 minutes in seconds

type PomodoroPhase = 'work' | 'break'

export default function SessionTimer({ onSessionEnd }: { onSessionEnd?: () => void }) {
  const [state, setState] = useState<TimerState>('idle')
  const [elapsed, setElapsed] = useState(0)        // total session time (work only)
  const [cycleTime, setCycleTime] = useState(0)     // time within current work/break phase
  const [phase, setPhase] = useState<PomodoroPhase>('work')
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [debrief, setDebrief] = useState<SessionDebrief | null>(null)
  const [eosOpen, setEosOpen] = useState(false)
  const [eosAutoOpened, setEosAutoOpened] = useState(false)

  // LM selection state
  const [selectedTopic, setSelectedTopic] = useState(TOPIC_ORDER[0])
  const [selectedLM, setSelectedLM] = useState<SelectedLM | null>(null)

  // Initialize first LM on mount
  useEffect(() => {
    const first = LM_DATA.find(([t]) => t === TOPIC_ORDER[0])
    if (first) {
      setSelectedLM({ topic: first[0], lmCode: first[1], title: first[2] })
    }
  }, [])

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  // Pomodoro phase transition effect
  useEffect(() => {
    if (state !== 'running') return

    if (phase === 'work' && cycleTime >= POMODORO_WORK) {
      // Work phase complete → switch to break
      setPhase('break')
      setCycleTime(0)
      setPomodoroCount(prev => prev + 1)
      // Play notification sound
      try { new Audio('data:audio/wav;base64,UklGRl9vT19teleUlFQkRhdGFb').play().catch(() => {}) } catch {}
    } else if (phase === 'break' && cycleTime >= POMODORO_BREAK) {
      // Break complete → back to work
      setPhase('work')
      setCycleTime(0)
    }
  }, [cycleTime, phase, state])

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setCycleTime(prev => prev + 1)
      setPhase(currentPhase => {
        if (currentPhase === 'work') {
          setElapsed(prev => prev + 1) // only count work time
        }
        return currentPhase
      })
    }, 1000)
  }

  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic)
    const first = LM_DATA.find(([t]) => t === topic)
    if (first) {
      setSelectedLM({ topic: first[0], lmCode: first[1], title: first[2] })
    }
  }

  const handleLMChange = (key: string) => {
    const entry = LM_DATA.find(([t, lm]) => `${t}/${lm}` === key)
    if (entry) {
      setSelectedLM({ topic: entry[0], lmCode: entry[1], title: entry[2] })
    }
  }

  const handleStart = async () => {
    try {
      const session = await api.startSession('study', selectedLM ? `${selectedLM.topic}/${selectedLM.lmCode}` : undefined)
      setSessionId(session.session_id)
    } catch {
      setSessionId(Date.now())
    }
    setElapsed(0)
    setCycleTime(0)
    setPhase('work')
    setPomodoroCount(0)
    setState('running')
    startTimer()
  }

  const handlePause = () => {
    clearTimer()
    setState('paused')
  }

  const handleResume = () => {
    setState('running')
    startTimer()
  }

  const handleStop = async () => {
    clearTimer()
    if (sessionId) {
      try {
        await api.stopSession(sessionId)
      } catch {
        console.error('Failed to stop session')
      }
    }
    // Build debrief with work-only elapsed time
    const summary = buildDebrief(elapsed, selectedLM)
    setDebrief(summary)
    setState('summary')
    // Auto-open End of Session modal the first time the user reaches the summary
    // for this session. Not on subsequent reloads of the summary view.
    if (!eosAutoOpened) {
      setEosOpen(true)
      setEosAutoOpened(true)
    }
    // Persist for later access — both the "latest" pointer (for /debrief) and
    // a per-session-id copy so the Journey tab can enrich rows after the fact.
    try {
      localStorage.setItem('wingman_last_debrief', JSON.stringify(summary))
      localStorage.setItem('wingman_last_debrief_ts', new Date().toISOString())
      if (sessionId) {
        localStorage.setItem(`wingman_debrief_${sessionId}`, JSON.stringify(summary))
      }
    } catch {}
    // Update topic progress based on session
    if (selectedLM) {
      try {
        const progress = getTopicProgress()
        const minutes = Math.floor(elapsed / 60)
        const bump = Math.min(5, Math.max(1, Math.round(minutes / 15)))
        progress[selectedLM.topic] = Math.min(100, (progress[selectedLM.topic] || 0) + bump)
        localStorage.setItem('wingman_topic_progress', JSON.stringify(progress))
      } catch {}
    }
    setSessionId(null)
  }

  // Skip break early → return to work
  const handleSkipBreak = () => {
    setPhase('work')
    setCycleTime(0)
  }

  const handleDismissSummary = () => {
    setDebrief(null)
    setElapsed(0)
    setCycleTime(0)
    setPhase('work')
    setPomodoroCount(0)
    setState('idle')
    onSessionEnd?.()
  }

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Format countdown for pomodoro phase
  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  // Pomodoro progress for the ring
  const phaseDuration = phase === 'work' ? POMODORO_WORK : POMODORO_BREAK
  const phaseRemaining = Math.max(0, phaseDuration - cycleTime)
  const phaseProgress = Math.min(1, cycleTime / phaseDuration)
  const circumference = 2 * Math.PI * 62 // radius = 62

  // ══════════════════════════════════════════════════════
  // END-OF-SESSION SUMMARY
  // ══════════════════════════════════════════════════════
  if (state === 'summary' && debrief) {
    const { kpis, weaknesses, strengths, commentary, nextSession } = debrief
    return (
      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="text-center pb-4 border-b border-white/[0.06]">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/20 mb-3">
            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent-green">Session Complete</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Session Debrief</h2>
          <p className="text-[11px] text-slate-500 mt-1">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>

        {/* ── KPI Grid (2×2) ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Duration */}
          <div className="rounded-xl bg-surface-800/60 border border-white/[0.06] p-4 text-center">
            <div className="text-2xl font-extrabold text-white tabular-nums">{formatDuration(kpis.duration)}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-600 mt-1">Duration</div>
          </div>

          {/* Topic studied */}
          <div className="rounded-xl bg-surface-800/60 border border-white/[0.06] p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: kpis.topicColor }} />
              <span className="text-lg font-extrabold text-white">{kpis.topicStudied}</span>
            </div>
            <div className="text-[9px] uppercase tracking-wider text-slate-600">{kpis.topicProgress}% mastery</div>
          </div>

          {/* Daily progress */}
          <div className="rounded-xl bg-surface-800/60 border border-white/[0.06] p-4 text-center">
            <div className="text-2xl font-extrabold tabular-nums" style={{ color: kpis.dailyPct >= 100 ? '#22c55e' : kpis.dailyPct >= 60 ? '#3b82f6' : '#f59e0b' }}>
              {kpis.dailyPct}%
            </div>
            <div className="text-[9px] uppercase tracking-wider text-slate-600 mt-1">Daily Goal</div>
            <div className="text-[10px] text-slate-500">{kpis.todayTotalMin}/{kpis.dailyGoalMin} min</div>
          </div>

          {/* Days to exam */}
          <div className="rounded-xl bg-surface-800/60 border border-white/[0.06] p-4 text-center">
            <div className="text-2xl font-extrabold text-white tabular-nums">J-{kpis.daysToExam}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-600 mt-1">Exam</div>
            <div className="text-[10px] text-slate-500">{kpis.todaySessions} session{kpis.todaySessions > 1 ? 's' : ''} today</div>
          </div>
        </div>

        {/* ── Topic Progress Bar ── */}
        <div className="rounded-xl bg-surface-800/40 border border-white/[0.04] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              {kpis.topicName}
            </span>
            <span className="text-xs font-bold tabular-nums" style={{ color: kpis.topicColor }}>
              {kpis.topicProgress}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-surface-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${kpis.topicProgress}%`, background: kpis.topicColor }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[9px] text-slate-600">{kpis.topicWeight}% exam weight</span>
            <span className="text-[9px] text-slate-600">{100 - kpis.topicProgress}% remaining</span>
          </div>
        </div>

        {/* ── Diagnostic Commentary ── */}
        <div className="rounded-xl bg-purple-500/[0.04] border border-purple-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Session Analysis</span>
          </div>
          <div className="space-y-2.5">
            {commentary.map((para, i) => (
              <p key={i} className="text-[11px] text-slate-300 leading-relaxed">{para}</p>
            ))}
          </div>
        </div>

        {/* ── Weaknesses to Watch ── */}
        {weaknesses.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-400">Weaknesses to Attack</span>
            </div>
            <div className="space-y-2">
              {weaknesses.map(w => (
                <div key={w.topic} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: w.color }}>
                    {w.topic}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-700 overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${w.pct}%`,
                          background: w.pct < 25 ? '#ef4444' : '#f59e0b',
                        }} />
                      </div>
                      <span className="text-[10px] font-bold tabular-nums" style={{ color: w.pct < 25 ? '#f87171' : '#fbbf24' }}>
                        {w.pct}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-600 shrink-0">+{w.potentialGain}pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Strengths ── */}
        {strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-400">Strengths</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {strengths.map(s => (
                <div key={s.topic} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-[11px] font-bold text-white">{s.topic}</span>
                  <span className="text-[10px] text-emerald-400 tabular-nums">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Next Session Recommendation ── */}
        {nextSession && (
          <div className="rounded-xl overflow-hidden border border-white/[0.06]">
            <div className="relative p-4">
              {/* Subtle glow */}
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{ background: `radial-gradient(ellipse at 30% 50%, ${nextSession.color}, transparent 70%)` }}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                    Recommended Next Session
                  </span>
                  {/* Matrix priority badge */}
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: nextSession.matrixPriority === 3 ? 'rgba(239,68,68,0.15)' : nextSession.matrixPriority === 2 ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)',
                      color: nextSession.matrixPriority === 3 ? '#F87171' : nextSession.matrixPriority === 2 ? '#FBBF24' : '#94A3B8',
                    }}
                  >
                    P{nextSession.matrixPriority}
                  </span>
                </div>

                {/* Étape badge + topic */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">
                    É{nextSession.etape} {nextSession.etapeLabel}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-md text-white" style={{ background: nextSession.color }}>
                    {nextSession.topic}
                  </span>
                  <span className="text-sm font-bold text-white">{nextSession.name}</span>
                </div>
                {nextSession.lmTitle && (
                  <p className="text-[11px] text-slate-400 mb-2 truncate">{nextSession.lmTitle}</p>
                )}
                <p className="text-[10px] text-slate-500 italic">{nextSession.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setEosOpen(true)}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            End of Session
          </button>
          {nextSession && (
            <button
              onClick={() => {
                handleTopicChange(nextSession.topic)
                handleDismissSummary()
              }}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-accent-blue hover:bg-blue-600 text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            >
              Start {nextSession.topic}
            </button>
          )}
          <button
            onClick={handleDismissSummary}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm text-slate-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-all"
          >
            Back to Dashboard
          </button>
        </div>

        <EndOfSessionModal
          open={eosOpen}
          onClose={() => setEosOpen(false)}
          blocks={selectedLM ? [{
            order: 1,
            topic_code: selectedLM.topic,
            lm_code: `${selectedLM.topic}-${selectedLM.lmCode}`,
            activity: 'Study session',
            minutes: Math.round(kpis.duration / 60),
          }] : []}
          onSaved={() => setEosOpen(false)}
        />
      </div>
    )
  }

  // ══════════════════════════════════════════════════════
  // TIMER UI (idle / running / paused)
  // ══════════════════════════════════════════════════════
  const topicLMs = LM_DATA.filter(([t]) => t === selectedTopic)
  const currentKey = selectedLM ? `${selectedLM.topic}/${selectedLM.lmCode}` : ''

  return (
    <div className="card flex flex-col items-center">
      <h2 className="card-header self-start">Session Timer</h2>

      {/* ── LM Selector ── */}
      {state === 'idle' && (
        <div className="w-full mb-4 space-y-2">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Module à étudier
          </label>

          {/* Topic selector - pill row */}
          <div className="flex flex-wrap gap-1.5">
            {TOPIC_ORDER.map(t => (
              <button
                key={t}
                onClick={() => handleTopicChange(t)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: selectedTopic === t ? TOPIC_COLORS[t] : 'rgba(255,255,255,0.06)',
                  color: selectedTopic === t ? '#fff' : '#94a3b8',
                  boxShadow: selectedTopic === t ? `0 0 12px ${TOPIC_COLORS[t]}44` : 'none',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* LM dropdown */}
          <select
            value={currentKey}
            onChange={e => handleLMChange(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm bg-surface-700 border border-surface-600 text-white
                       focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30 outline-none
                       appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            {topicLMs.map(([t, lm, title]) => (
              <option key={`${t}/${lm}`} value={`${t}/${lm}`}>
                {lm} — {title}
              </option>
            ))}
          </select>

          {/* Topic full name */}
          <div className="flex items-center gap-2 mt-1">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: TOPIC_COLORS[selectedTopic] }}
            />
            <span className="text-xs text-slate-500 truncate">
              {TOPICS[selectedTopic]}
            </span>
          </div>
        </div>
      )}

      {/* ── Selected LM badge during session ── */}
      {(state === 'running' || state === 'paused') && selectedLM && (
        <div className="w-full mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-700/80 border border-surface-600">
          <span
            className="shrink-0 w-2 h-2 rounded-full"
            style={{ background: TOPIC_COLORS[selectedLM.topic] }}
          />
          <span className="text-xs font-mono text-accent-blue shrink-0">
            {selectedLM.topic}/{selectedLM.lmCode}
          </span>
          <span className="text-xs text-slate-300 truncate">
            {selectedLM.title}
          </span>
        </div>
      )}

      {/* ── Pomodoro phase badge ── */}
      {(state === 'running' || state === 'paused') && (
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
            style={{
              background: phase === 'work' ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.12)',
              color: phase === 'work' ? '#4ADE80' : '#818CF8',
              border: `1px solid ${phase === 'work' ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.2)'}`,
            }}
          >
            <span>{phase === 'work' ? '🔥' : '☕'}</span>
            <span>{phase === 'work' ? 'Travail' : 'Pause'}</span>
          </div>
          {pomodoroCount > 0 && (
            <span className="text-[10px] text-slate-500 tabular-nums">
              {pomodoroCount} cycle{pomodoroCount > 1 ? 's' : ''} ✓
            </span>
          )}
        </div>
      )}

      {/* Timer ring with progress arc */}
      <div className="relative w-40 h-40 mb-4 flex items-center justify-center">
        {/* SVG progress ring */}
        {(state === 'running' || state === 'paused') && (
          <svg className="absolute inset-0 -rotate-90" width="160" height="160" viewBox="0 0 160 160">
            {/* Background track */}
            <circle
              cx="80" cy="80" r="62"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="6"
            />
            {/* Progress arc */}
            <circle
              cx="80" cy="80" r="62"
              fill="none"
              stroke={phase === 'work' ? '#22c55e' : '#6366f1'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - phaseProgress)}
              className="transition-all duration-1000"
            />
          </svg>
        )}

        {/* Static ring for idle */}
        {state === 'idle' && (
          <div className="absolute inset-[12px] rounded-full border-4 border-surface-600" />
        )}

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center">
          {(state === 'running' || state === 'paused') ? (
            <>
              {/* Countdown within phase */}
              <span className="text-3xl font-mono font-bold text-white tabular-nums">
                {formatCountdown(phaseRemaining)}
              </span>
              <span className="text-[9px] uppercase tracking-wider mt-0.5" style={{
                color: phase === 'work' ? '#4ADE80' : '#818CF8',
              }}>
                {phase === 'work' ? `restant` : `repos`}
              </span>
              {/* Total work time below */}
              <span className="text-[10px] text-slate-500 mt-1 tabular-nums">
                Total: {formatTime(elapsed)}
              </span>
            </>
          ) : (
            <>
              <span className="text-3xl font-mono font-bold text-white tabular-nums">
                {formatTime(elapsed)}
              </span>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">
                45/15 pomodoro
              </span>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {state === 'idle' && (
          <>
            <button onClick={handleStart} className="btn-primary">
              Start
            </button>
            {typeof window !== 'undefined' && localStorage.getItem('wingman_last_debrief') && (
              <button
                onClick={() => {
                  try {
                    const saved = JSON.parse(localStorage.getItem('wingman_last_debrief') || '')
                    setDebrief(saved)
                    setState('summary')
                  } catch {}
                }}
                className="btn-ghost text-xs flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Dernier debrief
              </button>
            )}
          </>
        )}
        {state === 'running' && phase === 'work' && (
          <>
            <button onClick={handlePause} className="btn-ghost">
              Pause
            </button>
            <button onClick={handleStop} className="btn-danger">
              Stop
            </button>
          </>
        )}
        {state === 'running' && phase === 'break' && (
          <>
            <button onClick={handleSkipBreak} className="btn-ghost text-xs">
              Skip pause
            </button>
            <button onClick={handleStop} className="btn-danger">
              Stop
            </button>
          </>
        )}
        {state === 'paused' && (
          <>
            <button onClick={handleResume} className="btn-primary">
              Resume
            </button>
            <button onClick={handleStop} className="btn-danger">
              Stop
            </button>
          </>
        )}
      </div>

      {(state === 'running' || state === 'paused') && (
        <p className="text-xs text-slate-500 mt-2">
          Session #{sessionId}
        </p>
      )}
    </div>
  )
}
