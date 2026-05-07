'use client'

interface CurvePoint {
  date: string
  avg_score: number
  sessions_count: number
}

export default function ProgressCurve({ data }: { data: CurvePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="card">
        <h2 className="card-header">Progress Curve</h2>
        <p className="text-sm text-slate-500 text-center py-8">
          No performance data. Complete sessions to see your curve.
        </p>
      </div>
    )
  }

  const maxScore = 100
  const chartHeight = 200
  const chartWidth = 600
  const padding = 40

  const points = data.map((d, i) => ({
    x: padding + (i / Math.max(data.length - 1, 1)) * (chartWidth - padding * 2),
    y: chartHeight - padding - (d.avg_score / maxScore) * (chartHeight - padding * 2),
    ...d,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const mpsY = chartHeight - padding - (70 / maxScore) * (chartHeight - padding * 2)

  return (
    <div className="card">
      <h2 className="card-header">Progress Curve</h2>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
        {/* Grid lines */}
        {[0, 25, 50, 70, 100].map(v => {
          const y = chartHeight - padding - (v / maxScore) * (chartHeight - padding * 2)
          return (
            <g key={v}>
              <line x1={padding} y1={y} x2={chartWidth - padding} y2={y}
                stroke="#272a3d" strokeWidth={v === 70 ? 1.5 : 0.5} />
              <text x={padding - 5} y={y + 4} textAnchor="end"
                fill="#64748b" fontSize="10">{v}%</text>
            </g>
          )
        })}

        {/* MPS line */}
        <line x1={padding} y1={mpsY} x2={chartWidth - padding} y2={mpsY}
          stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" />
        <text x={chartWidth - padding + 5} y={mpsY + 4}
          fill="#f59e0b" fontSize="9">MPS 70%</text>

        {/* Data line */}
        {points.length > 1 && (
          <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={2} />
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#3b82f6" />
            <text x={p.x} y={chartHeight - 10} textAnchor="middle"
              fill="#64748b" fontSize="8" transform={`rotate(-45 ${p.x} ${chartHeight - 10})`}>
              {p.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
