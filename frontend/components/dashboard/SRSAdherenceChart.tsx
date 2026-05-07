'use client'

import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js'
import Card from '@/components/ui/Card'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

interface Props {
  srsWeeks: Array<{ week: string; adherence: number }>
}

export default function SRSAdherenceChart({ srsWeeks }: Props) {
  const data = {
    labels: srsWeeks.map(s => s.week),
    datasets: [
      {
        data: srsWeeks.map(s => s.adherence),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168,85,247,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#a855f7',
        borderWidth: 2,
      },
      {
        data: srsWeeks.map(() => 80),
        borderColor: 'rgba(34,197,94,0.3)',
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
      y: { min: 50, max: 100, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#475569', font: { size: 9 }, callback: (v: unknown) => `${v}%` } },
    },
  }

  return (
    <Card header="Adherence SRS">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500" /> Adherence
        </span>
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <span className="w-3 h-0.5 bg-emerald-500/30 rounded" /> Goal 80%
        </span>
      </div>
      <div className="h-[160px]">
        <Line data={data} options={options as never} />
      </div>
    </Card>
  )
}
