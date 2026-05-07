'use client'

import { Alert } from '@/lib/api'

const typeConfig: Record<string, { icon: string; bgClass: string }> = {
  streak_risk:     { icon: '!',  bgClass: 'border-l-amber-500 bg-amber-950/20' },
  low_mastery:     { icon: '!',  bgClass: 'border-l-red-500 bg-red-950/20' },
  behind_schedule: { icon: '!',  bgClass: 'border-l-red-500 bg-red-950/20' },
  review_due:      { icon: 'R',  bgClass: 'border-l-blue-500 bg-blue-950/20' },
  milestone:       { icon: '*',  bgClass: 'border-l-green-500 bg-green-950/20' },
}

export default function AlertsBanner({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const cfg = typeConfig[alert.alert_type] || typeConfig.review_due
        return (
          <div
            key={alert.id}
            className={`border-l-4 rounded-r-lg p-3 flex items-start gap-3 ${cfg.bgClass}`}
          >
            <span className="w-6 h-6 rounded-full bg-surface-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {cfg.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200">{alert.title}</p>
              {alert.body && (
                <p className="text-xs text-slate-400 mt-0.5">{alert.body}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
