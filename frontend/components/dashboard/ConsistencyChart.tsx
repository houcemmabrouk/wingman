'use client'

import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import Card from '@/components/ui/Card'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

interface Props {
  consistency: Array<{ topic: string; sigma: number }>
}

export default function ConsistencyChart({ consistency }: Props) {
  const data = {
    labels: consistency.map(c => c.topic),
    datasets: [
      {
        data: consistency.map(c => c.sigma),
        backgroundColor: consistency.map(c =>
          c.sigma <= 6 ? 'rgba(34,197,94,0.5)' :
          c.sigma <= 10 ? 'rgba(245,158,11,0.5)' :
          'rgba(239,68,68,0.5)'
        ),
        borderRadius: 3,
        barPercentage: 0.7,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e2030', callbacks: { label: (ctx: { parsed: { x: number } }) => `σ = ${ctx.parsed.x.toFixed(1)}` } } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#475569', font: { size: 9 } } },
      y: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
    },
  }

  return (
    <Card header="Consistance par topic">
      <p className="text-[10px] text-slate-500 mb-2">Ecart-type des scores (σ bas = stable)</p>
      <div className="h-[160px]">
        <Bar data={data} options={options as never} />
      </div>
    </Card>
  )
}
