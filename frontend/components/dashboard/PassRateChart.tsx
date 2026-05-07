'use client'

import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import Card from '@/components/ui/Card'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

interface Props {
  mockScores: Array<{ mock: number; score: number; passRate: number }>
}

export default function PassRateChart({ mockScores }: Props) {
  const data = {
    labels: mockScores.map(m => `Mock ${m.mock}`),
    datasets: [
      {
        label: 'Score',
        data: mockScores.map(m => m.score),
        backgroundColor: mockScores.map(m => m.score >= 70 ? 'rgba(34,197,94,0.6)' : 'rgba(59,130,246,0.6)'),
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1e2030', titleColor: '#e2e8f0', bodyColor: '#94a3b8' },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 10 } } },
      y: {
        min: 30, max: 100,
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#475569', font: { size: 10 }, callback: (v: unknown) => `${v}%` },
      },
    },
  }

  return (
    <Card header="Mock exams">
      <div className="flex items-center gap-4 mb-2">
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-blue-500/60" /> &lt;70%
        </span>
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-emerald-500/60" /> &ge;70%
        </span>
      </div>
      <div className="h-[200px]">
        <Bar data={data} options={options as never} />
      </div>
    </Card>
  )
}
