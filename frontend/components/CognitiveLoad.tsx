'use client'

interface CognitiveLoadProps {
  todayMinutes: number
  goalMinutes: number
  sessionsCount: number
}

function getLoadLevel(todayMin: number, goalMin: number): { level: string; color: string; width: string; advice: string } {
  const ratio = goalMin > 0 ? todayMin / goalMin : 0
  if (ratio < 0.5) return { level: 'Low', color: 'bg-accent-green', width: `${Math.max(10, ratio * 100)}%`, advice: 'Available capacity — good time for difficult topics' }
  if (ratio < 0.8) return { level: 'Moderate', color: 'bg-accent-blue', width: `${ratio * 100}%`, advice: 'Optimal pace — keep going' }
  if (ratio < 1.0) return { level: 'High', color: 'bg-accent-amber', width: `${ratio * 100}%`, advice: 'Approaching limit — prioritize light review' }
  return { level: 'Overload', color: 'bg-accent-red', width: '100%', advice: 'Rest recommended — diminishing returns' }
}

export default function CognitiveLoad({ todayMinutes, goalMinutes, sessionsCount }: CognitiveLoadProps) {
  const load = getLoadLevel(todayMinutes, goalMinutes)

  return (
    <div className="card">
      <h2 className="card-header">Cognitive Load</h2>

      <div className="flex items-center gap-3 mb-3">
        <span className={`text-lg font-bold ${
          load.level === 'Overload' ? 'text-red-400' :
          load.level === 'High' ? 'text-amber-400' :
          load.level === 'Moderate' ? 'text-blue-400' : 'text-green-400'
        }`}>
          {load.level}
        </span>
        <span className="text-xs text-slate-500">
          {sessionsCount} session{sessionsCount !== 1 ? 's' : ''} today
        </span>
      </div>

      <div className="w-full bg-surface-700 rounded-full h-3 mb-3">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${load.color}`}
          style={{ width: load.width }}
        />
      </div>

      <p className="text-xs text-slate-400">{load.advice}</p>
    </div>
  )
}
