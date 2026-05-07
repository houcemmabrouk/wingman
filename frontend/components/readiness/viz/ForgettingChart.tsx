'use client'

import type { ForgettingDebt, ForgettingDayBucket } from '@/lib/readiness/types'

const SEVERITY_COLOR: Record<ForgettingDayBucket['severity'], string> = {
  low: 'bg-amber-500/30',
  medium: 'bg-amber-500/55',
  high: 'bg-amber-500/80',
  critical: 'bg-red-500/85',
}

interface Props {
  data: ForgettingDebt
}

export default function ForgettingChart({ data }: Props) {
  return (
    <div>
      <div className="flex items-end gap-1.5 h-28">
        {data.buckets.map(b => (
          <div key={b.label} className="flex-1 flex flex-col items-center justify-end gap-1">
            <div
              className={`w-full rounded-sm ${SEVERITY_COLOR[b.severity]} transition-all duration-500`}
              style={{ height: `${Math.max(4, b.height)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        {data.buckets.map(b => (
          <span
            key={`lbl-${b.label}`}
            className="flex-1 text-center text-[10px] text-slate-500 tabular-nums"
          >
            {b.label}
          </span>
        ))}
      </div>
    </div>
  )
}
