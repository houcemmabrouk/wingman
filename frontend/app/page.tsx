'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fetchTopicMastery } from '@/lib/wingmanApi'
import { TOPICS, TOPIC_COLORS, TOPIC_ORDER, EXAM_WEIGHTS as TOPIC_WEIGHTS } from '@/lib/lm-data'
import { generateSession, SIGNAL_COLORS, type SessionData } from '@/lib/sessionMatrix'
import { LM_DATA } from '@/lib/lm-data'
import EndOfSessionModal from '@/components/EndOfSessionModal'
import HelpTooltip from '@/components/ui/HelpTooltip'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface PlanningTodayBlock {
  order: number
  topic_code: string
  lm_code?: string
  activity: string
  minutes: number
  rationale_rule: number
}

interface PlanningState {
  today_blocks: PlanningTodayBlock[]
  rationale: string
  coaching_reminders?: string[]
  tutor_tone?: 'supportive' | 'harsh'
  schedule_status?: string
  error?: string
  source?: 'fresh' | 'cache' | 'backup' | 'coach'
  _fallback_reason?: string
  _snapshot_generated_at?: string
  _coach_override?: boolean
  _coach_set_at?: string
}

type Energy = 'high' | 'mid' | 'low'

interface OutlookDay {
  day_offset: number
  focus_topic_codes: string[]
  total_minutes: number
  includes_mock: boolean
  includes_srs: boolean
  is_rest_day: boolean
  source: string
  date: string
  weekday: string
}

function getProgress(): Record<string, number> {
  // The Topbar overwrites this localStorage every paint with the freshest
  // /api/kpis/topic-mastery for the CURRENT user, but on first paint it can
  // still hold the previous user's snapshot (especially if auth.tsx didn't
  // run flushPerUserCaches yet). Defensive default so a fresh login doesn't
  // see fake progress before the API roundtrip.
  try {
    const s = localStorage.getItem('wingman_topic_progress')
    if (s) return JSON.parse(s)
  } catch {}
  return { ETH: 0, QM: 0, ECO: 0, FSA: 0, CORP: 0, EQU: 0, FI: 0, DER: 0, ALT: 0, PM: 0 }
}

// Per-LM progress: { 'ETH/LM01': 69.7, ... }. Populated by quiz debriefs.
// If empty but legacy wingman_topic_progress has values, migrate assuming the
// topic score came from LM01 (the most common first-quiz pattern).
function getLmProgress(): Record<string, number> {
  try {
    const s = localStorage.getItem('wingman_lm_progress')
    if (s) return JSON.parse(s)
  } catch {}
  // One-shot migration from the legacy topic-level key.
  try {
    const legacy = localStorage.getItem('wingman_topic_progress')
    if (legacy) {
      const topic: Record<string, number> = JSON.parse(legacy)
      const migrated: Record<string, number> = {}
      for (const [code, pct] of Object.entries(topic)) {
        if (pct && pct > 0) migrated[`${code}/LM01`] = pct
      }
      localStorage.setItem('wingman_lm_progress', JSON.stringify(migrated))
      return migrated
    }
  } catch {}
  return {}
}

const TOPIC_INTROS: Record<string, string> = {
  ETH: 'Ethics & Professional Standards sets the behavioral foundation for all CFA charterholders. Covers the Code of Ethics, Standards of Professional Conduct, and GIPS.',
  QM: 'Quantitative Methods provides the mathematical toolkit — time value of money, probability, hypothesis testing, and regression analysis.',
  ECO: 'Economics covers micro/macro theory, business cycles, monetary & fiscal policy, international trade, and exchange rates.',
  FSA: 'Financial Statement Analysis is the largest topic area. Income statements, balance sheets, cash flows, ratios, and financial reporting quality.',
  CORP: 'Corporate Issuers covers governance, capital structure, working capital management, and capital budgeting decisions.',
  EQU: 'Equity Investments covers valuation models, market efficiency, equity indices, and industry analysis.',
  FI: 'Fixed Income covers bond features, valuation, yield measures, duration, convexity, and credit analysis.',
  DER: 'Derivatives covers forwards, futures, options, swaps — pricing, payoffs, and risk management applications.',
  ALT: 'Alternative Investments covers hedge funds, private equity, real estate, commodities, and infrastructure.',
  PM: 'Portfolio Management covers modern portfolio theory, asset allocation, risk management, and the investment policy statement.',
}

const TOPIC_DIFFICULTY: Record<string, { level: string; color: string }> = {
  ETH: { level: 'Medium', color: '#f59e0b' }, QM: { level: 'Hard', color: '#ef4444' },
  ECO: { level: 'Medium', color: '#f59e0b' }, FSA: { level: 'Hard', color: '#ef4444' },
  CORP: { level: 'Easy', color: '#22c55e' }, EQU: { level: 'Medium', color: '#f59e0b' },
  FI: { level: 'Hard', color: '#ef4444' }, DER: { level: 'Hard', color: '#ef4444' },
  ALT: { level: 'Easy', color: '#22c55e' }, PM: { level: 'Medium', color: '#f59e0b' },
}

const PEER_AVG: Record<string, number> = {
  ETH: 68, QM: 55, ECO: 58, FSA: 52, CORP: 63, EQU: 60, FI: 49, DER: 47, ALT: 62, PM: 57,
}

const EXAM_WEIGHT_RANGES: Record<string, string> = {
  ETH: '15–20%', QM: '8–12%', ECO: '8–12%', FSA: '13–17%', CORP: '8–12%',
  EQU: '10–12%', FI: '11–14%', DER: '5–8%', ALT: '5–8%', PM: '5–8%',
}

const SESSION_MODES = [
  { key: 'discovery', name: 'Discovery', desc: 'First guided reading', icon: '📖' },
  { key: 'reinforce', name: 'Reinforcement', desc: 'Consolidate weak LOS', icon: '🔁' },
  { key: 'eval', name: 'Targeted Assessment', desc: 'Quiz critical points', icon: '🎯' },
  { key: 'audio', name: 'Passive Audio', desc: 'Zero effort listening', icon: '🎧' },
  { key: 'flashcards', name: 'Flashcards', desc: 'Active recall SRS', icon: '⚡' },
]

// Map an activity label (what the Planning Skill emits) to the asset file in
// generated_content/{TOPIC}/{LM}/. Unmapped activities (Error Debrief, SRS review,
// Mock 20q) have no standalone content asset.
const ACTIVITY_TO_FILE: Record<string, string> = {
  'Reading Summary': '09_reading_summary.pdf',
  'Summary Notes': '01_summary_notes.pdf',
  'Review Sheet': '01_summary_notes.pdf',
  'Fiche de révision': '01_summary_notes.pdf',
  'Synthesis Sheet': '02_synthesis.pdf',
  'Synthesis': '02_synthesis.pdf',
  'Fiche de synthèse': '02_synthesis.pdf',
  'LOS Sheet': '03_los_sheet.pdf',
  'Exam Traps': '04_exam_traps.pdf',
  'Concept by Concept': '05_concept_on_concept.pdf',
  'Decision Tree': '06_decision_tree.pdf',
  'Essential Sheet': '07_essential_sheet.pdf',
  'Formula Sheet': '08_formula_sheet.pdf',
  'TDS Sheet': '10_tds_sheet.pdf',
  'Blank Recall': '11_blank_recall.pdf',
  'Flashcards': '12_flashcards.json',
  'Mock Pack': '13_mock_pack.pdf',
  'Targeted QBank': '13_mock_pack.pdf',
  'QBank 20q': '13_mock_pack.pdf',
  'Audio Script': '14_audio_script.md',
  'Audio Synthesis': '14_audio_synthesis.mp3',
  'Audio': '14_audio_synthesis.mp3',
  'Knowledge Audit': '15_knowledge_audit.pdf',
  'Weakness Pool': '16_weakness_pool.pdf',
  'Learning Map': '17_learning_map.svg',
}

// Normalize an LM code from Planning Skill format ("ETH-01", "FI-02") to
// the filesystem folder format ("LM01", "LM02").
function normalizeLmCode(raw: string | undefined): string | null {
  if (!raw) return null
  const parts = raw.split('-')
  if (parts.length < 2) return null
  const num = parts[1].padStart(2, '0')
  return `LM${num}`
}

export default function Home() {
  const router = useRouter()
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [energy, setEnergy] = useState<Energy>('high')
  const [time, setTime] = useState(60)
  const [session, setSession] = useState<SessionData | null>(null)
  const [customTopics, setCustomTopics] = useState<Set<string>>(new Set())
  const [customMode, setCustomMode] = useState<string | null>(null)
  const [planning, setPlanning] = useState<PlanningState | null>(null)
  const [planningLoading, setPlanningLoading] = useState(true)
  const [eosOpen, setEosOpen] = useState(false)
  const [doneBlocks, setDoneBlocks] = useState<Set<string>>(new Set())
  const [contentModal, setContentModal] = useState<{ url: string; title: string; filename: string; blockOrder?: number } | null>(null)
  // Error Debrief — minimal v1. Saving auto-marks the block done.
  // Schema B/C upgrade is tracked in memory/project_error_debrief_manifest.md
  const [errorDebriefModal, setErrorDebriefModal] = useState<{
    block: PlanningTodayBlock
    previousActivity?: string  // the task being debriefed (block N-1)
    notes: string
  } | null>(null)
  const [pomodoroActive, setPomodoroActive] = useState(false)
  const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'break'>('work')
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState(25 * 60)
  // Study-session persistence: track the DB session id and start time so the
  // pomodoro stop button can call /api/v1/session/stop and emit a debrief
  // entry that Journey can pick up.
  const [studySessionId, setStudySessionId] = useState<number | null>(null)
  const [studyStartedMs, setStudyStartedMs] = useState<number | null>(null)
  const [studyContext, setStudyContext] = useState<{ topic: string; lm?: string; activity?: string } | null>(null)
  const [lmProgress, setLmProgress] = useState<Record<string, number>>({})
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)

  // Backend peer benchmarks (replaces the local hardcoded `PEER_AVG`).
  const [peerStats, setPeerStats] = useState<Record<string, number>>({})
  useEffect(() => {
    fetch(`${API}/api/kpis/peer-stats`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.peers) setPeerStats(d.peers) })
      .catch(() => {})
  }, [])

  // Next-7-days outlook for the Planning section (folded from former /planning page).
  const [outlook, setOutlook] = useState<OutlookDay[]>([])

  useEffect(() => {
    fetch(`${API}/api/plan/month-outlook?days=7`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.outlook) setOutlook(d.outlook) })
      .catch(() => {})
  }, [])

  // Done state is keyed by (date + block.order) and persisted in localStorage.
  // Resets automatically when the date rolls over or the plan is regenerated.
  const doneStorageKey = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return `wingman_done_blocks_${today}`
  }, [])

  const fetchPlanning = useCallback((refresh = false, minutesOverride?: number) => {
    setPlanningLoading(true)
    // use_cache=true → fast (cached result if MATRIX_VERSION unchanged).
    // refresh=true forces a fresh LLM call.
    // minutes_override → ask Claude to fit blocks inside N min (dashboard time selector).
    const params = new URLSearchParams()
    if (refresh) params.set('refresh', 'true')
    else params.set('use_cache', 'true')
    if (minutesOverride && minutesOverride > 0) params.set('minutes_override', String(minutesOverride))
    fetch(`${API}/api/plan/state?${params.toString()}`, { credentials: 'include' })
      .then(r => r.json())
      .then((d: PlanningState) => { if (!d.error) setPlanning(d) })
      .catch(() => {})
      .finally(() => setPlanningLoading(false))
  }, [])

  const openBlockContent = useCallback((block: PlanningTodayBlock) => {
    if (block.activity === 'Error Debrief') {
      const blocks = planning?.today_blocks || []
      const idx = blocks.findIndex(b => b.order === block.order)
      const prev = idx > 0 ? blocks[idx - 1] : undefined
      setErrorDebriefModal({
        block,
        previousActivity: prev?.activity,
        notes: '',
      })
      return
    }
    const lmCode = normalizeLmCode(block.lm_code)
    const filename = ACTIVITY_TO_FILE[block.activity]
    if (!lmCode || !filename) {
      alert(`No content available for "${block.activity}".`)
      return
    }
    // Use same-origin proxy (/proxy-api/*) to avoid cross-origin iframe blocking
    // in Edge/Chrome for PDFs. The rewrite in next.config.js forwards to the backend.
    const url = `/proxy-api/content/generated/${block.topic_code}/${lmCode}/${filename}`
    setContentModal({ url, title: `${block.topic_code} ${block.lm_code} — ${block.activity}`, filename, blockOrder: block.order })
  }, [])

  // Start Session = open the first un-done block's content. If all blocks are
  // done, regenerate a fresh plan (Planning Skill skips completed work).
  const startFirstUndoneBlock = useCallback(async () => {
    const blocks = planning?.today_blocks || []
    const firstUndone = blocks.find(b => !doneBlocks.has(String(b.order)))
    if (!firstUndone) {
      try { localStorage.removeItem(doneStorageKey) } catch {}
      setDoneBlocks(new Set())
      fetchPlanning(true, time)
      return
    }
    openBlockContent(firstUndone)
    setPomodoroActive(true)
    // Persist a 'study' session in the DB so it shows up in Journey.
    // Best-effort — never block the UI on this.
    try {
      const moduleCode = firstUndone.lm_code
        ? `${firstUndone.topic_code}/${firstUndone.lm_code}`
        : firstUndone.topic_code
      const res = await fetch(`${API}/api/v1/session/start`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_type: 'study', module_code: moduleCode }),
      })
      const data = await res.json()
      if (data?.session_id) {
        setStudySessionId(data.session_id)
        setStudyStartedMs(Date.now())
        setStudyContext({
          topic: firstUndone.topic_code,
          lm: firstUndone.lm_code || undefined,
          activity: firstUndone.activity,
        })
      }
    } catch { /* non-blocking */ }
  }, [planning, doneBlocks, doneStorageKey, fetchPlanning, time, openBlockContent])

  // ── Pomodoro tick (25/5 cycle) ──
  useEffect(() => {
    if (!pomodoroActive) return
    const tick = setInterval(() => {
      setPomodoroSecondsLeft(s => {
        if (s > 1) return s - 1
        setPomodoroPhase(p => (p === 'work' ? 'break' : 'work'))
        return pomodoroPhase === 'work' ? 5 * 60 : 25 * 60
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [pomodoroActive, pomodoroPhase])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(doneStorageKey)
      if (raw) setDoneBlocks(new Set(JSON.parse(raw)))
    } catch {}
  }, [doneStorageKey])

  const toggleBlockDone = useCallback((order: number) => {
    setDoneBlocks(prev => {
      const next = new Set(prev)
      const key = String(order)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      try { localStorage.setItem(doneStorageKey, JSON.stringify([...next])) } catch {}
      return next
    })
  }, [doneStorageKey])

  // Error Debrief save — minimal v1. Persists the note then auto-marks the
  // block done so the user doesn't have to click Done separately.
  // `advance=true` chains to the next un-done block of today's plan instead
  // of just closing — keeps the review flow one-click.
  const saveErrorDebrief = useCallback((advance: boolean = false) => {
    if (!errorDebriefModal) return
    const m = errorDebriefModal
    const trimmed = m.notes.trim()
    if (!trimmed) return
    const nowMs = Date.now()
    const entry = {
      id: `err_${nowMs}`,
      ts: new Date(nowMs).toISOString(),
      source: 'session' as const,
      context: {
        topic: m.block.topic_code,
        lm: m.block.lm_code,
      },
      task: m.previousActivity,
      notes: trimmed,
      block_order: m.block.order,
      review: {
        status: 'open' as const,
        consecutive_successes: 0,
        retake_step: 1 as const,
        next_retake_date: new Date(nowMs + 3 * 24 * 60 * 60 * 1000).toISOString(),
        history: [] as Array<{ ts: string; result: 'pass' | 'fail' }>,
      },
    }
    try {
      const raw = localStorage.getItem('wingman_error_log')
      const log: unknown[] = raw ? JSON.parse(raw) : []
      log.unshift(entry)
      localStorage.setItem('wingman_error_log', JSON.stringify(log.slice(0, 200)))
    } catch { /* ignore */ }
    if (!doneBlocks.has(String(m.block.order))) {
      toggleBlockDone(m.block.order)
    }
    if (advance) {
      const blocks = planning?.today_blocks || []
      const currentIdx = blocks.findIndex(b => b.order === m.block.order)
      const next = blocks.slice(currentIdx + 1).find(b => !doneBlocks.has(String(b.order)))
      setErrorDebriefModal(null)
      if (next) {
        // Defer one tick so the modal close fully unmounts before the new one
        // opens — avoids a flash where both render briefly.
        setTimeout(() => {
          setErrorDebriefModal({ block: next, previousActivity: next.activity, notes: '' })
        }, 50)
      }
    } else {
      setErrorDebriefModal(null)
    }
  }, [errorDebriefModal, doneBlocks, toggleBlockDone, planning])

  // When a block is marked Done while its content modal is open, auto-advance:
  // close the modal and open the next un-done block. Keeps the flow one-click.
  const markDoneAndAdvance = useCallback((order: number) => {
    setDoneBlocks(prev => {
      const next = new Set(prev)
      next.add(String(order))
      try { localStorage.setItem(doneStorageKey, JSON.stringify([...next])) } catch {}
      return next
    })
    // Defer to let state settle, then find next un-done block.
    setTimeout(() => {
      const blocks = planning?.today_blocks || []
      const currentIdx = blocks.findIndex(b => b.order === order)
      const next = blocks.slice(currentIdx + 1).find(b => !doneBlocks.has(String(b.order)))
      if (next) openBlockContent(next)
      else setContentModal(null)
    }, 50)
  }, [doneStorageKey, planning, doneBlocks, openBlockContent])

  useEffect(() => {
    // Initial paint from localStorage (snappy), then immediately overwrite
    // with the backend's per-user truth — so a freshly-logged-in user can't
    // see the previous user's progress numbers.
    setProgress(getProgress())
    setLmProgress(getLmProgress())
    fetchTopicMastery().then(realProgress => {
      // Only overwrite if backend returned data; an empty {} (cold load
      // before user_id is known) shouldn't clobber whatever localStorage had.
      if (Object.keys(realProgress).length > 0) {
        setProgress(realProgress)
        try { localStorage.setItem('wingman_topic_progress', JSON.stringify(realProgress)) } catch {}
      }
    })
    // Hydrate per-LM mastery from backend (source of truth). The legacy
    // wingman_lm_progress was only ever populated by a one-shot migration
    // that mapped each topic % to its LM01 — so counters got stuck at 0/N
    // or 1/N regardless of real session activity, and the % column ended up
    // disconnected from the X/Y count.
    fetch(`${API}/api/progress/heatmap`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(rows => {
        if (!Array.isArray(rows)) return
        const next: Record<string, number> = {}
        for (const row of rows) {
          if (!row?.lm_code || !row?.topic) continue
          if ((row.attempts ?? 0) <= 0) continue
          // Backend codes look like "ETH-01"; frontend keys use "ETH/LM01".
          const m = String(row.lm_code).match(/-(\d+)$/)
          const lmKey = m ? `LM${m[1].padStart(2, '0')}` : String(row.lm_code)
          const pct = Number(row.mastery_level) || 0
          if (pct <= 0) continue
          next[`${row.topic}/${lmKey}`] = Math.round(pct * 10) / 10
        }
        setLmProgress(next)
        try { localStorage.setItem('wingman_lm_progress', JSON.stringify(next)) } catch {}
      })
      .catch(() => {})
    const s = generateSession('high', 60)
    setSession(s)
    syncSessionTopic(s)
    fetchPlanning(false)
  }, [fetchPlanning])

  const syncSessionTopic = (s: SessionData) => {
    const topic = s.lms[0]?.badge.split(' ')[0] || ''
    const lmCode = s.lms[0]?.badge.replace(' ', '/') || ''
    if (topic) localStorage.setItem('wingman_current_session_topic', topic)
    if (lmCode) localStorage.setItem('wingman_current_session_lm', lmCode)
  }

  const handleRegenerate = useCallback((e: Energy, t: number) => {
    setEnergy(e); setTime(t)
    const s = generateSession(e, t)
    setSession(s); syncSessionTopic(s)
    // Also re-generate the Planning-Skill plan so today's blocks fit the new time budget.
    fetchPlanning(true, t)
  }, [fetchPlanning])

  const toggleCustomTopic = useCallback((code: string) => {
    setCustomTopics(prev => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n })
  }, [])

  const handleBuildCustom = useCallback(() => {
    if (customTopics.size === 0 || !customMode) return
    const eMap: Record<string, Energy> = { discovery: 'high', reinforce: 'mid', eval: 'high', audio: 'low', flashcards: 'low' }
    setSession(generateSession(eMap[customMode] || 'mid', time))
  }, [customTopics, customMode, time])

  const threshold = 70
  const topicMastery = useMemo(() => {
    return TOPIC_ORDER.map(t => {
      const lmsForTopic = LM_DATA.filter(([topic]) => topic === t)
      const totalLms = lmsForTopic.length
      const lmScores = lmsForTopic.map(([topic, lm, title]) => ({
        lm, title, pct: lmProgress[`${topic}/${lm}`] ?? 0,
      }))
      const attemptedLms = lmScores.filter(l => l.pct > 0).length
      // Topic pct: mean of LM scores (so 1/5 LMs at 70% → 14%, not 70%).
      // Falls back to legacy topic-level progress if no LM data yet.
      const sumPct = lmScores.reduce((s, l) => s + l.pct, 0)
      const fromLms = totalLms > 0 ? sumPct / totalLms : 0
      const pct = attemptedLms > 0 ? Math.round(fromLms * 10) / 10 : (progress[t] ?? 0)
      return {
        topic: t,
        name: TOPICS[t],
        pct,
        color: TOPIC_COLORS[t],
        weight: TOPIC_WEIGHTS[t] ?? 5,
        totalLms,
        attemptedLms,
        lmScores,
      }
    }).sort((a, b) => a.pct - b.pct)
  }, [progress, lmProgress])

  // IN SESSION = topics with an OPEN backend session right now (sessions.ended_at IS NULL,
  // narrowed to topics that have at least one answered question via performance_records).
  // The matrix-proposed `session` is just a recommendation panel and was misleading
  // here — a "PLANNED" topic would light up even though no real session was running.
  const [sessionTopics, setSessionTopics] = useState<Set<string>>(new Set())
  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      try {
        const r = await fetch(`${API}/api/progress/active-topics`, { credentials: 'include' })
        if (!r.ok) return
        const data = await r.json()
        if (cancelled || !Array.isArray(data?.topics)) return
        setSessionTopics(prev => {
          const next = new Set<string>(data.topics)
          if (prev.size === next.size && [...prev].every(t => next.has(t))) return prev
          return next
        })
      } catch {}
    }
    refresh()
    const id = setInterval(refresh, 30_000)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => { cancelled = true; clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [])

  return (
    <div className="overflow-y-auto h-[calc(100vh-48px)]">
      <div className="w-full px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-5">

        {/* ═══ BACKUP PLAN BANNER — AI unavailable, showing last snapshot ═══ */}
        {planning?.source === 'backup' && (
          <div className="rounded-xl bg-amber-500/[0.1] border border-amber-500/30 px-4 py-3 flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-[12px] font-bold text-amber-400 uppercase tracking-wider">Backup plan · AI unavailable</p>
              <p className="text-[12px] text-slate-300 mt-1">
                Showing the last successful plan
                {planning._snapshot_generated_at && (
                  <> generated on {new Date(planning._snapshot_generated_at).toLocaleString()}</>
                )}
                . The AI will regenerate a fresh plan automatically once the service is back.
              </p>
              {planning._fallback_reason && (
                <p className="text-[10px] text-slate-500 mt-1 font-mono truncate" title={planning._fallback_reason}>
                  {planning._fallback_reason}
                </p>
              )}
            </div>
            <button onClick={() => fetchPlanning(true, time)}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline shrink-0">
              Retry
            </button>
          </div>
        )}

        {/* ═══ REMEDIATION BANNER (Rule 11) ═══ */}
        {planning?.rationale?.toLowerCase().includes('remediation injected') && (
          <div className="rounded-xl bg-red-500/[0.08] border border-red-500/30 px-4 py-3 flex items-start gap-3">
            <span className="text-lg">🔴</span>
            <div className="flex-1">
              <p className="text-[12px] font-bold text-red-400 uppercase tracking-wider">Remediation injected · Rule 11</p>
              <p className="text-[12px] text-slate-300 mt-1">
                Weaknesses from recent End-of-Session checklists are targeted in today&apos;s plan.
              </p>
            </div>
          </div>
        )}

        {/* ═══ HERO — single column, no gradient. Session plan stacks below. ═══ */}
        <section className="relative rounded-2xl p-4 md:p-6 bg-white/[0.02] border border-white/[0.06]">
          <div className="grid grid-cols-1 gap-6 md:gap-8 relative z-10">
            {/* Left — Session info + rich KPIs */}
            <div>
              {/* Picker — energy + time, grouped with section labels for clarity */}
              <div className="flex flex-wrap items-end gap-3 md:gap-5 mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">Energy</span>
                  <div className="flex items-center gap-1">
                    {([['high', '⚡', 'High'], ['mid', '🟡', 'Mid'], ['low', '🌙', 'Low']] as [Energy, string, string][]).map(([e, icon, label]) => (
                      <button key={e} onClick={() => handleRegenerate(e, time)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 border ${
                          energy === e
                            ? 'bg-blue-500/[0.14] border-blue-400/30 text-blue-300'
                            : 'bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'
                        }`}>
                        <span>{icon}</span><span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">Time</span>
                  <div className="flex items-center gap-1">
                    {[60, 120, 180, 240, 300].map(minutes => (
                      <button key={minutes} onClick={() => handleRegenerate(energy, minutes)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold tabular-nums transition-all border ${
                          time === minutes
                            ? 'bg-emerald-500/[0.10] border-emerald-400/30 text-emerald-300'
                            : 'bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'
                        }`}>
                        {minutes / 60}H
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Title — prefer planning skill */}
              {(() => {
                const planningTitle = planning && planning.today_blocks.length > 0
                  ? (() => {
                      const topics = Array.from(new Set(planning.today_blocks.map(b => b.topic_code)))
                      const lms = Array.from(new Set(planning.today_blocks.map(b => b.lm_code).filter(Boolean))) as string[]
                      if (lms.length === 1) return `${topics[0]} · ${lms[0]}`
                      if (topics.length === 1) return `${topics[0]} · ${planning.today_blocks.length} blocks`
                      return topics.slice(0, 2).join(' + ')
                    })()
                  : null
                return (
                  <h2 className="text-[1.8rem] font-extrabold text-white leading-tight mb-1.5">
                    {planningTitle || (planningLoading ? 'Generating your session…' : 'No plan yet — click Refresh')}
                  </h2>
                )
              })()}

              {planning && planning.today_blocks.length > 0 && (() => {
                const topicCode = planning.today_blocks[0].topic_code
                const intro = TOPIC_INTROS[topicCode] || ''
                const diff = TOPIC_DIFFICULTY[topicCode]
                const weightRange = EXAM_WEIGHT_RANGES[topicCode] || '—'
                const mastery = progress[topicCode] ?? 0
                const gap = 100 - mastery
                const lmCount = LM_DATA.filter(([t]) => t === topicCode).length
                const estimatedGain = Math.min(15, Math.round(gap * 0.12 * (time / 60)))

                return (
                  <>
                    <p className="text-[12px] text-slate-400 leading-relaxed mb-4 max-w-[55ch]">{intro}</p>

                    {/* FIX 4: KPI grid with session type */}
                    {(() => {
                      // Source-of-truth peer benchmark — use backend stats if loaded,
                      // otherwise fall back to the legacy local map (used to be
                      // hardcoded mock; now there's just a 1-frame flicker on cold load).
                      // Topic snapshot — 1 primary card (Mastery) + 5 secondary
                      // on a sub-grid. Single help tooltip at the strip header
                      // instead of one `?` per card to drop visual noise.
                      const peer = peerStats[topicCode] ?? PEER_AVG[topicCode] ?? 55
                      return (
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Topic snapshot</span>
                        <HelpTooltip title="Topic snapshot">
                          <div className="space-y-1.5">
                            <p><b>Mastery</b> · pondération QBank par poids d&apos;examen, source <span className="font-mono text-slate-500">/api/kpis/topic-mastery</span>.</p>
                            <p><b>Exam weight</b> · plage officielle CFA Institute (L1).</p>
                            <p><b>Difficulty</b> · classement subjectif Easy/Medium/Hard (pass-rates historiques).</p>
                            <p><b>Session</b> · activité du premier bloc planifié aujourd&apos;hui.</p>
                            <p><b>Est. ROI</b> · gain mastery attendu sur <span className="font-mono text-blue-400">{time} min</span>, formule <span className="font-mono text-slate-500">min(15, gap × 0.12 × time/60)</span>.</p>
                            <p><b>Peer avg</b> · mastery moyen des candidats CFA L1 sur ce topic.</p>
                          </div>
                        </HelpTooltip>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                        {/* Primary: Mastery — spans 2 cols on desktop */}
                        <div className="lg:col-span-2 rounded-xl p-3 bg-white/[0.04] border border-white/[0.06]">
                          <div className="text-[10px] text-slate-500 uppercase tracking-[0.12em] font-semibold">Mastery</div>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="text-[28px] font-black tabular-nums leading-none" style={{ color: mastery >= 70 ? '#22c55e' : mastery >= 40 ? '#f59e0b' : '#ef4444' }}>{mastery}</span>
                            <span className="text-[12px] font-bold text-slate-500">%</span>
                            {peer != null && (
                              <span className="text-[10px] ml-auto self-center font-semibold" style={{ color: mastery > peer ? '#22c55e' : '#94a3b8' }}>
                                {mastery > peer ? `+${Math.round(mastery - peer)}` : `−${Math.round(peer - mastery)}`} vs peers
                              </span>
                            )}
                          </div>
                          <div className="h-1 rounded-full mt-2 overflow-hidden bg-white/[0.06]">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${mastery}%`, background: mastery >= 70 ? '#22c55e' : mastery >= 40 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                        </div>
                        {/* Secondaries — same shape, smaller numbers */}
                        <div className="rounded-xl p-2.5 bg-white/[0.04] border border-white/[0.06]">
                          <div className="text-[9px] text-slate-500 uppercase tracking-[0.1em] font-semibold">Weight</div>
                          <div className="text-[14px] font-extrabold text-white mt-1 leading-none">{weightRange}</div>
                          <div className="text-[9px] text-slate-500 mt-1">of exam</div>
                        </div>
                        <div className="rounded-xl p-2.5 bg-white/[0.04] border border-white/[0.06]">
                          <div className="text-[9px] text-slate-500 uppercase tracking-[0.1em] font-semibold">Difficulty</div>
                          <div className="text-[14px] font-extrabold mt-1 leading-none" style={{ color: diff?.color || '#f59e0b' }}>{diff?.level || 'Medium'}</div>
                          <div className="text-[9px] text-slate-500 mt-1">{lmCount} modules</div>
                        </div>
                        <div className="rounded-xl p-2.5 bg-white/[0.04] border border-white/[0.06]">
                          <div className="text-[9px] text-slate-500 uppercase tracking-[0.1em] font-semibold">Est. ROI</div>
                          <div className="text-[14px] font-extrabold mt-1 leading-none" style={{ color: '#00e0b8' }}>+{estimatedGain}%</div>
                          <div className="text-[9px] text-slate-500 mt-1">{time} min session</div>
                        </div>
                        <div className="rounded-xl p-2.5 bg-white/[0.04] border border-white/[0.06]">
                          <div className="text-[9px] text-slate-500 uppercase tracking-[0.1em] font-semibold">Session</div>
                          <div className="text-[12px] font-extrabold mt-1 leading-tight truncate" style={{ color: '#a0b4ff' }} title={planning.today_blocks[0].activity}>{planning.today_blocks[0].activity}</div>
                          <div className="text-[9px] text-slate-500 mt-1">{planning.today_blocks.reduce((s, b) => s + b.minutes, 0)} min total</div>
                        </div>
                      </div>
                    </div>
                      )
                    })()}

                    {/* AI Coach tip — coaching reminders (Rule 10/11/12/14 etc.), distinct from "Why this session" */}
                    {planning.coaching_reminders && planning.coaching_reminders.length > 0 && (
                      <div className="rounded-[12px] p-4 mb-3" style={{ background: 'rgba(0,224,184,.04)', border: '1px solid rgba(0,224,184,.1)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[14px]">🤖</span>
                          <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#00e0b8' }}>AI Coach Insight</span>
                        </div>
                        <ul className="space-y-1.5">
                          {planning.coaching_reminders.map((tip, i) => (
                            <li key={i} className="text-[13px] text-slate-200 leading-relaxed flex gap-2">
                              <span className="shrink-0 mt-[2px]" style={{ color: '#00e0b8' }}>•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )
              })()}

              {/* CTA */}
              <div className="flex flex-wrap gap-3">
                <button onClick={startFirstUndoneBlock}
                  className="px-5 py-3 rounded-xl text-[14px] font-bold text-white transition-all hover:brightness-110"
                  style={{ background: '#6c8cff' }}>
                  Start Session
                </button>
                <button onClick={() => setEosOpen(true)}
                  className="px-5 py-3 rounded-xl text-[14px] font-bold text-white transition-all hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  style={{ background: '#10b981' }}>
                  End of Session
                </button>
                <button onClick={() => router.push('/library')}
                  className="px-5 py-3 rounded-xl text-[14px] font-semibold transition-all hover:bg-white/[0.06]"
                  style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', color: '#f5f7ff' }}>
                  Review Weak Topics
                </button>
              </div>
            </div>

            {/* Right — Today's session card (Planning Skill driven) */}
            <div
              className="rounded-[18px] p-5"
              style={{
                background: planning?._coach_override ? 'rgba(108,140,255,.06)' : 'rgba(9,14,28,.55)',
                border: planning?._coach_override ? '1px solid rgba(108,140,255,.35)' : '1px solid rgba(255,255,255,.06)',
              }}
            >
              {/* Coach takeover banner */}
              {planning?._coach_override && (
                <div className="flex items-center justify-between gap-2 mb-3 -mt-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(108,140,255,.15)', border: '1px solid rgba(108,140,255,.5)', color: '#a0b4ff' }}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#6c8cff', boxShadow: '0 0 6px #6c8cff' }} />
                    Coach plan active
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await fetch(`${API}/api/plan/drop-coach`, { method: 'POST', credentials: 'include' })
                      } catch { /* non-blocking */ }
                      fetchPlanning(true, time)
                    }}
                    className="text-[10px] font-semibold text-slate-400 hover:text-slate-200 hover:underline"
                    title="Drop the coach proposal and regenerate the normal plan"
                  >
                    Reset to normal plan →
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-baseline gap-2">
                  <div className="text-[11px] font-bold uppercase tracking-[.08em]" style={{ color: '#00e0b8' }}>
                    Today&apos;s Session Plan
                  </div>
                  {planning && planning.today_blocks.length > 0 && (() => {
                    const total = planning.today_blocks.reduce((s, b) => s + b.minutes, 0)
                    return (
                      <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                        · {total} min total ({planning.today_blocks.length} blocks)
                      </span>
                    )
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  {planningLoading && (
                    <span className="text-[9px] font-semibold text-amber-400 animate-pulse">
                      ⟳ Generating…
                    </span>
                  )}
                  {!planningLoading && planning && (
                    <button onClick={() => fetchPlanning(true, time)}
                      className="text-[9px] font-semibold text-blue-400 hover:text-blue-300 hover:underline">
                      Refresh
                    </button>
                  )}
                  {planning?.tutor_tone && (
                    <span
                      title={`Tutor tone: ${planning.tutor_tone}`}
                      className={`hidden xl:inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded ${
                        planning.tutor_tone === 'harsh' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/15 text-blue-400'
                      }`}>
                      {planning.tutor_tone === 'harsh' ? '🔥 harsh' : '💙 kind'}
                    </span>
                  )}
                </div>
              </div>

              {/* Planning-skill-driven blocks */}
              {planning && planning.today_blocks.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {planning.today_blocks.map(b => {
                    const isDone = doneBlocks.has(String(b.order))
                    return (
                      <div key={b.order}
                        className="flex items-center gap-2.5 p-2.5 rounded-[14px] transition-all"
                        style={{
                          background: isDone ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,.04)',
                          border: `1px solid ${isDone ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,.06)'}`,
                        }}>
                        <span className="w-5 text-[10px] font-bold text-slate-600 text-right tabular-nums">{b.order}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white shrink-0"
                          style={{ background: TOPIC_COLORS[b.topic_code] || '#6366f1' }}>{b.topic_code}</span>
                        {b.lm_code && <span className="text-[9px] font-mono text-slate-500 shrink-0">{b.lm_code}</span>}
                        {(() => {
                          const hasFile = !!ACTIVITY_TO_FILE[b.activity]
                          const isErrorDebrief = b.activity === 'Error Debrief'
                          const clickable = hasFile || isErrorDebrief
                          const title = hasFile
                            ? 'Open content'
                            : isErrorDebrief
                              ? 'Open error debrief'
                              : 'No content available for this activity'
                          return (
                            <button onClick={() => openBlockContent(b)}
                              title={title}
                              className={`text-[12px] flex-1 min-w-0 truncate text-left transition-colors ${
                                isDone ? 'text-slate-500 line-through' : 'text-white hover:text-blue-300'
                              } ${clickable ? 'hover:underline cursor-pointer' : 'cursor-not-allowed opacity-70'}`}>
                              {b.activity}
                            </button>
                          )
                        })()}
                        <span className="text-[10px] text-slate-400 tabular-nums shrink-0">{b.minutes}m</span>
                        <span className="text-[8px] text-slate-600 shrink-0" title={`Driven by Rule ${b.rationale_rule}`}>R{b.rationale_rule}</span>
                        <button
                          onClick={() => toggleBlockDone(b.order)}
                          title={isDone ? 'Mark as not done' : 'Mark as done'}
                          className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 transition-all ${
                            isDone
                              ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                              : 'bg-white/[0.06] text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/[0.08]'
                          }`}>
                          {isDone ? '✓ Done' : 'Done'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="mb-4 p-8 rounded-[14px] flex flex-col items-center justify-center gap-3"
                     style={{ background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.08)' }}>
                  <svg className="w-6 h-6 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <div className="text-[12px] font-semibold text-amber-400">Generating your plan…</div>
                  <div className="text-[10px] text-slate-500 text-center max-w-xs leading-relaxed">
                    Claude is applying the 14 planning rules to your profile. This takes ~10 seconds on a fresh generation.
                  </div>
                </div>
              )}

              {/* Why — planning rationale only */}
              {planning?.rationale && (
                <div className="p-3 rounded-[12px]" style={{ background: 'rgba(108,140,255,.06)', border: '1px solid rgba(108,140,255,.1)' }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6c8cff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <span className="text-[10px] font-bold" style={{ color: '#a0b4ff' }}>Why this session</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{planning.rationale}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══ PLANNING (folded from former /planning page) ═══ */}
        <section className="rounded-[18px] p-5" style={{ background: 'rgba(9,14,28,.55)', border: '1px solid rgba(255,255,255,.06)' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(108,140,255,.10)', border: '1px solid rgba(108,140,255,.4)', color: '#a0b4ff' }}>
                Planning
              </span>
              {planning && (
                <span className="text-[10px] text-slate-500">
                  {planning.today_blocks.length} blocks · {planning.today_blocks.reduce((s, b) => s + b.minutes, 0)} min · {outlook.length}-day outlook
                </span>
              )}
            </div>
            <button
              onClick={() => fetchPlanning(true, time)}
              className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 hover:underline"
              disabled={planningLoading}
            >
              {planningLoading ? '⟳ Generating…' : 'Refresh'}
            </button>
          </div>

          {/* Next 7 days outlook */}
          {outlook.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Next 7 days</span>
                <span className="text-[10px] text-slate-500">
                  {outlook.reduce((s, d) => s + (d.is_rest_day ? 0 : d.total_minutes), 0)} min total · {outlook.filter(d => d.includes_mock).length} mocks
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {outlook.map(d => {
                  const isToday = d.day_offset === 0
                  return (
                    <div key={d.day_offset}
                         className="rounded-[10px] p-2.5 min-w-0"
                         style={{
                           background: isToday ? 'rgba(108,140,255,.10)' : 'rgba(255,255,255,.02)',
                           border: `1px solid ${isToday ? 'rgba(108,140,255,.35)' : 'rgba(255,255,255,.06)'}`,
                         }}>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500">
                          {isToday ? 'Today' : `+${d.day_offset}d`}
                        </span>
                        <span className="text-[9px] text-slate-600">{d.weekday}</span>
                      </div>
                      <div className="text-[15px] font-extrabold tabular-nums text-white">
                        {d.is_rest_day ? '—' : `${d.total_minutes}m`}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5 min-h-[16px]">
                        {d.focus_topic_codes.slice(0, 3).map(tc => (
                          <span key={tc} className="text-[9px] font-bold px-1 py-0.5 rounded text-white"
                                style={{ background: TOPIC_COLORS[tc] || '#6366f1' }}>
                            {tc}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 text-[8px] text-slate-600">
                        {d.includes_srs && <span title="SRS scheduled">●</span>}
                        {d.includes_mock && <span title="Mock exam" className="text-red-400">M</span>}
                        {d.is_rest_day && <span className="text-emerald-400">REST</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* ═══ PROGRESS FOCUS (multi-column, full width) ═══ */}
        <section className="rounded-[18px] p-5" style={{ background: '#10182d', border: '1px solid rgba(255,255,255,.06)' }}>
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
            <div>
              <h3 className="text-[16px] font-bold text-white">Progress Focus</h3>
              <p className="text-[12px] text-slate-500">Priority topics sorted by weakness.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-2">
            {topicMastery.map(t => {
                const statusColor = t.pct >= threshold ? '#22c55e' : t.pct >= 55 ? '#f59e0b' : '#ef4444'
                const statusLabel = t.pct >= threshold ? 'On Track' : t.pct >= 55 ? 'Near' : 'Critical'
                const peer = PEER_AVG[t.topic] || 55
                const inSession = sessionTopics.has(t.topic)
                const isExpanded = expandedTopic === t.topic
                const coverageColor = t.attemptedLms === 0 ? '#64748b'
                  : t.attemptedLms < t.totalLms ? '#f59e0b'
                  : '#22c55e'
                return (
                  <div key={t.topic}
                    className="rounded-[12px] p-2.5 transition-all hover:bg-white/[0.02]"
                    style={{ border: inSession ? '1px solid rgba(108,140,255,.25)' : '1px solid transparent', background: inSession ? 'rgba(108,140,255,.04)' : 'transparent' }}>
                    <div className="flex items-center justify-between gap-2 mb-1.5 cursor-pointer"
                         onClick={() => setExpandedTopic(isExpanded ? null : t.topic)}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] text-slate-500 w-3 shrink-0">{isExpanded ? '▾' : '▸'}</span>
                        <span className="text-[9px] font-bold w-9 text-center py-0.5 rounded text-white shrink-0" style={{ background: t.color }}>{t.topic}</span>
                        <span className="text-[12px] text-white font-medium truncate">{t.name}</span>
                        {inSession && <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0" style={{ background: 'rgba(108,140,255,.14)', color: '#a0b4ff' }}>IN SESSION</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded whitespace-nowrap"
                              title={`${t.attemptedLms} of ${t.totalLms} LMs attempted`}
                              style={{ background: `${coverageColor}15`, color: coverageColor }}>
                          {t.attemptedLms}/{t.totalLms}
                        </span>
                        <span className="text-[9px] text-slate-500 tabular-nums whitespace-nowrap">{EXAM_WEIGHT_RANGES[t.topic]}</span>
                        <span className="text-[12px] font-bold tabular-nums w-12 text-right whitespace-nowrap" style={{ color: statusColor }}>{t.pct}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-[6px] rounded-full overflow-hidden bg-white/[0.05]">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(t.pct, 0)}%`, background: statusColor, minWidth: t.pct > 0 ? '4px' : 0 }} />
                      </div>
                      <span className="text-[8px] text-slate-600 tabular-nums whitespace-nowrap shrink-0">{peer}% peer</span>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-1">
                        {t.lmScores.map(lm => {
                          const lmColor = lm.pct === 0 ? '#475569'
                            : lm.pct >= threshold ? '#22c55e'
                            : lm.pct >= 55 ? '#f59e0b'
                            : '#ef4444'
                          return (
                            <button key={lm.lm}
                              onClick={(e) => { e.stopPropagation(); router.push(`/library?topic=${t.topic}&lm=${lm.lm}`) }}
                              className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md hover:bg-white/[0.03] transition-colors">
                              <span className="text-[10px] font-mono text-slate-500 w-12 shrink-0">{lm.lm}</span>
                              <span className="text-[11px] text-slate-300 flex-1 min-w-0 truncate">{lm.title}</span>
                              <div className="w-24 h-[4px] rounded-full overflow-hidden shrink-0" style={{ background: '#0a1020' }}>
                                <div className="h-full rounded-full" style={{ width: `${lm.pct}%`, background: lmColor }} />
                              </div>
                              <span className="text-[10px] font-bold tabular-nums w-10 text-right shrink-0" style={{ color: lmColor }}>
                                {lm.pct > 0 ? `${lm.pct}%` : '—'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </section>

        {/* ═══ QUICK ACCESS ═══ */}
        <section className="rounded-[18px] p-5" style={{ background: '#10182d', border: '1px solid rgba(255,255,255,.06)' }}>
          <h3 className="text-[16px] font-bold text-white mb-1.5">Quick Access</h3>
          <p className="text-[12px] text-slate-500 mb-4">Jump to key features.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'QBank', desc: 'Targeted timed questions', href: '/session' },
              { label: 'Flashcards', desc: 'Active recall & memory anchoring', href: '/session' },
              { label: 'Mock Exams', desc: 'Full simulation & score tracking', href: '/session' },
              { label: 'Review Errors', desc: 'Fix recurring weaknesses', href: '/results' },
            ].map(item => (
              <button key={item.label} onClick={() => router.push(item.href)}
                className="text-left p-4 rounded-[14px] transition-all hover:bg-white/[0.04]"
                style={{ background: '#0d1426', border: '1px solid rgba(255,255,255,.06)' }}>
                <div className="text-[14px] font-bold text-white">{item.label}</div>
                <div className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{item.desc}</div>
              </button>
            ))}
          </div>
        </section>

      </div>

      <EndOfSessionModal
        open={eosOpen}
        onClose={() => setEosOpen(false)}
        blocks={(planning?.today_blocks || []).map(b => ({
          order: b.order,
          topic_code: b.topic_code,
          lm_code: b.lm_code,
          activity: b.activity,
          minutes: b.minutes,
        }))}
        onSaved={() => fetchPlanning(true)}
      />

      {pomodoroActive && (() => {
        const mm = String(Math.floor(pomodoroSecondsLeft / 60)).padStart(2, '0')
        const ss = String(pomodoroSecondsLeft % 60).padStart(2, '0')
        const isWork = pomodoroPhase === 'work'
        return (
          <div className="fixed bottom-4 right-4 z-40 rounded-2xl shadow-2xl p-3 flex items-center gap-3"
               style={{
                 background: isWork ? 'rgba(34,197,94,0.95)' : 'rgba(99,102,241,0.95)',
                 border: '1px solid rgba(255,255,255,0.15)',
                 backdropFilter: 'blur(8px)',
               }}>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-[.1em] text-white/80">
                {isWork ? 'Focus' : 'Break'}
              </span>
              <span className="text-xl font-extrabold text-white tabular-nums leading-none">
                {mm}:{ss}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => {
                  setPomodoroPhase('work')
                  setPomodoroSecondsLeft(25 * 60)
                }}
                title="Reset"
                className="text-[11px] text-white/80 hover:text-white px-2 py-1 rounded bg-white/10 hover:bg-white/20">
                ↺
              </button>
              <button onClick={async () => {
                  setPomodoroActive(false)
                  // Persist the stop + emit a per-session debrief so the row
                  // shows up enriched in Journey.
                  if (studySessionId) {
                    try {
                      await fetch(`${API}/api/v1/session/stop`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ session_id: studySessionId }),
                      })
                    } catch { /* non-blocking */ }
                    try {
                      const elapsedMs = studyStartedMs ? Date.now() - studyStartedMs : 0
                      const durationMin = Math.max(1, Math.round(elapsedMs / 60000))
                      const topic = studyContext?.topic || ''
                      const debrief = {
                        kpis: {
                          duration: Math.round(elapsedMs / 1000),
                          durationMin,
                          topicStudied: topic,
                          topicName: TOPICS[topic] || topic,
                          topicColor: TOPIC_COLORS[topic] || '#6c8cff',
                          topicProgress: progress[topic] ?? 0,
                          topicWeight: TOPIC_WEIGHTS[topic] ?? 5,
                          todaySessions: 1,
                          todayTotalMin: durationMin,
                          dailyGoalMin: 90,
                          dailyPct: Math.min(100, Math.round((durationMin / 90) * 100)),
                          daysToExam: 0,
                        },
                        weaknesses: [],
                        strengths: [],
                        commentary: [
                          studyContext?.activity
                            ? `Working session : ${studyContext.activity} sur ${studyContext.lm || topic} · ${durationMin} min.`
                            : `Working session : ${durationMin} min sur ${topic || 'study'}.`,
                        ],
                        nextSession: null,
                      }
                      localStorage.setItem(`wingman_debrief_${studySessionId}`, JSON.stringify(debrief))
                      localStorage.setItem('wingman_last_debrief', JSON.stringify(debrief))
                      localStorage.setItem('wingman_last_debrief_ts', new Date().toISOString())
                    } catch { /* ignore */ }
                  }
                  setStudySessionId(null)
                  setStudyStartedMs(null)
                  setStudyContext(null)
                }}
                title="Stop"
                className="text-[11px] text-white/80 hover:text-white px-2 py-1 rounded bg-white/10 hover:bg-white/20">
                ×
              </button>
            </div>
          </div>
        )
      })()}

      {contentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-stretch justify-center p-3 md:p-6"
             onClick={() => setContentModal(null)}>
          <div className="w-full max-w-5xl bg-surface-900 border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate">{contentModal.title}</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">{contentModal.filename}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {contentModal.blockOrder !== undefined && !doneBlocks.has(String(contentModal.blockOrder)) && (
                  <button onClick={() => markDoneAndAdvance(contentModal.blockOrder!)}
                          className="text-[11px] font-bold text-white bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 rounded-lg transition-colors">
                    ✓ Done &amp; Next
                  </button>
                )}
                <a href={contentModal.url} download={contentModal.filename}
                   className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline">
                  Download
                </a>
                <a href={contentModal.url} target="_blank" rel="noopener noreferrer"
                   className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline">
                  Open in tab
                </a>
                <button onClick={() => setContentModal(null)}
                        className="text-slate-500 hover:text-white text-xl leading-none px-2">×</button>
              </div>
            </div>
            {/* PDFs render reliably via <object> with <embed> fallback. Other formats (SVG, JSON, MD) use iframe. */}
            {contentModal.filename.endsWith('.pdf') ? (
              <object data={contentModal.url} type="application/pdf"
                      className="flex-1 w-full bg-white" style={{ minHeight: '70vh' }}>
                <embed src={contentModal.url} type="application/pdf"
                       className="w-full h-full" style={{ minHeight: '70vh' }} />
                <div className="p-6 text-center text-sm text-slate-400">
                  Your browser cannot display this PDF inline.{' '}
                  <a href={contentModal.url} target="_blank" rel="noopener noreferrer"
                     className="text-blue-400 hover:underline">Open in a new tab</a>.
                </div>
              </object>
            ) : (
              <iframe src={contentModal.url} title={contentModal.title}
                      className="flex-1 w-full bg-white" style={{ minHeight: '70vh' }} />
            )}
          </div>
        </div>
      )}

      {errorDebriefModal && (() => {
        const block = errorDebriefModal.block
        const date = new Date().toLocaleDateString('fr-FR')  // DD/MM/YYYY
        const canSave = errorDebriefModal.notes.trim().length > 0
        // Whether there's a next un-done block to chain into after saving.
        const blocks = planning?.today_blocks || []
        const currentIdx = blocks.findIndex(b => b.order === block.order)
        const hasNext = blocks.slice(currentIdx + 1).some(b => !doneBlocks.has(String(b.order)))
        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
               onClick={() => setErrorDebriefModal(null)}>
            <div className="w-full max-w-xl bg-surface-900 border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                 onClick={e => e.stopPropagation()}>
              {/* Header — meta strip */}
              <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3 text-[12px] flex-wrap min-w-0">
                  <span className="text-slate-500 tabular-nums">{date}</span>
                  <span className="text-slate-700">·</span>
                  <span className="font-bold text-white">Error Debrief</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-slate-400">
                    LM: <span className="font-mono font-semibold text-slate-300">{block.topic_code}{block.lm_code ? `-${block.lm_code.replace(/^LM/i, '')}` : ''}</span>
                  </span>
                  {errorDebriefModal.previousActivity && (
                    <>
                      <span className="text-slate-700">·</span>
                      <span className="text-slate-400">
                        Task: <span className="font-semibold text-slate-300">{errorDebriefModal.previousActivity}</span>
                      </span>
                    </>
                  )}
                </div>
                <button onClick={() => setErrorDebriefModal(null)}
                        className="ml-3 p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Body — single textarea */}
              <div className="p-4">
                <textarea
                  autoFocus
                  rows={8}
                  value={errorDebriefModal.notes}
                  onChange={e => setErrorDebriefModal(m => m ? { ...m, notes: e.target.value } : m)}
                  placeholder="Note tes erreurs sur cette tâche : ce qui s'est mal passé, le piège, la correction…"
                  className="w-full bg-black/30 border border-white/[0.08] rounded-lg p-3 text-[13px] text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 resize-none"
                />
              </div>
              {/* Footer */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-white/[0.06]">
                <button onClick={() => setErrorDebriefModal(null)}
                        className="text-[12px] font-semibold px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors">
                  Annuler
                </button>
                <button onClick={() => saveErrorDebrief(false)}
                        disabled={!canSave}
                        title="Enregistrer et marquer ce bloc comme Done"
                        className="text-[12px] font-bold px-4 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 disabled:bg-emerald-500/30 disabled:cursor-not-allowed transition-colors">
                  Done
                </button>
                <button onClick={() => saveErrorDebrief(true)}
                        disabled={!canSave || !hasNext}
                        title={hasNext ? 'Done + ouvrir le prochain bloc à débriefer' : 'Pas de bloc suivant à débriefer'}
                        className="text-[12px] font-bold px-4 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-400 disabled:bg-blue-500/30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5">
                  Next
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
