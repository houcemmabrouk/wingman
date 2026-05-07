'use client'

import { useState } from 'react'
import { TOPIC_COLORS, TOPIC_ORDER } from '@/lib/lm-data'

interface HeatmapItem {
  lm_code: string
  lm_title: string
  topic: string
  mastery_level: number
  attempts: number
}

function cellColor(level: number): string {
  if (level >= 75) return 'bg-green-600'
  if (level >= 60) return 'bg-yellow-500'
  if (level >= 40) return 'bg-orange-500'
  if (level > 0)   return 'bg-red-500'
  return 'bg-surface-700'
}

function lmNumberLabel(lmCode: string): string {
  // 'LM01' → '01' ; 'ETH-LM01' → '01' ; '01_summary' → '01'
  const m = lmCode.match(/(\d{1,2})/)
  return m ? m[1] : lmCode.slice(0, 2)
}

interface HeatmapGridProps {
  items: HeatmapItem[]
  compact?: boolean
  onSelect?: (item: HeatmapItem) => void
  selectedCode?: string
}

export default function HeatmapGrid({ items, compact, onSelect, selectedCode }: HeatmapGridProps) {
  const [tooltip, setTooltip] = useState<string | null>(null)
  const size = compact ? 'w-5 h-5 text-[8px]' : 'w-7 h-7 text-[10px]'

  // Group by topic, sort by canonical topic order
  const byTopic = new Map<string, HeatmapItem[]>()
  for (const it of items) {
    if (!byTopic.has(it.topic)) byTopic.set(it.topic, [])
    byTopic.get(it.topic)!.push(it)
  }
  const orderedTopics = TOPIC_ORDER.filter(t => byTopic.has(t))
  // Append any unknown topics at the end (shouldn't happen, but safe)
  for (const t of byTopic.keys()) if (!orderedTopics.includes(t)) orderedTopics.push(t)

  // Sort LMs within each row by code (LM01 first)
  for (const lms of byTopic.values()) {
    lms.sort((a, b) => a.lm_code.localeCompare(b.lm_code))
  }

  const totalLMs = items.length
  const overallAvg = totalLMs > 0 ? items.reduce((s, i) => s + i.mastery_level, 0) / totalLMs : 0

  return (
    <div className="card">
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <h2 className="card-header !mb-0">Heatmap Mastery — {totalLMs} LM</h2>
          <span className="text-[11px] text-slate-500">
            Overall avg: <span className="font-semibold text-white tabular-nums">{overallAvg.toFixed(0)}%</span>
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        {orderedTopics.map(topic => {
          const lms = byTopic.get(topic)!
          const avg = lms.reduce((s, i) => s + i.mastery_level, 0) / lms.length
          const color = TOPIC_COLORS[topic] || '#64748b'
          return (
            <div key={topic} className="flex items-center gap-3">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded text-white tabular-nums shrink-0"
                style={{ background: color, minWidth: 44, textAlign: 'center' }}
              >
                {topic}
              </span>
              <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                {lms.map(item => {
                  const isSelected = selectedCode === item.lm_code
                  const baseCls = `${size} rounded ${cellColor(item.mastery_level)} cursor-pointer transition-transform flex items-center justify-center font-bold text-white/80`
                  const stateCls = isSelected
                    ? 'ring-2 ring-white scale-125 z-10 relative'
                    : 'hover:scale-125'
                  return (
                    <div
                      key={item.lm_code}
                      role={onSelect ? 'button' : undefined}
                      tabIndex={onSelect ? 0 : undefined}
                      className={`${baseCls} ${stateCls}`}
                      onClick={() => onSelect?.(item)}
                      onKeyDown={onSelect ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(item) } } : undefined}
                      onMouseEnter={() => setTooltip(`${item.lm_code}: ${item.lm_title} — ${item.mastery_level.toFixed(0)}%`)}
                      onMouseLeave={() => setTooltip(null)}
                      title={`${item.lm_code}: ${item.mastery_level.toFixed(0)}% (${item.attempts} attempts)`}
                    >
                      {!compact && lmNumberLabel(item.lm_code)}
                    </div>
                  )
                })}
              </div>
              <span className="text-[10px] text-slate-500 tabular-nums shrink-0 w-10 text-right">
                {avg.toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>

      {tooltip && !compact && (
        <p className="text-[11px] text-slate-400 mt-3 truncate">{tooltip}</p>
      )}

      {!compact && (
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/[0.04] text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-surface-700" />0%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" />1-39%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500" />40-59%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500" />60-74%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-600" />75-100%</span>
        </div>
      )}
    </div>
  )
}
