'use client'

import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js'
import Card from '@/components/ui/Card'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

export default function FatigueCurve({ curve }: { curve: number[] }) {
  const labels = curve.map((_, i) => i === 0 ? 'Debut' : i === curve.length - 1 ? 'Fin' : `${i * 15}m`)

  const data = {
    labels,
    datasets: [
      {
        data: curve,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#f59e0b',
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e2030' } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 9 } } },
      y: { min: 40, max: 100, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#475569', font: { size: 9 }, callback: (v: unknown) => `${v}%` } },
    },
  }

  return (
    <Card header="Fatigue Curve">
      <p className="text-[10px] text-slate-500 mb-2">Cognitive efficiency throughout the session</p>
      <div className="h-[160px]">
        <Line data={data} options={options as never} />
      </div>
    </Card>
  )
}
