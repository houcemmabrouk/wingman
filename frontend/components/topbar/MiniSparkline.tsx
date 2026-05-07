'use client'

interface MiniSparklineProps {
  data: number[]
  width?: number
  height?: number
  color: string
  strokeWidth?: number
  fill?: boolean
}

/** Pure-SVG sparkline — no chart libs. */
export default function MiniSparkline({
  data,
  width = 50,
  height = 16,
  color,
  strokeWidth = 1.5,
  fill = false,
}: MiniSparklineProps) {
  if (!data || data.length === 0) return null

  const padding = 2
  const w = width
  const h = height
  const innerH = h - padding * 2
  const midY = h / 2

  // One-point or flat series → horizontal line at mid-height.
  if (data.length < 2) {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
        <line x1={padding} y1={midY} x2={w - padding} y2={midY}
              stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.5} />
      </svg>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const step = (w - padding * 2) / (data.length - 1)

  const points = data.map((v, i) => {
    const x = padding + i * step
    // Invert y because SVG origin is top-left.
    const y = padding + innerH - ((v - min) / span) * innerH
    return { x, y }
  })

  const linePoints = points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
  const gradId = `sparkgrad-${Math.round(Math.random() * 1e9)}`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden
         style={{ transition: 'opacity 200ms ease-in-out' }}>
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon
            points={`${padding},${h - padding} ${linePoints} ${w - padding},${h - padding}`}
            fill={`url(#${gradId})`}
          />
        </>
      )}
      <polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
