'use client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Alert {
  id: number
  alert_type: string
  title: string
  body: string | null
  created_at: string
}

const typeIcon: Record<string, { icon: string; cls: string }> = {
  streak_risk:     { icon: '!', cls: 'bg-amber-900/50 text-amber-400' },
  low_mastery:     { icon: 'W', cls: 'bg-red-900/50 text-red-400' },
  behind_schedule: { icon: 'D', cls: 'bg-red-900/50 text-red-400' },
  review_due:      { icon: 'R', cls: 'bg-blue-900/50 text-blue-400' },
  milestone:       { icon: '*', cls: 'bg-green-900/50 text-green-400' },
}

export default function AlertsFeed({ alerts, onDismiss }: { alerts: Alert[]; onDismiss?: (id: number) => void }) {
  const handleDismiss = async (id: number) => {
    try {
      await fetch(`${API_URL}/api/alerts/${id}/read`, { method: 'POST', credentials: 'include' })
      onDismiss?.(id)
    } catch { /* ignore */ }
  }

  if (alerts.length === 0) {
    return (
      <div className="card">
        <h2 className="card-header">Alerts</h2>
        <p className="text-sm text-slate-500 text-center py-4">No active alerts</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="card-header">Alerts ({alerts.length})</h2>
      <div className="space-y-2 max-h-[350px] overflow-y-auto">
        {alerts.map((a) => {
          const cfg = typeIcon[a.alert_type] || typeIcon.review_due
          return (
            <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg bg-surface-700/50">
              <span className={`w-7 h-7 rounded-full ${cfg.cls} flex items-center justify-center text-xs font-bold shrink-0`}>
                {cfg.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200">{a.title}</p>
                {a.body && <p className="text-xs text-slate-500 mt-0.5 truncate">{a.body}</p>}
              </div>
              <button
                onClick={() => handleDismiss(a.id)}
                className="text-xs text-slate-500 hover:text-white shrink-0"
              >
                Lu
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
