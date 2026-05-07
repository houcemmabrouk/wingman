'use client'

import type { TimePerQuestion } from '@/lib/readiness/types'

const SCALE_MAX = 180

interface Props {
  data: TimePerQuestion
}

export default function TimeBar({ data }: Props) {
  const valuePct = Math.min(100, (data.avgSeconds / SCALE_MAX) * 100)
  const targetPct = Math.min(100, (data.targetSeconds / SCALE_MAX) * 100)

  return (
    <div className="w-full">
      <div className="relative h-2 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-500/85 transition-all duration-700"
          style={{ width: `${valuePct}%` }}
        />
        <div
          className="absolute top-[-4px] bottom-[-4px] w-px bg-slate-300/70"
          style={{ left: `${targetPct}%` }}
          aria-hidden
        />
      </div>
      <div className="relative mt-2 h-4">
        <span className="absolute text-[10px] text-slate-500 tabular-nums" style={{ left: 0 }}>
          0s
        </span>
        <span
          className="absolute text-[10px] text-slate-300 tabular-nums whitespace-nowrap"
          style={{ left: `${targetPct}%`, transform: 'translateX(-50%)' }}
        >
          target {data.targetSeconds}s
        </span>
        <span className="absolute text-[10px] text-slate-500 tabular-nums" style={{ right: 0 }}>
          {SCALE_MAX}s
        </span>
      </div>
    </div>
  )
}
