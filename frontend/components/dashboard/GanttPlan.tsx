'use client'

import { useMemo } from 'react'
import {
  PHASES, type StudyPlanOutput, type StudyPhase,
} from '@/lib/study-plan-engine'
import { TOPIC_ORDER, TOPICS, TOPIC_COLORS, EXAM_WEIGHTS } from '@/lib/lm-data'

// ── Config ──────────────────────────────────────────────────
const TOTAL_WEEKS = 19
const START_DATE = new Date('2026-04-06T00:00:00')
const ACCENT_BLUE = '#6c8cff'
const ACCENT_TEAL = '#00e0b8'

/** Weeks elapsed since START_DATE (1-based, clamped 1..TOTAL_WEEKS) */
function computeCurrentWeek(): number {
  const diff = Date.now() - START_DATE.getTime()
  const w = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1
  return Math.max(1, Math.min(TOTAL_WEEKS, w))
}

// Per-subject Gantt bar config: start/end week (1-based) + which phases
interface SubjectBar {
  topic: string
  name: string
  color: string
  weight: number
  startWeek: number
  endWeek: number
  phases: { key: StudyPhase; startW: number; endW: number; color: string }[]
}

function buildSubjectBars(plan: StudyPlanOutput | null): SubjectBar[] {
  // Build a sensible default layout based on exam weights
  // High-weight topics start earlier and span more weeks
  const sorted = [...TOPIC_ORDER].sort((a, b) => (EXAM_WEIGHTS[b] || 0) - (EXAM_WEIGHTS[a] || 0))

  return sorted.map((code, idx) => {
    // Stagger starts: heaviest topics start week 1, lightest start later
    const startW = Math.max(1, 1 + Math.floor(idx * 0.6))
    // All topics end at or near TOTAL_WEEKS, heaviest get more consolidation
    const endW = TOTAL_WEEKS
    const span = endW - startW + 1

    // Divide the bar into phases proportionally
    const phaseAlloc = PHASES.map(p => ({
      key: p.key,
      color: p.color,
      weeks: Math.max(1, Math.round(span * p.pct)),
    }))
    // Adjust to fit exact span
    const total = phaseAlloc.reduce((s, p) => s + p.weeks, 0)
    if (total > span) phaseAlloc[phaseAlloc.length - 1].weeks -= (total - span)
    if (total < span) phaseAlloc[0].weeks += (span - total)

    const phases: SubjectBar['phases'] = []
    let cursor = startW
    for (const pa of phaseAlloc) {
      if (pa.weeks <= 0) continue
      phases.push({ key: pa.key, startW: cursor, endW: cursor + pa.weeks - 1, color: pa.color })
      cursor += pa.weeks
    }

    return {
      topic: code,
      name: TOPICS[code] || code,
      color: TOPIC_COLORS[code] || '#6b7280',
      weight: EXAM_WEIGHTS[code] || 0,
      startWeek: startW,
      endWeek: endW,
      phases,
    }
  })
}

// ── Component ───────────────────────────────────────────────
interface Props {
  plan: StudyPlanOutput | null
  topicProgress?: Record<string, number>  // topic code -> 0..100
}

export default function GanttPlan({ plan, topicProgress = {} }: Props) {
  const curWeek = computeCurrentWeek()
  const bars = useMemo(() => buildSubjectBars(plan), [plan])

  const weeks = Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1)

  // Phase boundaries for header
  const phaseHeaders = useMemo(() => {
    const result: { label: string; color: string; startW: number; endW: number }[] = []
    let cursor = 1
    for (const p of PHASES) {
      const span = Math.max(1, Math.round(TOTAL_WEEKS * p.pct))
      const endW = Math.min(TOTAL_WEEKS, cursor + span - 1)
      result.push({ label: p.label, color: p.color, startW: cursor, endW })
      cursor = endW + 1
    }
    // Ensure last phase extends to TOTAL_WEEKS
    if (result.length > 0) result[result.length - 1].endW = TOTAL_WEEKS
    return result
  }, [])

  return (
    <div
      className="rounded-[18px] p-5 relative overflow-hidden"
      style={{
        background: '#10182d',
        border: '1px solid rgba(255,255,255,.06)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Radial glow */}
      <div
        className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at top right, rgba(108,140,255,.1), transparent 70%)' }}
      />

      {/* Title */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#475569' }}>
            Plan Gantt
          </div>
          <div className="text-[13px] font-bold text-white mt-0.5">
            {TOTAL_WEEKS}-week study plan &middot; <span style={{ color: ACCENT_BLUE }}>W{curWeek}</span> current
          </div>
        </div>
        {/* Phase legend */}
        <div className="flex gap-3">
          {PHASES.map(p => (
            <div key={p.key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
              <span className="text-[10px] text-slate-400">{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gantt grid */}
      <div className="relative z-10 overflow-x-auto">
        <div style={{ minWidth: '700px' }}>
          {/* Phase header row */}
          <div className="flex mb-1" style={{ marginLeft: '160px' }}>
            {phaseHeaders.map(ph => {
              const span = ph.endW - ph.startW + 1
              const widthPct = (span / TOTAL_WEEKS) * 100
              return (
                <div
                  key={ph.label}
                  className="text-center text-[9px] font-bold uppercase tracking-wider py-1 rounded-t-md"
                  style={{
                    width: `${widthPct}%`,
                    color: ph.color,
                    background: `${ph.color}10`,
                  }}
                >
                  {ph.label}
                </div>
              )
            })}
          </div>

          {/* Week numbers header */}
          <div className="flex mb-2" style={{ marginLeft: '160px' }}>
            {weeks.map(w => (
              <div
                key={w}
                className="flex-1 text-center text-[9px] font-medium"
                style={{
                  color: w === curWeek ? ACCENT_BLUE : '#334155',
                  fontWeight: w === curWeek ? 800 : 500,
                }}
              >
                {w}
              </div>
            ))}
          </div>

          {/* Subject rows */}
          {bars.map(bar => {
            const donePct = topicProgress[bar.topic] ?? 0
            return (
              <div key={bar.topic} className="flex items-center mb-1.5 group">
                {/* Label */}
                <div className="w-[160px] flex-shrink-0 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: bar.color }} />
                    <span className="text-[11px] font-semibold text-white truncate">{bar.topic}</span>
                    <span className="text-[9px] text-slate-600 ml-auto">{bar.weight}%</span>
                  </div>
                  <div className="text-[9px] text-slate-600 truncate ml-4">{bar.name}</div>
                </div>

                {/* Bar area */}
                <div className="flex-1 relative h-7">
                  {/* Background grid */}
                  <div className="absolute inset-0 flex">
                    {weeks.map(w => (
                      <div
                        key={w}
                        className="flex-1 border-r"
                        style={{
                          borderColor: w === curWeek ? `${ACCENT_BLUE}30` : 'rgba(255,255,255,.03)',
                          background: w === curWeek ? `${ACCENT_BLUE}08` : 'transparent',
                        }}
                      />
                    ))}
                  </div>

                  {/* Phase segments */}
                  {bar.phases.map((ph, i) => {
                    const leftPct = ((ph.startW - 1) / TOTAL_WEEKS) * 100
                    const widthPct = ((ph.endW - ph.startW + 1) / TOTAL_WEEKS) * 100
                    return (
                      <div
                        key={i}
                        className="absolute top-1 bottom-1 transition-all"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          background: `${ph.color}25`,
                          borderRadius: i === 0 ? '6px 0 0 6px' : i === bar.phases.length - 1 ? '0 6px 6px 0' : '0',
                          borderTop: `2px solid ${ph.color}60`,
                        }}
                      />
                    )
                  })}

                  {/* Done overlay */}
                  {donePct > 0 && (
                    <div
                      className="absolute top-1 bottom-1 rounded-l-md transition-all"
                      style={{
                        left: `${((bar.startWeek - 1) / TOTAL_WEEKS) * 100}%`,
                        width: `${((bar.endWeek - bar.startWeek + 1) / TOTAL_WEEKS) * donePct}%`,
                        background: `linear-gradient(90deg, ${ACCENT_TEAL}50, ${ACCENT_TEAL}20)`,
                        borderRadius: '6px',
                      }}
                    />
                  )}

                  {/* Done % label */}
                  {donePct > 0 && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 text-[8px] font-bold"
                      style={{
                        left: `${((bar.startWeek - 1) / TOTAL_WEEKS) * 100 + ((bar.endWeek - bar.startWeek + 1) / TOTAL_WEEKS) * donePct + 0.5}%`,
                        color: ACCENT_TEAL,
                      }}
                    >
                      {Math.round(donePct)}%
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Current week indicator line */}
          <div
            className="absolute top-0 bottom-0 w-px z-20 pointer-events-none"
            style={{
              left: `calc(160px + ${((curWeek - 0.5) / TOTAL_WEEKS) * 100}% * (100% - 160px) / 100%)`,
              background: `linear-gradient(to bottom, ${ACCENT_BLUE}, transparent)`,
              opacity: 0.4,
            }}
          />
        </div>
      </div>

      {/* Bottom summary */}
      <div className="flex items-center justify-between mt-4 pt-3 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="flex gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: '#475569' }}>Week</div>
            <div className="text-lg font-extrabold tabular-nums" style={{ color: ACCENT_BLUE }}>{curWeek}<span className="text-[11px] text-slate-600 font-normal">/{TOTAL_WEEKS}</span></div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: '#475569' }}>Phase</div>
            <div className="text-[13px] font-bold" style={{ color: phaseHeaders.find(p => curWeek >= p.startW && curWeek <= p.endW)?.color || ACCENT_BLUE }}>
              {phaseHeaders.find(p => curWeek >= p.startW && curWeek <= p.endW)?.label || 'Discovery'}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {TOPIC_ORDER.map(code => {
            const pct = topicProgress[code] ?? 0
            return (
              <div key={code} className="text-center" title={`${TOPICS[code]}: ${Math.round(pct)}%`}>
                <div
                  className="w-6 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,.06)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: TOPIC_COLORS[code] }}
                  />
                </div>
                <div className="text-[7px] mt-0.5" style={{ color: '#475569' }}>{code}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
