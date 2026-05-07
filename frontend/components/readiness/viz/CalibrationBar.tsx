'use client'

import type { CalibrationBreakdown, CalibrationSegment } from '@/lib/readiness/types'

const TONE_BG: Record<CalibrationSegment['tone'], string> = {
  success: 'bg-teal-500/85',
  danger: 'bg-red-500/85',
  tertiary: 'bg-slate-500/70',
}
const TONE_TEXT: Record<CalibrationSegment['tone'], string> = {
  success: 'text-teal-300',
  danger: 'text-red-300',
  tertiary: 'text-slate-400',
}

interface Props {
  data: CalibrationBreakdown
}

export default function CalibrationBar({ data }: Props) {
  return (
    <div>
      <div className="flex h-3 rounded-md overflow-hidden bg-slate-800">
        {data.segments.map(s => (
          <div
            key={s.key}
            className={`h-full ${TONE_BG[s.tone]} transition-[width] duration-500`}
            style={{ width: `${s.pct}%` }}
            aria-label={`${s.label}: ${s.pct}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2.5">
        {data.segments.map(s => (
          <div key={`lbl-${s.key}`} className="flex items-baseline gap-1.5">
            <span className={`text-sm font-medium tabular-nums ${TONE_TEXT[s.tone]}`}>{s.pct}%</span>
            <span className={`text-[11px] ${TONE_TEXT[s.tone]} opacity-80`}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
