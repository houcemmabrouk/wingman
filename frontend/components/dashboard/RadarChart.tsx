'use client'

import { Radar } from 'react-chartjs-2'
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js'
import Card from '@/components/ui/Card'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

interface Props {
  globalScore: number
  coverage: number
  streak: number
  projectedScore: number
  srsAdherence: number
  passRate: number
}

export default function RadarChartComponent({ globalScore, coverage, streak, projectedScore, srsAdherence, passRate }: Props) {
  // Normalize all values to 0-100
  const actual = [
    globalScore,            // Performance
    Math.min(100, srsAdherence), // Efficacite
    coverage,               // Couverture
    projectedScore,         // Prediction
    Math.min(100, streak * 5), // Cognition (streak proxy)
    passRate,               // Progression
  ]
  const target = [80, 85, 90, 75, 70, 80]

  const data = {
    labels: ['Performance', 'Efficiency', 'Coverage', 'Prediction', 'Cognition', 'Progress'],
    datasets: [
      {
        label: 'Current',
        data: actual,
        backgroundColor: 'rgba(59,130,246,0.15)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        pointBackgroundColor: '#3b82f6',
        pointRadius: 3,
      },
      {
        label: 'Target',
        data: target,
        backgroundColor: 'rgba(34,197,94,0.05)',
        borderColor: 'rgba(34,197,94,0.4)',
        borderDash: [4, 3],
        borderWidth: 1.5,
        pointRadius: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        min: 0, max: 100,
        ticks: { display: false, stepSize: 25 },
        grid: { color: 'rgba(255,255,255,0.04)' },
        angleLines: { color: 'rgba(255,255,255,0.04)' },
        pointLabels: { color: '#64748b', font: { size: 10 } },
      },
    },
  }

  return (
    <Card header="Radar competences">
      <div className="flex items-center gap-4 mb-2">
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> Current
        </span>
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500/40" /> Target
        </span>
      </div>
      <div className="h-[200px]">
        <Radar data={data} options={options as never} />
      </div>
    </Card>
  )
}
