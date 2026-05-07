'use client'

import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js'
import Card from '@/components/ui/Card'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

interface Props {
  projection: Array<{ label: string; score: number | null }>
}

export default function ProjectionChart({ projection }: Props) {
  const pastData = projection.map(p => p.score)
  const futureIdx = projection.findIndex(p => p.label === 'Auj.')

  // Build projected line (dashed from today)
  const projected = projection.map((p, i) => {
    if (i < futureIdx) return null
    if (p.score !== null) return p.score
    // Linear extrapolation
    const last = projection[futureIdx]?.score ?? 68
    const delta = (last - (projection[0]?.score ?? 52)) / futureIdx
    return Math.round(last + delta * (i - futureIdx))
  })

  const data = {
    labels: projection.map(p => p.label),
    datasets: [
      {
        label: 'Reel',
        data: pastData,
        borderColor: '#3b82f6',
        pointBackgroundColor: '#3b82f6',
        pointRadius: 3,
        borderWidth: 2,
        tension: 0.3,
        spanGaps: false,
      },
      {
        label: 'Projection',
        data: projected,
        borderColor: 'rgba(34,197,94,0.6)',
        borderDash: [6, 3],
        pointBackgroundColor: 'rgba(34,197,94,0.6)',
        pointRadius: 2,
        borderWidth: 2,
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: 'MPS',
        data: projection.map(() => 70),
        borderColor: 'rgba(239,68,68,0.3)',
        borderDash: [4, 4],
        borderWidth: 1,
        pointRadius: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e2030' } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 9 } } },
      y: { min: 40, max: 90, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#475569', font: { size: 9 }, callback: (v: unknown) => `${v}%` } },
    },
  }

  return (
    <Card header="Projection J-exam">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <span className="w-3 h-0.5 bg-blue-500 rounded" /> Reel
        </span>
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <span className="w-3 h-0.5 bg-emerald-500/60 rounded" /> Projection
        </span>
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <span className="w-3 h-0.5 bg-red-500/30 rounded" /> MPS
        </span>
      </div>
      <div className="h-[160px]">
        <Line data={data} options={options as never} />
      </div>
    </Card>
  )
}
