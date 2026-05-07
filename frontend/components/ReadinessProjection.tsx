'use client'

interface ReadinessProjectionProps {
  readinessDate: string | null
  avgScore: number
}

export default function ReadinessProjection({ readinessDate, avgScore }: ReadinessProjectionProps) {
  const isReady = avgScore >= 70

  return (
    <div className="card text-center !p-3">
      <h2 className="card-header !text-[10px] !mb-1">Projection readiness</h2>
      {isReady ? (
        <div>
          <span className="badge-green text-xs px-2.5 py-1">Goal reached</span>
          <p className="text-[10px] text-slate-400 mt-1.5">Avg {avgScore.toFixed(1)}% &ge; 70% MPS</p>
        </div>
      ) : readinessDate ? (
        <div>
          <p className="text-[11px] text-slate-300">At this pace, ready by</p>
          <p className="text-base font-bold text-accent-blue mt-0.5">{readinessDate}</p>
          <p className="text-[10px] text-slate-500 mt-1">Current: {avgScore.toFixed(1)}% · Target: 70%</p>
        </div>
      ) : (
        <div>
          <p className="text-[11px] text-slate-400">Not enough data</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Complete sessions to enable</p>
        </div>
      )}
    </div>
  )
}
