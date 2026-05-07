'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TOPICS, TOPIC_COLORS, TOPIC_ORDER, LM_DATA } from '@/lib/lm-data'

// ── Types ──
type SessionPhase = 'morning' | 'afternoon' | 'evening'

interface Block {
  time: string
  duration: string
  title: string
  technique: string
  description: string
  category: 'encoding' | 'recall' | 'practice' | 'review' | 'pause' | 'meta'
}

interface SpacedItem {
  topic: string
  lmCode: string
  title: string
  dueType: 'J+3' | 'J+7' | 'J+30'
  color: string
}

// ── Constants ──
const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  encoding:  { bg: 'rgba(59,130,246,0.08)',  text: '#60A5FA', border: 'rgba(59,130,246,0.15)' },
  recall:    { bg: 'rgba(139,92,246,0.08)',   text: '#A78BFA', border: 'rgba(139,92,246,0.15)' },
  practice:  { bg: 'rgba(245,158,11,0.08)',   text: '#FBBF24', border: 'rgba(245,158,11,0.15)' },
  review:    { bg: 'rgba(34,197,94,0.08)',     text: '#4ADE80', border: 'rgba(34,197,94,0.15)' },
  pause:     { bg: 'rgba(148,163,184,0.04)',  text: '#64748B', border: 'rgba(148,163,184,0.08)' },
  meta:      { bg: 'rgba(236,72,153,0.08)',   text: '#F472B6', border: 'rgba(236,72,153,0.15)' },
}

const TECHNIQUE_LABELS: Record<string, string> = {
  encoding: 'Dual Coding',
  recall: 'Active Recall',
  practice: 'Testing Effect',
  review: 'Spaced Repetition',
  pause: 'Consolidation',
  meta: 'Metacognition',
}

// ── Morning session blocks (09:00–11:30) ──
function getMorningBlocks(topic: string, lmCode: string, title: string): Block[] {
  return [
    { time: '09:00', duration: '30 min', title: `Encoding — ${lmCode}`, technique: 'Dual Coding', description: `Read + annotate ${title}. Combine visual & verbal encoding.`, category: 'encoding' },
    { time: '09:30', duration: '20 min', title: 'Lecture Readings + Blank Recall', technique: 'Active Recall', description: 'Read English source material, then recall key points from memory.', category: 'recall' },
    { time: '09:50', duration: '20 min', title: 'Concept Mapping + Cold Test', technique: 'Testing Effect', description: 'Build concept map without notes. Test yourself on connections.', category: 'practice' },
    { time: '10:10', duration: '30 min', title: 'Synthesis LOS + Audio + Retest', technique: 'Elaboration + Test-Retest', description: 'Synthesize LOS objectives. Listen to audio summary. Retest.', category: 'encoding' },
    { time: '10:40', duration: '20 min', title: 'Cognitive Break', technique: 'Hippocampal Consolidation', description: 'Rest period. No screens. Let your brain consolidate.', category: 'pause' },
    { time: '11:00', duration: '30 min', title: 'Knowledge Audit + Weakness Pool', technique: 'Metacognition + Error-Based Learning', description: 'Identify gaps. Build weakness pool for targeted remediation.', category: 'meta' },
    { time: '11:30', duration: '30 min', title: 'Targeted Revision + TDS Sheet', technique: 'Focused Remediation', description: 'Attack weaknesses identified in audit. Complete TDS sheet.', category: 'review' },
  ]
}

// ── Afternoon session blocks (12:00–13:30) ──
function getAfternoonBlocks(topic: string, lmCode: string, title: string): Block[] {
  return [
    { time: '12:00', duration: '20 min', title: 'Concept on Concept + Calculator', technique: 'Interleaving', description: 'Cross-concept practice. Calculator drills for computation speed.', category: 'practice' },
    { time: '12:20', duration: '30 min', title: 'Mock 20 Questions', technique: 'Exam Simulation', description: `20 MCQs on ${topic} topics. Strict timer. Exam conditions.`, category: 'practice' },
    { time: '12:50', duration: '20 min', title: 'Cognitive Break', technique: 'Hippocampal Consolidation', description: 'Rest. Walk, breathe. Neural consolidation in progress.', category: 'pause' },
    { time: '13:10', duration: '20 min', title: 'Score Analysis + Essential Summary', technique: 'Metacognitive Calibration', description: 'Analyze mock results. Update essential summary sheet.', category: 'meta' },
    { time: '13:30', duration: '20 min', title: 'Dashboard + Log Results', technique: 'Progress Tracking', description: 'Log score, time, and confidence. Update progression dashboard.', category: 'meta' },
  ]
}

// ── Evening session blocks (19:50–21:10) ──
function getEveningBlocks(topic: string, lmCode: string, title: string): Block[] {
  return [
    { time: '19:50', duration: '10 min', title: 'Flash Review', technique: 'Pre-Sleep Reactivation', description: 'Quick flashcard review. Prime memory before sleep consolidation.', category: 'recall' },
    { time: '20:00', duration: '20 min', title: 'Impact on Course', technique: 'Global Reflection', description: `How does today's ${topic} study connect to the bigger picture?`, category: 'meta' },
    { time: '20:20', duration: '50 min', title: 'Spaced Repetition Cycles', technique: 'J+3 / J+7 / J+30 Review', description: 'Review past modules due today. Blank recall + cold test format.', category: 'review' },
  ]
}

// ── Simulated spaced repetition queue ──
function getSpacedRepetitionQueue(): SpacedItem[] {
  // Simulate items due based on deterministic "study dates"
  const items: SpacedItem[] = []
  const studied = [
    { topic: 'ETH', lm: 'LM01', title: 'Ethics and Trust', daysAgo: 3 },
    { topic: 'QM', lm: 'LM01', title: 'Rates and Returns', daysAgo: 7 },
    { topic: 'QM', lm: 'LM02', title: 'Time Value of Money', daysAgo: 30 },
    { topic: 'FSA', lm: 'LM01', title: 'Intro to FSA', daysAgo: 3 },
    { topic: 'FI', lm: 'LM01', title: 'FI Instrument Features', daysAgo: 7 },
  ]
  studied.forEach(s => {
    const dueType = s.daysAgo === 3 ? 'J+3' : s.daysAgo === 7 ? 'J+7' : 'J+30'
    items.push({
      topic: s.topic, lmCode: s.lm, title: s.title,
      dueType, color: TOPIC_COLORS[s.topic] || '#6B7280',
    })
  })
  return items
}

// ── Progress data (simulated) ──
function getProgressData() {
  const defaults: Record<string, number> = {
    ETH: 42, QM: 28, ECO: 35, FSA: 51, CORP: 19,
    EQU: 69, FI: 22, DER: 15, ALT: 38, PM: 44,
  }
  try {
    const stored = localStorage.getItem('wingman_topic_progress')
    if (stored) return JSON.parse(stored) as Record<string, number>
  } catch { /* ignore */ }
  return defaults
}

// ── Phase config ──
const PHASES: { key: SessionPhase; label: string; time: string; duration: string; icon: string }[] = [
  { key: 'morning',   label: 'Morning Session',       time: '09:00 – 12:00', duration: '3h00', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
  { key: 'afternoon', label: 'Afternoon Session', time: '12:00 – 15:30', duration: '3h30', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'evening',   label: 'Evening Debrief',      time: '19:50 – 21:10', duration: '1h20', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
]

export default function SmartPlannerPage() {
  const router = useRouter()
  const [selectedTopic, setSelectedTopic] = useState(() => {
    if (typeof window === 'undefined') return 'ETH'
    return localStorage.getItem('wingman_current_session_topic') || 'ETH'
  })
  const [selectedLMKey, setSelectedLMKey] = useState(() => {
    if (typeof window === 'undefined') return 'ETH/LM01'
    return localStorage.getItem('wingman_current_session_lm') || 'ETH/LM01'
  })
  const [activePhase, setActivePhase] = useState<SessionPhase>('morning')
  const [completedBlocks, setCompletedBlocks] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<Record<string, number>>({})

  useEffect(() => {
    setProgress(getProgressData())
    // Load completed blocks from localStorage
    try {
      const stored = localStorage.getItem('wingman_completed_blocks')
      if (stored) setCompletedBlocks(new Set(JSON.parse(stored)))
    } catch { /* ignore */ }
  }, [])

  // Save completed blocks
  const toggleBlock = (blockId: string) => {
    setCompletedBlocks(prev => {
      const next = new Set(prev)
      if (next.has(blockId)) next.delete(blockId)
      else next.add(blockId)
      localStorage.setItem('wingman_completed_blocks', JSON.stringify([...next]))
      return next
    })
  }

  const topicLMs = useMemo(() => LM_DATA.filter(([t]) => t === selectedTopic), [selectedTopic])
  const currentLM = useMemo(() => {
    const entry = LM_DATA.find(([t, lm]) => `${t}/${lm}` === selectedLMKey)
    return entry ? { topic: entry[0], lmCode: entry[1], title: entry[2] } : null
  }, [selectedLMKey])

  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic)
    const first = LM_DATA.find(([t]) => t === topic)
    if (first) setSelectedLMKey(`${first[0]}/${first[1]}`)
  }

  // Get blocks for active phase
  const blocks = useMemo(() => {
    if (!currentLM) return []
    switch (activePhase) {
      case 'morning': return getMorningBlocks(currentLM.topic, currentLM.lmCode, currentLM.title)
      case 'afternoon': return getAfternoonBlocks(currentLM.topic, currentLM.lmCode, currentLM.title)
      case 'evening': return getEveningBlocks(currentLM.topic, currentLM.lmCode, currentLM.title)
    }
  }, [activePhase, currentLM])

  const spacedQueue = useMemo(() => getSpacedRepetitionQueue(), [])

  // Phase completion stats
  const phaseBlockCount = blocks.length
  const phaseCompletedCount = blocks.filter((_, i) => completedBlocks.has(`${activePhase}-${i}`)).length
  const phasePct = phaseBlockCount > 0 ? Math.round((phaseCompletedCount / phaseBlockCount) * 100) : 0

  // Total day stats
  const allBlocks = currentLM ? [
    ...getMorningBlocks(currentLM.topic, currentLM.lmCode, currentLM.title),
    ...getAfternoonBlocks(currentLM.topic, currentLM.lmCode, currentLM.title),
    ...getEveningBlocks(currentLM.topic, currentLM.lmCode, currentLM.title),
  ] : []
  const totalCompleted = allBlocks.reduce((acc, _, i) => {
    const phase = i < 7 ? 'morning' : i < 12 ? 'afternoon' : 'evening'
    const idx = i < 7 ? i : i < 12 ? i - 7 : i - 12
    return acc + (completedBlocks.has(`${phase}-${idx}`) ? 1 : 0)
  }, 0)
  const totalPct = allBlocks.length > 0 ? Math.round((totalCompleted / allBlocks.length) * 100) : 0

  // Sorted progress for the mini chart
  const sortedProgress = useMemo(() => {
    return TOPIC_ORDER.map(t => ({
      topic: t, pct: progress[t] ?? 0, color: TOPIC_COLORS[t],
    })).sort((a, b) => a.pct - b.pct)
  }, [progress])

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ═══ HEADER ═══ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <svg className="w-5 h-5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Smart Planner
          </h1>
          <p className="text-xs text-slate-500 mt-1">Daily program based on neuroscience — 3 sessions, 8h target work</p>
        </div>
        <div className="flex items-center gap-3 text-center shrink-0">
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5">
            <div className="text-lg font-extrabold text-white tabular-nums">{totalCompleted}/{allBlocks.length}</div>
            <div className="text-[9px] text-slate-500 uppercase">Blocs</div>
          </div>
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5">
            <div className="text-lg font-extrabold tabular-nums" style={{ color: totalPct >= 80 ? '#22c55e' : totalPct >= 40 ? '#3b82f6' : '#94a3b8' }}>{totalPct}%</div>
            <div className="text-[9px] text-slate-500 uppercase">Day</div>
          </div>
        </div>
      </div>

      {/* ═══ MODULE SELECTOR ═══ */}
      <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 mb-3">Today's Module</div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {TOPIC_ORDER.map(t => (
            <button
              key={t}
              onClick={() => handleTopicChange(t)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border"
              style={t === selectedTopic
                ? { background: TOPIC_COLORS[t], borderColor: TOPIC_COLORS[t], color: '#fff' }
                : { background: 'transparent', borderColor: 'rgba(255,255,255,0.06)', color: '#64748b' }
              }
            >
              {t}
            </button>
          ))}
        </div>
        <select
          value={selectedLMKey}
          onChange={e => setSelectedLMKey(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-surface-700 border border-surface-600 text-sm text-white outline-none focus:border-accent-blue transition-colors appearance-none cursor-pointer"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
        >
          {topicLMs.map(([t, lm, title]) => (
            <option key={`${t}/${lm}`} value={`${t}/${lm}`} className="bg-surface-900">
              {lm} — {title}
            </option>
          ))}
        </select>
        {currentLM && (
          <div className="flex items-center gap-3 mt-3">
            <span className="w-2 h-2 rounded-full" style={{ background: TOPIC_COLORS[currentLM.topic] }} />
            <span className="text-xs text-slate-400">{TOPICS[currentLM.topic]}</span>
            <button
              onClick={() => router.push(`/library?lm=${selectedLMKey}`)}
              className="ml-auto text-[10px] text-accent-blue hover:underline"
            >
              View in Library
            </button>
          </div>
        )}
      </div>

      {/* ═══ PHASE TABS ═══ */}
      <div className="grid grid-cols-3 gap-3">
        {PHASES.map(phase => {
          const isActive = activePhase === phase.key
          return (
            <button
              key={phase.key}
              onClick={() => setActivePhase(phase.key)}
              className={`relative rounded-xl p-4 border transition-all text-left ${
                isActive
                  ? 'bg-accent-blue/[0.08] border-accent-blue/30'
                  : 'bg-surface-800/40 border-white/[0.04] hover:border-white/[0.08]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <svg className={`w-4 h-4 ${isActive ? 'text-accent-blue' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={phase.icon} />
                </svg>
                <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>{phase.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600">{phase.time}</span>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-accent-blue' : 'text-slate-600'}`}>{phase.duration}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* ═══ TIMELINE BLOCKS ═══ */}
      <div className="space-y-2">
        {/* Phase progress */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-slate-500">{phaseCompletedCount}/{phaseBlockCount} blocks completed</span>
          <span className="text-[11px] font-semibold" style={{ color: phasePct >= 80 ? '#22c55e' : phasePct >= 40 ? '#3b82f6' : '#94a3b8' }}>{phasePct}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-surface-700 overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(1, phasePct)}%`,
              background: phasePct >= 80 ? '#22c55e' : phasePct >= 40 ? '#3b82f6' : '#6366f1',
            }}
          />
        </div>

        {blocks.map((block, i) => {
          const blockId = `${activePhase}-${i}`
          const done = completedBlocks.has(blockId)
          const style = CATEGORY_STYLES[block.category]
          return (
            <div
              key={blockId}
              onClick={() => toggleBlock(blockId)}
              className={`relative rounded-xl border p-4 cursor-pointer transition-all group ${
                done ? 'opacity-50' : 'hover:border-white/[0.12]'
              }`}
              style={{ background: style.bg, borderColor: done ? 'rgba(34,197,94,0.2)' : style.border }}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  done ? 'bg-emerald-500 border-emerald-500' : 'border-white/[0.15] group-hover:border-white/[0.25]'
                }`}>
                  {done && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono font-bold tabular-nums" style={{ color: style.text }}>{block.time}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-slate-500">{block.duration}</span>
                  </div>
                  <h3 className={`text-sm font-semibold mb-0.5 ${done ? 'text-slate-500 line-through' : 'text-white'}`}>
                    {block.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{block.description}</p>
                </div>

                {/* Technique badge */}
                <span className="text-[9px] font-semibold px-2 py-1 rounded-lg shrink-0" style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
                  {block.technique}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══ BOTTOM: Spaced Repetition + Progress ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Spaced Repetition Queue */}
        <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <h3 className="text-sm font-bold text-white">Spaced Repetition</h3>
            <span className="text-[10px] text-slate-600 ml-auto">Cycles J+3 / J+7 / J+30</span>
          </div>

          {/* SR Diagram */}
          <div className="flex items-center gap-2 mb-5 px-2">
            {['Day 0', 'J+3', 'J+7', 'J+30'].map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className={`flex flex-col items-center ${i === 0 ? '' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                    i === 0 ? 'bg-accent-blue/20 text-accent-blue' :
                    i === 1 ? 'bg-purple-500/20 text-purple-400' :
                    i === 2 ? 'bg-amber-500/20 text-amber-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {label.replace('Day ', '')}
                  </div>
                  <span className="text-[8px] text-slate-600 mt-1 text-center leading-tight">
                    {i === 0 ? 'Encoding' : i === 1 ? 'Blank Recall' : i === 2 ? 'Cold Test' : 'Mock Q'}
                  </span>
                </div>
                {i < 3 && (
                  <svg className="w-4 h-4 text-slate-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Due items */}
          <div className="space-y-2">
            {spacedQueue.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-4">No reviews due today</p>
            ) : spacedQueue.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-mono font-semibold" style={{ color: item.color }}>{item.topic}/{item.lmCode}</span>
                  <span className="text-[11px] text-slate-500 ml-2 truncate">{item.title}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  item.dueType === 'J+3' ? 'bg-purple-500/15 text-purple-400' :
                  item.dueType === 'J+7' ? 'bg-amber-500/15 text-amber-400' :
                  'bg-emerald-500/15 text-emerald-400'
                }`}>{item.dueType}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress by Subject */}
        <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Progress by Subject</h3>
            <div className="flex items-center gap-2 text-[9px] text-slate-600">
              <span className="flex items-center gap-1"><span className="w-2 h-1 rounded-full bg-emerald-500" /> &ge;65%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-1 rounded-full bg-amber-500" /> 35-65%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-1 rounded-full bg-red-500" /> &lt;35%</span>
            </div>
          </div>
          <div className="space-y-3">
            {sortedProgress.map(tp => {
              const barColor = tp.pct >= 65 ? '#22c55e' : tp.pct >= 35 ? '#f59e0b' : '#ef4444'
              return (
                <div key={tp.topic}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: tp.color }} />
                      <span className="text-[11px] font-semibold text-white">{tp.topic}</span>
                      <span className="text-[10px] text-slate-600">{TOPICS[tp.topic]}</span>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums" style={{ color: barColor }}>{tp.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${tp.pct}%`, background: barColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Thresholds legend */}
          <div className="mt-4 pt-3 border-t border-white/[0.04] text-[10px] text-slate-600">
            Priority: subjects below 35% are handled first based on exam weight.
          </div>
        </div>
      </div>
    </div>
  )
}
