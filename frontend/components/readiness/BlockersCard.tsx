'use client'

import { fmtPct } from './status'

export interface Blocker {
  topic_name: string
  topic_weight_pct: number
  tier: 'major' | 'minor' | 'light' | string
  retention_pct: number
  floor_pct: number
  gap_pct: number
  seen_lms: number
  total_lms: number
}

export interface Focus {
  topic_name: string
  current_pct: number
  target_pct: number
  weight_pct: number
}

interface BlockersCardProps {
  blockers: Blocker[]
  recommendedFocus?: Focus[]
}

const TIER_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  major: { color: '#ff4d4d', bg: 'rgba(255,77,77,.10)',  border: 'rgba(255,77,77,.30)',  label: 'Major' },
  minor: { color: '#ff8c42', bg: 'rgba(255,140,66,.10)', border: 'rgba(255,140,66,.30)', label: 'Minor' },
  light: { color: '#ffc845', bg: 'rgba(255,200,69,.10)', border: 'rgba(255,200,69,.30)', label: 'Light' },
}

function retentionColor(pct: number): string {
  if (pct < 35) return '#ff4d4d'
  if (pct < 55) return '#ff8c42'
  if (pct < 70) return '#ffc845'
  return '#00e0b8'
}

function AlertIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e0b8" strokeWidth="2.5"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function BlockersCard({ blockers, recommendedFocus = [] }: BlockersCardProps) {
  if (blockers.length === 0) {
    return (
      <div
        className="rounded-[18px] p-5"
        style={{
          background: 'rgba(0,224,184,.04)',
          border: '1px solid rgba(0,224,184,.25)',
          transition: 'all 200ms ease-in-out',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 rounded-full p-2" style={{ background: 'rgba(0,224,184,.10)', border: '1px solid rgba(0,224,184,.30)' }}>
            <CheckIcon />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-white">
              All topics are above their minimum floor
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              No blockers — focus on polishing and full mock exams.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-[18px] p-5"
      style={{ background: 'rgba(9,14,28,.55)', border: '1px solid rgba(255,77,77,.18)' }}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <AlertIcon color="#ff8c42" />
          <h3 className="text-[14px] font-bold text-white">
            {blockers.length} blocking topic{blockers.length > 1 ? 's' : ''}
          </h3>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Sorted by impact × weight
        </span>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {blockers.map(b => {
          const tier = TIER_STYLE[b.tier] || TIER_STYLE.light
          const retColor = retentionColor(b.retention_pct)
          return (
            <div key={`${b.topic_name}-${b.tier}`} className="py-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold text-white truncate">{b.topic_name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.06]">
                    weight {fmtPct(b.topic_weight_pct)}
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ background: tier.bg, border: `1px solid ${tier.border}`, color: tier.color }}
                  >
                    {tier.label}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                  {b.seen_lms}/{b.total_lms} LMs studied
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[16px] font-extrabold tabular-nums" style={{ color: retColor }}>
                  {fmtPct(b.retention_pct)}
                </div>
                <div className="text-[10px] text-slate-500 tabular-nums">
                  ↑ {fmtPct(b.floor_pct)}
                  <span className="text-red-400 ml-1">(−{fmtPct(b.gap_pct)})</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {recommendedFocus.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 mb-2">
            Recommended focus
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recommendedFocus.map(f => (
              <span
                key={f.topic_name}
                className="text-[11px] px-2 py-1 rounded-md border"
                style={{
                  background: 'rgba(108,140,255,.06)',
                  borderColor: 'rgba(108,140,255,.25)',
                  color: '#a0b4ff',
                }}
              >
                {f.topic_name}
                <span className="text-slate-500 ml-1.5 tabular-nums">
                  {fmtPct(f.current_pct)} → {fmtPct(f.target_pct)}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
