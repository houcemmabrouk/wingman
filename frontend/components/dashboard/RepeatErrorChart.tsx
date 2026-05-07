'use client'

import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import Card from '@/components/ui/Card'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

interface Props {
  repeatErrors: Array<{ topic: string; rate: number }>
}

export default function RepeatErrorChart({ repeatErrors }: Props) {
  const sorted = [...repeatErrors].sort((a, b) => b.rate - a.rate)

  const data = {
    labels: sorted.map(r => r.topic),
    datasets: [
      {
        data: sorted.map(r => r.rate),
        backgroundColor: sorted.map(r =>
          r.rate >= 25 ? 'rgba(239,68,68,0.6)' :
          r.rate >= 15 ? 'rgba(245,158,11,0.5)' :
          'rgba(34,197,94,0.4)'
        ),
        borderRadius: 3,
        barPercentage: 0.65,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e2030', callbacks: { label: (ctx: { parsed: { y: number } }) => `${ctx.parsed.y}% repeated errors` } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#475569', font: { size: 9 }, callback: (v: unknown) => `${v}%` } },
    },
  }

  return (
    <Card header="Repeated Errors">
      <p className="text-[10px] text-slate-500 mb-2">% of questions failed more than once</p>
      <div className="h-[160px]">
        <Bar data={data} options={options as never} />
      </div>
    </Card>
  )
}
