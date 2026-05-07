'use client'

import type { EffortAlignment, EffortVsWeightTopic } from '@/lib/readiness/types'

const SCALE_MAX = 25  // %

const STATUS_TONE: Record<EffortVsWeightTopic['severity'], { bg: string; text: string }> = {
  warning: { bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-300' },
  danger: { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-300' },
}

interface Props {
  data: EffortAlignment
}

export default function EffortVsWeight({ data }: Props) {
  return (
    <div className="space-y-3">
      {data.topics.map(t => {
        const tone = STATUS_TONE[t.severity]
        const effortWidth = Math.min(100, (t.effortPct / SCALE_MAX) * 100)
        const weightWidth = Math.min(100, (t.weightPct / SCALE_MAX) * 100)
        return (
          <div key={t.topic}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-slate-200">{t.topic}</span>
              <span className="flex items-baseline gap-2">
                <span className="text-[11px] tabular-nums text-slate-400">
                  {t.effortPct}% / {t.weightPct}%
                </span>
                <span
                  className={`text-[10px] uppercase tracking-[0.08em] font-medium px-1.5 py-0.5 rounded border ${tone.bg} ${tone.text}`}
                >
                  {t.status === 'over' ? 'over-invested' : 'under-invested'}
                </span>
              </span>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-500/80"
                  style={{ width: `${effortWidth}%` }}
                />
              </div>
              <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-500/70"
                  style={{ width: `${weightWidth}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
      <div className="flex items-center gap-4 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-1.5 rounded bg-sky-500/80" /> your effort %
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-1.5 rounded bg-slate-500/70" /> CFA weight %
        </span>
      </div>
    </div>
  )
}
