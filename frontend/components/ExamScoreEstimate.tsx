'use client'

interface ExamScoreEstimateProps {
  estimatedScore: number
  mockCount: number
}

export default function ExamScoreEstimate({ estimatedScore, mockCount }: ExamScoreEstimateProps) {
  const color = estimatedScore >= 70 ? 'text-green-400' : estimatedScore >= 60 ? 'text-amber-400' : 'text-red-400'
  const barColor = estimatedScore >= 70 ? 'bg-green-500' : estimatedScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
  const pct = Math.min(100, (estimatedScore / 100) * 100)
  const mpsPct = 70

  return (
    <div className="card text-center !p-3">
      <h2 className="card-header !text-[10px] !mb-1">Score estime exam</h2>
      <p className={`text-2xl font-bold ${color} leading-none`}>{estimatedScore}%</p>
      <p className="text-[10px] text-slate-500 mb-2">
        +/- 4 pts · {mockCount} mock{mockCount !== 1 ? 's' : ''}
      </p>
      <div className="relative w-full bg-surface-700 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
        <div className="absolute top-0 h-1.5 w-0.5 bg-amber-400" style={{ left: `${mpsPct}%` }} />
      </div>
      <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
        <span>0</span>
        <span className="text-amber-400">MPS 70</span>
        <span>100</span>
      </div>
    </div>
  )
}
