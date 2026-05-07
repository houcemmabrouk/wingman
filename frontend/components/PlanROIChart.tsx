'use client'

interface ROIEntry {
  module_code: string
  module_title: string
  roi: number
  topic_code: string
}

const topicColors: Record<string, string> = {
  ETH: '#a855f7', QM: '#3b82f6', ECO: '#22c55e', FRA: '#f59e0b',
  CF: '#ef4444', EQ: '#06b6d4', FI: '#f97316', DER: '#ec4899',
  AI: '#8b5cf6', PM: '#14b8a6',
}

export default function PlanROIChart({ entries }: { entries: ROIEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="card">
        <h2 className="card-header">ROI Score by Module</h2>
        <p className="text-sm text-slate-500 text-center py-6">No data</p>
      </div>
    )
  }

  const sorted = [...entries].sort((a, b) => b.roi - a.roi).slice(0, 15)
  const maxROI = Math.max(...sorted.map(e => e.roi), 1)

  return (
    <div className="card">
      <h2 className="card-header">ROI Score by Module</h2>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {sorted.map((e) => (
          <div key={e.module_code} className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 w-14 shrink-0">{e.module_code}</span>
            <div className="flex-1 bg-surface-700 rounded-full h-5 relative overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(e.roi / maxROI) * 100}%`,
                  backgroundColor: topicColors[e.topic_code] || '#6b7280',
                }}
              />
              <span className="absolute right-2 top-0 h-full flex items-center text-[10px] text-white font-mono">
                {e.roi.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-surface-600">
        {Object.entries(topicColors).map(([code, color]) => (
          <span key={code} className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {code}
          </span>
        ))}
      </div>
    </div>
  )
}
