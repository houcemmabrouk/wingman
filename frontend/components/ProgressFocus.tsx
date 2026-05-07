'use client'

// Progress Focus — topic mastery panel sorted by weakness.
// Used on the Today Mission home page AND the Progression tab on /results.
// All data is read from localStorage (wingman_topic_progress, wingman_lm_progress)
// so any quiz debrief that updates these keys reflects here automatically.

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TOPICS, TOPIC_COLORS, TOPIC_ORDER, EXAM_WEIGHTS as TOPIC_WEIGHTS, LM_DATA } from '@/lib/lm-data'

const PEER_AVG: Record<string, number> = {
  ETH: 68, QM: 55, ECO: 58, FSA: 52, CORP: 63, EQU: 60, FI: 49, DER: 47, ALT: 62, PM: 57,
}

const EXAM_WEIGHT_RANGES: Record<string, string> = {
  ETH: '15–20%', QM: '8–12%', ECO: '8–12%', FSA: '13–17%', CORP: '8–12%',
  EQU: '10–12%', FI: '11–14%', DER: '5–8%', ALT: '5–8%', PM: '5–8%',
}

function getProgress(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try { const s = localStorage.getItem('wingman_topic_progress'); if (s) return JSON.parse(s) } catch {}
  return { ETH: 0, QM: 0, ECO: 0, FSA: 0, CORP: 0, EQU: 0, FI: 0, DER: 0, ALT: 0, PM: 0 }
}

function getLmProgress(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const s = localStorage.getItem('wingman_lm_progress')
    if (s) return JSON.parse(s)
  } catch {}
  // One-shot migration from legacy topic-level key (assume score came from LM01).
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

interface ProgressFocusProps {
  /** Topics highlighted as "IN SESSION" — pass from the parent page if relevant. */
  sessionTopics?: Set<string>
  /** Pass-through styling — defaults to the dashboard card. */
  className?: string
  /** Wrap the panel in a card? Default true. Set false to drop the wrapper (e.g. inside an existing tab card). */
  framed?: boolean
}

export default function ProgressFocus({ sessionTopics, className, framed = true }: ProgressFocusProps) {
  const router = useRouter()
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [lmProgress, setLmProgress] = useState<Record<string, number>>({})
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)
  const threshold = 70

  useEffect(() => {
    setProgress(getProgress())
    setLmProgress(getLmProgress())
  }, [])

  const topicMastery = useMemo(() => {
    return TOPIC_ORDER.map(t => {
      const lmsForTopic = LM_DATA.filter(([topic]) => topic === t)
      const totalLms = lmsForTopic.length
      const lmScores = lmsForTopic.map(([topic, lm, title]) => ({
        lm, title, pct: lmProgress[`${topic}/${lm}`] ?? 0,
      }))
      const attemptedLms = lmScores.filter(l => l.pct > 0).length
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

  const inner = (
    <>
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
          const inSession = sessionTopics?.has(t.topic) ?? false
          const isExpanded = expandedTopic === t.topic
          const coverageColor = t.attemptedLms === 0 ? '#64748b'
            : t.attemptedLms < t.totalLms ? '#f59e0b'
            : '#22c55e'
          return (
            <div key={t.topic}
              className="rounded-[12px] p-2.5 transition-all hover:bg-white/[0.02]"
              style={{ border: inSession ? '1px solid rgba(108,140,255,.25)' : '1px solid transparent', background: inSession ? 'rgba(108,140,255,.04)' : 'transparent' }}>
              <div className="flex items-center justify-between mb-1 cursor-pointer"
                   onClick={() => setExpandedTopic(isExpanded ? null : t.topic)}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-slate-500 w-3 shrink-0">{isExpanded ? '▾' : '▸'}</span>
                  <span className="text-[9px] font-bold w-9 text-center py-0.5 rounded text-white shrink-0" style={{ background: t.color }}>{t.topic}</span>
                  <span className="text-[12px] text-white font-medium truncate">{t.name}</span>
                  {inSession && <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(108,140,255,.14)', color: '#a0b4ff' }}>IN SESSION</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded"
                        title={`${t.attemptedLms} of ${t.totalLms} LMs attempted`}
                        style={{ background: `${coverageColor}15`, color: coverageColor }}>
                    {t.attemptedLms}/{t.totalLms}
                  </span>
                  <span className="text-[9px] text-slate-500">{EXAM_WEIGHT_RANGES[t.topic]}</span>
                  <span className="text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded" style={{ background: `${statusColor}15`, color: statusColor }}>{statusLabel}</span>
                  <span className="text-[12px] font-bold tabular-nums w-10 text-right" style={{ color: statusColor }}>{t.pct}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-[8px] rounded-full overflow-hidden" style={{ background: '#0a1020', border: '1px solid rgba(255,255,255,.03)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${t.pct}%`, background: statusColor }} />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,.2)' }} />
                  <span className="text-[8px] text-slate-600 tabular-nums">{peer}% peer</span>
                </div>
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
    </>
  )

  if (!framed) return <div className={className}>{inner}</div>

  return (
    <section
      className={`rounded-[18px] p-5 ${className || ''}`}
      style={{ background: '#10182d', border: '1px solid rgba(255,255,255,.06)' }}
    >
      {inner}
    </section>
  )
}
