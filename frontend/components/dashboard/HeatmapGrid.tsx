'use client'

import Card from '@/components/ui/Card'

interface LM {
  code: string
  topic: string
  score: number
}

function cellColor(score: number) {
  if (score >= 75) return 'bg-emerald-500/60'
  if (score >= 60) return 'bg-amber-500/50'
  if (score >= 40) return 'bg-orange-500/40'
  return 'bg-red-500/50'
}

export default function HeatmapGrid({ lmMastery }: { lmMastery: LM[] }) {
  // Group by topic for ordering
  const topics = ['ETH', 'QM', 'ECO', 'FSA', 'CORP', 'EQU', 'FI', 'DER', 'ALT', 'PM']
  const sorted = topics.flatMap(t => lmMastery.filter(lm => lm.topic === t))

  // Fill to 60 for grid layout (10 cols x 6 rows)
  const cells = [...sorted]
  while (cells.length < 60) cells.push({ code: '', topic: '', score: -1 })

  return (
    <Card header="Heatmap 66 LM">
      <div className="grid grid-cols-10 gap-1">
        {cells.map((lm, i) => (
          <div
            key={i}
            className={`aspect-square rounded-sm transition-all ${
              lm.score < 0 ? 'bg-transparent' : `${cellColor(lm.score)} hover:ring-1 hover:ring-white/20 cursor-default`
            }`}
            title={lm.code ? `${lm.code}: ${lm.score}%` : ''}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/[0.04]">
        <span className="text-[9px] text-slate-600 flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-red-500/50" /> &lt;40
        </span>
        <span className="text-[9px] text-slate-600 flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-orange-500/40" /> 40-59
        </span>
        <span className="text-[9px] text-slate-600 flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-amber-500/50" /> 60-74
        </span>
        <span className="text-[9px] text-slate-600 flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-emerald-500/60" /> &ge;75
        </span>
      </div>
    </Card>
  )
}
