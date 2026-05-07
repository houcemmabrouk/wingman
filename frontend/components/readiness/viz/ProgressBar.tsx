'use client'

import type { ReadinessProjection } from '@/lib/readiness/types'

interface Props {
  data: ReadinessProjection
}

export default function ProgressBar({ data }: Props) {
  const value = Math.max(0, Math.min(100, data.current))
  const threshold = data.passThreshold

  return (
    <div className="w-full">
      <div className="relative h-2 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full rounded-full bg-teal-500/80 transition-all duration-700"
          style={{ width: `${value}%` }}
        />
        <div
          className="absolute top-[-4px] bottom-[-4px] w-px bg-slate-300/70"
          style={{ left: `${threshold}%` }}
          aria-hidden
        />
      </div>
      <div className="relative mt-2 h-4">
        <span className="absolute text-[10px] text-slate-500 tabular-nums" style={{ left: 0 }}>
          0
        </span>
        <span
          className="absolute text-[10px] text-slate-300 tabular-nums whitespace-nowrap"
          style={{ left: `${threshold}%`, transform: 'translateX(-50%)' }}
        >
          pass {threshold}%
        </span>
        <span className="absolute text-[10px] text-slate-500 tabular-nums" style={{ right: 0 }}>
          100
        </span>
      </div>
    </div>
  )
}
