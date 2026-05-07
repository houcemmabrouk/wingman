'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth'
import { apiSafe, fetchStreak, fetchTodayStats } from '@/lib/wingmanApi'
// Streak + stats now fetched from API in useEffect below
import { TOPIC_ORDER, TOPIC_COLORS, TOPICS, EXAM_WEIGHTS } from '@/lib/lm-data'
import VelocityBadge from '@/components/topbar/VelocityBadge'
import VelocityModal, { VelocityResult, VelocityVerdict } from '@/components/topbar/VelocityModal'
import StreakModal from '@/components/topbar/StreakModal'
import ProgressModal from '@/components/topbar/ProgressModal'
import ExamCountdownModal from '@/components/topbar/ExamCountdownModal'
import TodayStudyModal from '@/components/topbar/TodayStudyModal'
import NotificationCenter from '@/components/topbar/NotificationCenter'

// ── Pomodoro Timer ──────────────────────────────────────────
const WORK_MIN = 45
const BREAK_MIN = 15
const STORAGE_KEY = 'wingman_pomodoro'

type PomodoroPhase = 'idle' | 'work' | 'break'

interface PomodoroState {
  phase: PomodoroPhase
  secondsLeft: number
  totalPomodoros: number
  totalWorkSec: number        // total focus seconds this session
  todayPomodoros: number
  startedAt: number | null    // timestamp when current pomodoro started
  paused: boolean
}

function loadPomodoroState(): PomodoroState {
  if (typeof window === 'undefined') return defaultState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      // Reset if it's a different day
      const today = new Date().toDateString()
      if (s._day !== today) return defaultState()
      return { ...defaultState(), todayPomodoros: s.todayPomodoros || 0, totalWorkSec: s.totalWorkSec || 0 }
    }
  } catch { /* */ }
  return defaultState()
}

function defaultState(): PomodoroState {
  return { phase: 'idle', secondsLeft: WORK_MIN * 60, totalPomodoros: 0, totalWorkSec: 0, todayPomodoros: 0, startedAt: null, paused: false }
}

function savePomodoroState(s: { todayPomodoros: number; totalWorkSec: number }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, _day: new Date().toDateString() }))
}

function usePomodoro() {
  const [phase, setPhase] = useState<PomodoroPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(WORK_MIN * 60)
  const [totalPomodoros, setTotalPomodoros] = useState(0)
  const [totalWorkSec, setTotalWorkSec] = useState(0)
  const [todayPomodoros, setTodayPomodoros] = useState(0)
  const [paused, setPaused] = useState(false)
  const phaseRef = useRef<PomodoroPhase>('idle')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Load persisted state on mount
  useEffect(() => {
    const s = loadPomodoroState()
    setTodayPomodoros(s.todayPomodoros)
    setTotalWorkSec(s.totalWorkSec)
  }, [])

  useEffect(() => { phaseRef.current = phase }, [phase])

  // Persist stats
  useEffect(() => {
    if (todayPomodoros > 0 || totalWorkSec > 0) {
      savePomodoroState({ todayPomodoros, totalWorkSec })
    }
  }, [todayPomodoros, totalWorkSec])

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    return audioCtxRef.current
  }, [])

  const playBreakChime = useCallback(() => {
    try {
      const ctx = getAudioCtx()
      const t = ctx.currentTime
      // Warm descending arpeggio: C5 → A4 → F4 → C4
      const freqs = [523, 440, 349, 262]
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, t + i * 0.2)
        gain.gain.linearRampToValueAtTime(0.2, t + i * 0.2 + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.2 + 0.4)
        osc.connect(gain); gain.connect(ctx.destination)
        osc.start(t + i * 0.2); osc.stop(t + i * 0.2 + 0.5)
      })
      // Second softer repeat
      setTimeout(() => {
        const t2 = ctx.currentTime
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0, t2 + i * 0.2)
          gain.gain.linearRampToValueAtTime(0.12, t2 + i * 0.2 + 0.05)
          gain.gain.exponentialRampToValueAtTime(0.001, t2 + i * 0.2 + 0.4)
          osc.connect(gain); gain.connect(ctx.destination)
          osc.start(t2 + i * 0.2); osc.stop(t2 + i * 0.2 + 0.5)
        })
      }, 1200)
    } catch { /* */ }
  }, [getAudioCtx])

  const playWorkChime = useCallback(() => {
    try {
      const ctx = getAudioCtx()
      const t = ctx.currentTime
      // Energetic ascending: C4 → E4 → G4 → C5
      const freqs = [262, 330, 392, 523]
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, t + i * 0.15)
        gain.gain.linearRampToValueAtTime(0.22, t + i * 0.15 + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.35)
        osc.connect(gain); gain.connect(ctx.destination)
        osc.start(t + i * 0.15); osc.stop(t + i * 0.15 + 0.4)
      })
      // Triumphant double-hit at end
      setTimeout(() => {
        const t2 = ctx.currentTime
        ;[523, 659].forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0.18, t2)
          gain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.6)
          osc.connect(gain); gain.connect(ctx.destination)
          osc.start(t2); osc.stop(t2 + 0.7)
        })
      }, 900)
    } catch { /* */ }
  }, [getAudioCtx])

  const showNotification = useCallback((title: string, body: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon.svg' })
    }
  }, [])

  const clearTimer = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  const stop = useCallback(() => {
    clearTimer()
    setPhase('idle')
    setSecondsLeft(WORK_MIN * 60)
    setPaused(false)
  }, [clearTimer])

  const startInterval = useCallback(() => {
    clearTimer()
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          const current = phaseRef.current
          if (current === 'work') {
            playBreakChime()
            showNotification(
              'Well-deserved break!',
              `Excellent work! Take ${BREAK_MIN} minutes to rest. Stand up, stretch, hydrate.`
            )
            setTotalPomodoros(p => p + 1)
            setTodayPomodoros(p => p + 1)
            setTotalWorkSec(p => p + WORK_MIN * 60)
            setPhase('break')
            return BREAK_MIN * 60
          } else {
            playWorkChime()
            showNotification(
              "Let's go!",
              `Break is over. ${WORK_MIN} minutes of focus. You've got this!`
            )
            setPhase('work')
            return WORK_MIN * 60
          }
        }
        return prev - 1
      })
    }, 1000)
  }, [clearTimer, playBreakChime, playWorkChime, showNotification])

  const start = useCallback(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    setPhase('work')
    setSecondsLeft(WORK_MIN * 60)
    setPaused(false)
    startInterval()
  }, [startInterval])

  const togglePause = useCallback(() => {
    if (paused) {
      startInterval()
      setPaused(false)
    } else {
      clearTimer()
      setPaused(true)
    }
  }, [paused, startInterval, clearTimer])

  const skipPhase = useCallback(() => {
    const current = phaseRef.current
    if (current === 'work') {
      setTotalWorkSec(p => p + (WORK_MIN * 60 - secondsLeft))
      playBreakChime()
      setTotalPomodoros(p => p + 1)
      setTodayPomodoros(p => p + 1)
      setPhase('break')
      setSecondsLeft(BREAK_MIN * 60)
    } else if (current === 'break') {
      playWorkChime()
      setPhase('work')
      setSecondsLeft(WORK_MIN * 60)
    }
    if (!paused) startInterval()
  }, [secondsLeft, paused, playBreakChime, playWorkChime, startInterval])

  useEffect(() => () => clearTimer(), [clearTimer])

  return { phase, secondsLeft, totalPomodoros, todayPomodoros, totalWorkSec, paused, start, stop, togglePause, skipPhase }
}

// ── Format helpers ──────────────────────────────────────────

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`
  return `${m}min`
}

// ── Pomodoro Widget ─────────────────────────────────────────

function PomodoroWidget() {
  const { phase, secondsLeft, totalPomodoros, todayPomodoros, totalWorkSec, paused, start, stop, togglePause, skipPhase } = usePomodoro()
  const [expanded, setExpanded] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setExpanded(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isBreak = phase === 'break'
  const maxSec = isBreak ? BREAK_MIN * 60 : WORK_MIN * 60
  const elapsed = maxSec - secondsLeft
  const pct = maxSec > 0 ? (elapsed / maxSec) * 100 : 0
  const circumference = 2 * Math.PI * 16 // r=16

  // Idle state — just a start button
  if (phase === 'idle') {
    return (
      <div className="relative" ref={panelRef}>
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group"
          title={`Pomodoro — ${WORK_MIN}min work / ${BREAK_MIN}min break`}>
          <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-[11px] font-semibold text-emerald-400 group-hover:text-emerald-300">Pomodoro</span>
          {todayPomodoros > 0 && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 rounded px-1">{todayPomodoros}</span>
          )}
        </button>

        {expanded && (
          <div className="absolute right-0 top-full mt-2 w-[280px] bg-[#161822] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-[60]">
            <div className="p-4 text-center">
              <div className="w-24 h-24 mx-auto mb-3 relative">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#34d399" strokeWidth="3"
                    strokeDasharray={`0 ${circumference}`} strokeLinecap="round" opacity="0.2" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-mono font-bold text-white tabular-nums">{WORK_MIN}:00</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Ready</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-4">{WORK_MIN} min focus &middot; {BREAK_MIN} min break</p>
              <button onClick={() => { start(); setExpanded(false) }}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors">
                Start session
              </button>

              {todayPomodoros > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{todayPomodoros}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Pomodoros</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{formatDuration(totalWorkSec)}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Work</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Active state — compact inline + expandable panel
  const strokeColor = isBreak ? '#22d3ee' : '#34d399'
  const bgClass = isBreak ? 'bg-cyan-500/10 border-cyan-500/25' : 'bg-emerald-500/10 border-emerald-500/25'
  const textClass = isBreak ? 'text-cyan-400' : 'text-emerald-400'
  const timerClass = isBreak ? 'text-cyan-300' : 'text-emerald-300'
  const phaseLabel = isBreak ? 'BREAK' : 'FOCUS'
  const phaseEmoji = isBreak ? '\u2615' : '\u270E' // coffee / pencil

  return (
    <div className="relative" ref={panelRef}>
      {/* Compact inline bar */}
      <button onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer hover:brightness-110 ${bgClass} ${paused ? 'opacity-60 animate-pulse' : ''}`}>
        {/* Mini ring */}
        <div className="relative w-7 h-7 flex-shrink-0">
          <svg className="w-7 h-7 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle cx="20" cy="20" r="16" fill="none"
              stroke={strokeColor} strokeWidth="3"
              strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px]">{phaseEmoji}</span>
        </div>

        <div className="flex flex-col items-start leading-none">
          <span className={`text-[10px] font-extrabold tracking-wider ${textClass}`}>{phaseLabel}</span>
          <span className={`text-[14px] font-mono font-bold tabular-nums ${timerClass}`}>
            {formatTime(secondsLeft)}
          </span>
        </div>

        {totalPomodoros > 0 && (
          <div className="flex gap-[2px] ml-0.5">
            {Array.from({ length: Math.min(totalPomodoros, 6) }).map((_, i) => (
              <div key={i} className="w-[5px] h-[5px] rounded-full bg-emerald-400/70" />
            ))}
            {totalPomodoros > 6 && <span className="text-[9px] text-slate-500 ml-0.5">+{totalPomodoros - 6}</span>}
          </div>
        )}
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="absolute right-0 top-full mt-2 w-[300px] bg-[#161822] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-[60]">
          {/* Big timer ring */}
          <div className="p-5 text-center">
            <div className="w-32 h-32 mx-auto mb-4 relative">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2.5" />
                <circle cx="20" cy="20" r="16" fill="none"
                  stroke={strokeColor} strokeWidth="2.5"
                  strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                  style={{ filter: `drop-shadow(0 0 6px ${strokeColor}40)` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-mono font-bold tabular-nums ${timerClass}`}>
                  {formatTime(secondsLeft)}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${textClass}`}>
                  {phaseLabel} {phaseEmoji}
                </span>
                {paused && (
                  <span className="text-[10px] text-amber-400 font-bold mt-1 animate-pulse">PAUSED</span>
                )}
              </div>
            </div>

            {/* Progress bar underneath */}
            <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden mb-4">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${pct}%`, background: strokeColor }} />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2.5 mb-4">
              {/* Pause / Resume */}
              <button onClick={togglePause}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  paused
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-300'
                }`}
                title={paused ? 'Resume' : 'Pause'}>
                {paused ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Skip to next phase */}
              <button onClick={skipPhase}
                className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 flex items-center justify-center transition-colors"
                title={isBreak ? 'Back to work' : 'Skip to break'}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  <rect x="14" y="7" width="2" height="6" rx="0.5" fill="currentColor" />
                </svg>
              </button>

              {/* Stop */}
              <button onClick={stop}
                className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors"
                title="Stop">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Session stats */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06]">
              <div className="text-center">
                <p className="text-[18px] font-bold text-white">{totalPomodoros}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-[18px] font-bold text-white">{formatDuration(totalWorkSec + (phase === 'work' ? elapsed : 0))}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Focus</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-[3px]">
                  {Array.from({ length: Math.min(todayPomodoros, 8) }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full" style={{ background: strokeColor, opacity: 0.4 + (i / 8) * 0.6 }} />
                  ))}
                  {todayPomodoros === 0 && <span className="text-slate-600 text-[11px]">—</span>}
                </div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">Today</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Topbar ──────────────────────────────────────────────────

interface TopbarProps {
  daysToExam: number | null
  examDateIso: string | null
  userName: string
  onMenuToggle?: () => void
}

export default function Topbar({ daysToExam, examDateIso, userName, onMenuToggle }: TopbarProps) {
  const { logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [countdownOpen, setCountdownOpen] = useState(false)
  const [todayOpen, setTodayOpen] = useState(false)
  const [streakOpen, setStreakOpen] = useState(false)
  const [progressOpen, setProgressOpen] = useState(false)
  const [topicMastery, setTopicMastery] = useState<{ code: string; mastery: number }[]>([])
  const menuRef = useRef<HTMLDivElement>(null)
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const urgent = daysToExam !== null && daysToExam < 90

  // examDateIso is now passed as a prop (LayoutShell fetches it from
  // /api/user/profile so it's persistent across browsers/devices).

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Stats: progress, streak, today minutes (from DB) ──
  const [globalPct, setGlobalPct] = useState(0)
  const [streak, setStreak] = useState(0)
  const [streakDays, setStreakDays] = useState<{ date: string; active: boolean; dow: string }[]>([])
  const [todayMin, setTodayMin] = useState(0)
  const goalPct = 70

  // Velocity badge + modal
  const [velocity, setVelocity] = useState<VelocityResult | null>(null)
  const [velocityVerdict, setVelocityVerdict] = useState<VelocityVerdict | null>(null)
  const [velocityOpen, setVelocityOpen] = useState(false)
  const [viewportCompact, setViewportCompact] = useState(false) // tablet: hide sparkline
  const velocityButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    // Topic mastery — weighted average → global progression bar
    apiSafe<{ topics: { code: string; mastery: number }[] }>('/api/kpis/topic-mastery', { topics: [] }).then(d => {
      let totalWeight = 0, weightedSum = 0
      for (const t of d.topics) {
        const w = EXAM_WEIGHTS[t.code] ?? 5
        totalWeight += w
        weightedSum += w * (t.mastery || 0)
      }
      setGlobalPct(totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0)
      setTopicMastery(d.topics)
      const progress: Record<string, number> = {}
      for (const t of d.topics) progress[t.code] = t.mastery
      try { localStorage.setItem('wingman_topic_progress', JSON.stringify(progress)) } catch {}
    })

    // Streak — count + 7-day trail
    fetchStreak().then(d => { setStreak(d.streak); setStreakDays(d.days) })

    // Today minutes: backend total + currently-running Pomodoro work cycle
    // (the local accumulator in `wingman_pomodoro` is reset daily, see
    // `loadState`). Polled every 30s so the topbar reflects activity without
    // manual reload.
    const refreshTodayMin = async () => {
      const d = await fetchTodayStats()
      let backendMin = Math.round(d.total_minutes || 0)
      try {
        const raw = localStorage.getItem('wingman_pomodoro')
        if (raw) {
          const ps = JSON.parse(raw)
          const todayPomos: number = Number(ps?.todayPomodoros) || 0
          backendMin += todayPomos * WORK_MIN
          if (ps?.phase === 'work' && typeof ps.secondsLeft === 'number') {
            const elapsedSec = Math.max(0, WORK_MIN * 60 - ps.secondsLeft)
            backendMin += Math.round(elapsedSec / 60)
          }
        }
      } catch { /* ignore */ }
      setTodayMin(backendMin)
    }
    refreshTodayMin()
    const id = setInterval(refreshTodayMin, 30_000)

    // Velocity badge — embedded in /api/readiness/ payload
    apiSafe<{ velocity?: VelocityResult; velocity_verdict?: VelocityVerdict }>('/api/readiness/', {}).then(d => {
      if (d.velocity)         setVelocity(d.velocity)
      if (d.velocity_verdict) setVelocityVerdict(d.velocity_verdict)
    })

    return () => clearInterval(id)
  }, [])

  // Track viewport to toggle compact (tablet) variant of the badge.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => setViewportCompact(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return (
    <header className="h-[48px] border-b border-white/[0.06] px-3 md:px-5 flex items-center justify-between bg-surface-900/90 backdrop-blur-sm sticky top-0 z-50">
      {/* Left — Hamburger (mobile) + Logo */}
      <div className="flex items-center gap-2 md:gap-3">
        {onMenuToggle && (
          <button onClick={onMenuToggle} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <a href="/onboarding" className="text-lg md:text-xl font-extrabold text-white tracking-tight hover:opacity-80 transition">
          Wing<span className="text-blue-400">man</span>
        </a>
      </div>

      {/* Center — Stats panel (hidden on mobile) */}
      {/* Visual rhythm: every block has the same shape — 11px label uppercase
          on top, value cluster below with consistent baseline. Separators are
          shorter (h-6) so the 60px topbar feels less crowded. */}
      <div className="hidden md:flex items-center gap-5">
        {/* Today — primary KPI (most-used), gets the largest value */}
        <button
          onClick={() => setTodayOpen(true)}
          title="Voir le détail du temps d'étude"
          className="flex flex-col gap-1 px-2 py-1 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
        >
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Today</span>
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="text-[18px] font-black text-white tabular-nums">{todayMin}</span>
            <span className="text-[10px] text-slate-500">min</span>
          </div>
        </button>

        <div className="w-px h-6 bg-white/[0.06]" />

        {/* Streak — 7-day dot trail (T F S S M T W) + count, opens detail modal */}
        <button
          onClick={() => setStreakOpen(true)}
          className="flex flex-col gap-1 group focus:outline-none"
          aria-label="Voir le détail du streak"
        >
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] group-hover:text-white transition-colors">Streak</span>
          <div className="flex items-center gap-2 leading-none">
            <div className="flex items-end gap-1.5">
              {streakDays.slice(-7).map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <span className={`w-2 h-2 rounded-full ${
                    day.active
                      ? 'bg-emerald-400 shadow-[0_0_4px_rgba(34,197,94,0.5)]'
                      : 'border border-slate-600 bg-transparent'
                  }`} />
                  <span className="text-[8px] text-slate-500 leading-none">{day.dow}</span>
                </div>
              ))}
            </div>
            <div className="flex items-baseline gap-1 ml-1">
              <span className="text-[16px] font-black text-emerald-400 tabular-nums">{streak}</span>
              <span className="text-[10px] text-slate-500">days</span>
            </div>
          </div>
        </button>

        <div className="w-px h-6 bg-white/[0.06]" />

        {/* Global Progression — clickable, opens detail modal with per-topic breakdown */}
        <button
          onClick={() => setProgressOpen(true)}
          className="flex flex-col gap-1 group focus:outline-none"
          aria-label="Voir le détail de la progression"
        >
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] group-hover:text-white transition-colors">Progress</span>
          <div className="flex items-center gap-2 leading-none">
            <div className="w-24 h-1.5 rounded-full bg-white/[0.06] overflow-hidden relative">
              <div className="absolute top-0 bottom-0 w-px bg-white/30 z-10" style={{ left: `${goalPct}%` }} />
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.max(2, globalPct)}%`,
                  background: globalPct >= goalPct
                    ? '#22c55e'
                    : globalPct >= 50
                      ? '#3b82f6'
                      : '#f59e0b',
                }}
              />
            </div>
            <span className="text-[14px] font-black text-white tabular-nums">{globalPct}<span className="text-[10px] text-slate-500 font-semibold">/{goalPct}%</span></span>
          </div>
        </button>
      </div>

      {/* Velocity modal — mounted at topbar root */}
      {velocity && velocityVerdict && (
        <VelocityModal
          open={velocityOpen}
          onClose={() => {
            setVelocityOpen(false)
            // Return focus to badge per spec
            setTimeout(() => velocityButtonRef.current?.focus(), 0)
          }}
          velocity={velocity}
          verdict={velocityVerdict}
        />
      )}

      <ExamCountdownModal
        open={countdownOpen}
        onClose={() => setCountdownOpen(false)}
        examDateIso={examDateIso}
      />

      <TodayStudyModal
        open={todayOpen}
        onClose={() => setTodayOpen(false)}
      />

      <StreakModal
        open={streakOpen}
        onClose={() => setStreakOpen(false)}
        streak={streak}
        days={streakDays}
      />

      <ProgressModal
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        globalPct={globalPct}
        goalPct={goalPct}
        topics={topicMastery}
      />

      {/* Right — Velocity + Pomodoro + Exam Countdown + User */}
      <div className="flex items-center gap-2 md:gap-3">
        {velocity && velocityVerdict && (
          <VelocityBadge
            ref={velocityButtonRef}
            velocityPct={velocity.velocity_weekly_pct}
            status={velocity.velocity_status}
            label={velocity.velocity_label}
            onTrack={velocity.on_track_for_exam}
            trend={velocity.trend}
            compact={viewportCompact}
            onClick={() => setVelocityOpen(true)}
          />
        )}

        <PomodoroWidget />

        {daysToExam !== null && (
          <button
            onClick={() => setCountdownOpen(true)}
            title="Voir le détail du countdown"
            className="group flex items-center gap-2"
          >
            <div className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
              urgent
                ? 'text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/15'
                : daysToExam < 180
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15'
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                urgent ? 'bg-red-400' : daysToExam < 180 ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
              <span className="text-[15px] font-mono font-black tabular-nums leading-none">
                D&minus;{daysToExam}
              </span>
              <span className="hidden md:inline text-[9px] uppercase tracking-wider opacity-70 leading-none">
                {Math.floor(daysToExam / 7)}w
              </span>
            </div>
          </button>
        )}

        <NotificationCenter />

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center hover:bg-blue-500/30 transition-colors">
            <span className="text-[11px] font-bold text-blue-400">{initials}</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-[#161822] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50">
              {/* User header */}
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-blue-400">{initials}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{userName}</p>
                  <p className="text-[10px] text-slate-500">CFA Level I</p>
                </div>
              </div>

              {/* Menu sections */}
              <div className="py-1">
                {[
                  { label: 'Profile',          icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', href: '/settings/profile' },
                  { label: 'Plan',             icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', href: '/settings/plan' },
                  { label: 'Billing',          icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', href: '/settings/billing' },
                ].map(item => (
                  <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[12px] text-slate-300 hover:bg-white/[0.05] hover:text-white transition-colors">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="border-t border-white/[0.06] py-1">
                {[
                  { label: 'Configuration',    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', href: '/settings/configuration' },
                  { label: 'Settings',         icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', href: '/settings' },
                  { label: 'Notifications',    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', href: '/settings/notifications' },
                  { label: 'Sync',              icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', href: '/settings/sync' },
                ].map(item => (
                  <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[12px] text-slate-300 hover:bg-white/[0.05] hover:text-white transition-colors">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="border-t border-white/[0.06] py-1">
                {[
                  { label: 'Options',          icon: 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z', href: '/settings/options' },
                  { label: 'Help',             icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', href: '/settings/help' },
                ].map(item => (
                  <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[12px] text-slate-300 hover:bg-white/[0.05] hover:text-white transition-colors">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="border-t border-white/[0.06] py-1">
                <button onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-red-400 hover:bg-red-500/10 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
