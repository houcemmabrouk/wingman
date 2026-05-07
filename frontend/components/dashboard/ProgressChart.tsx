'use client'

import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js'
import Card from '@/components/ui/Card'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

interface Props {
  sessions: Array<{ session: number; score: number }>
}

export default function ProgressChart({ sessions }: Props) {
  const data = {
    labels: sessions.map(s => `S${s.session}`),
    datasets: [
      {
        data: sessions.map(s => s.score),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#3b82f6',
        borderWidth: 2,
      },
      {
        data: sessions.map(() => 70),
        borderColor: 'rgba(239,68,68,0.4)',
        borderDash: [6, 4],
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e2030', titleColor: '#e2e8f0', bodyColor: '#94a3b8' } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 10 } } },
      y: { min: 30, max: 100, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#475569', font: { size: 10 }, callback: (v: unknown) => `${v}%` } },
    },
  }

  return (
    <Card header="Overall Progress">
      <div className="flex items-center gap-4 mb-2">
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <span className="w-3 h-0.5 bg-blue-500 rounded" /> Score
        </span>
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <span className="w-3 h-0.5 bg-red-500/40 rounded border-dashed" /> MPS 70%
        </span>
      </div>
      <div className="h-[200px]">
        <Line data={data} options={options as never} />
      </div>
    </Card>
  )
}
