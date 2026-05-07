'use client'

import type { UntouchedSummary } from '@/lib/readiness/types'

interface Props {
  data: UntouchedSummary
}

export default function UntouchedList({ data }: Props) {
  return (
    <ul className="space-y-2">
      {data.top.map(lm => (
        <li
          key={`${lm.topic}-${lm.lmCode}`}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] uppercase tracking-[0.08em] text-slate-500 shrink-0">
              {lm.topic}
            </span>
            <span className="text-[10px] font-mono text-slate-500 shrink-0">{lm.lmCode}</span>
            <span className="text-sm text-slate-200 truncate">{lm.title}</span>
          </div>
          <span className="text-sm font-medium text-slate-300 tabular-nums shrink-0">
            w {lm.weightPct.toFixed(1)}%
          </span>
        </li>
      ))}
      <li className="flex items-center justify-between gap-3 px-3 py-1.5 text-[12px] text-slate-500">
        <span>
          + {data.others.lmCount} more ({data.others.topicsLabel})
        </span>
        <span className="tabular-nums">w {data.others.weightPct.toFixed(1)}%</span>
      </li>
    </ul>
  )
}
