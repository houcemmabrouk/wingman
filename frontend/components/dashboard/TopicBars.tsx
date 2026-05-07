'use client'

import Card from '@/components/ui/Card'

interface TopicScore {
  code: string
  name: string
  score: number
  weight: number
  status: 'strong' | 'adequate' | 'weak'
}

function barColor(score: number) {
  if (score >= 75) return 'bg-emerald-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

export default function TopicBars({ topics }: { topics: TopicScore[] }) {
  return (
    <Card header="Scores par topic" className="relative">
      <div className="space-y-2">
        {topics.map(t => (
          <div key={t.code} className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 w-8 text-right">{t.code}</span>
            <div className="flex-1 relative h-5 bg-white/[0.03] rounded overflow-hidden">
              {/* MPS line at 70% */}
              <div className="absolute left-[70%] top-0 bottom-0 w-px bg-red-500/40 z-10" />
              <div
                className={`h-full rounded transition-all duration-700 ${barColor(t.score)}`}
                style={{ width: `${t.score}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-medium text-slate-300 w-10 text-right tabular-nums">
              {t.score}%
            </span>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/[0.04]">
        <span className="text-[9px] text-slate-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500/40" /> MPS 70%
        </span>
        <span className="text-[9px] text-slate-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> &ge;75
        </span>
        <span className="text-[9px] text-slate-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 60-74
        </span>
        <span className="text-[9px] text-slate-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> &lt;60
        </span>
      </div>
    </Card>
  )
}
