'use client'

import { useState } from 'react'
import { fmtPct } from './status'

export interface TopicRow {
  topic_id: number
  topic_name: string
  topic_weight_pct: number
  coverage_pct: number
  global_retention_pct: number
  coverage_retention_pct: number
  seen_lms: number
  total_lms: number
}

interface Floors {
  major: number
  minor: number
  light: number
}

interface TopicBreakdownTableProps {
  topics: TopicRow[]
  floors?: Floors
}

const DEFAULT_FLOORS: Floors = { major: 55, minor: 45, light: 35 }

function tierFor(weightPct: number): 'major' | 'minor' | 'light' {
  if (weightPct >= 13) return 'major'
  if (weightPct >= 8)  return 'minor'
  return 'light'
}

const TIER_STYLE: Record<'major' | 'minor' | 'light', { color: string; bg: string; border: string; label: string }> = {
  major: { color: '#ff4d4d', bg: 'rgba(255,77,77,.10)',  border: 'rgba(255,77,77,.30)',  label: 'Major' },
  minor: { color: '#ff8c42', bg: 'rgba(255,140,66,.10)', border: 'rgba(255,140,66,.30)', label: 'Minor' },
  light: { color: '#ffc845', bg: 'rgba(255,200,69,.10)', border: 'rgba(255,200,69,.30)', label: 'Light' },
}

function barColor(pct: number, floor: number): string {
  if (pct >= floor + 20) return '#00e0b8'
  if (pct >= floor)      return '#9be15d'
  if (pct >= floor - 15) return '#ffc845'
  return '#ff4d4d'
}

function ChevronRight({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 text-slate-500`}
      style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 200ms ease-in-out' }}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  )
}

function CheckIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e0b8" strokeWidth="2.5"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff8c42" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function Bar({ pct, color }: { pct: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div className="w-28 h-1.5 rounded-full overflow-hidden shrink-0"
         style={{ background: 'rgba(255,255,255,.06)' }}>
      <div className="h-full rounded-full"
           style={{ width: `${clamped}%`, background: color, transition: 'width 200ms ease-in-out' }} />
    </div>
  )
}

export default function TopicBreakdownTable({ topics, floors = DEFAULT_FLOORS }: TopicBreakdownTableProps) {
  const [open, setOpen] = useState<Set<number>>(new Set())

  const toggle = (id: number) => {
    setOpen(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const sorted = [...topics].sort((a, b) => b.topic_weight_pct - a.topic_weight_pct)

  return (
    <div
      className="rounded-[18px]"
      style={{ background: 'rgba(9,14,28,.55)', border: '1px solid rgba(255,255,255,.06)' }}
    >
      <div className="flex items-center justify-between p-5 pb-3">
        <h3 className="text-[14px] font-bold text-white">Breakdown by topic</h3>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          Sorted by CFA weight
        </span>
      </div>

      {/* Horizontal scroll on mobile */}
      <div className="overflow-x-auto readiness-hscroll">
        <div className="min-w-[760px]">
          {/* Header row */}
          <div className="grid grid-cols-[28px_1.8fr_.7fr_.7fr_1.3fr_1.3fr_.5fr]
                          items-center gap-3 px-5 py-2 border-t border-white/[0.04]
                          text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span />
            <span>Topic</span>
            <span>Weight</span>
            <span>Tier</span>
            <span>Coverage</span>
            <span>Retention (seen)</span>
            <span className="text-center">Status</span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {sorted.map(t => {
              const tier = tierFor(t.topic_weight_pct)
              const tierStyle = TIER_STYLE[tier]
              const floor = floors[tier]
              const aboveFloor = t.coverage_retention_pct >= floor
              const retColor = barColor(t.coverage_retention_pct, floor)
              const isOpen = open.has(t.topic_id)

              return (
                <div key={t.topic_id}>
                  <button
                    onClick={() => toggle(t.topic_id)}
                    className="w-full grid grid-cols-[28px_1.8fr_.7fr_.7fr_1.3fr_1.3fr_.5fr]
                               items-center gap-3 px-5 py-3 text-left
                               hover:bg-white/[0.02]"
                    style={{ transition: 'background 200ms ease-in-out' }}
                  >
                    <ChevronRight open={isOpen} />
                    <span className="text-[13px] font-medium text-slate-200 truncate">
                      {t.topic_name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-300 tabular-nums">
                      {fmtPct(t.topic_weight_pct)}
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-block w-fit"
                      style={{ background: tierStyle.bg, border: `1px solid ${tierStyle.border}`, color: tierStyle.color }}
                    >
                      {tierStyle.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <Bar pct={t.coverage_pct} color="#6c8cff" />
                      <span className="text-[11px] text-slate-300 tabular-nums w-12 text-right">
                        {fmtPct(t.coverage_pct)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bar pct={t.coverage_retention_pct} color={retColor} />
                      <span className="text-[11px] font-semibold tabular-nums w-12 text-right" style={{ color: retColor }}>
                        {fmtPct(t.coverage_retention_pct)}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <CheckIcon ok={aboveFloor} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-3 pt-0 bg-black/20">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                        LMs ({t.seen_lms} / {t.total_lms})
                      </div>
                      {/* Skeleton for now — per-LM detail comes from a separate endpoint */}
                      <div className="space-y-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="h-3 rounded bg-white/[0.04] animate-pulse"
                               style={{ width: `${80 - i * 15}%` }} />
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-600 mt-2">
                        Per-LM detail — to be wired to /api/v1/memory/retention?topic_id={t.topic_id}.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .readiness-hscroll::-webkit-scrollbar { height: 6px; }
        .readiness-hscroll::-webkit-scrollbar-track { background: transparent; }
        .readiness-hscroll::-webkit-scrollbar-thumb {
          background: rgba(108,140,255,.25);
          border-radius: 3px;
        }
        .readiness-hscroll { scrollbar-width: thin; scrollbar-color: rgba(108,140,255,.25) transparent; }
      `}</style>
    </div>
  )
}
