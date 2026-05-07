'use client'

import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface Alert {
  id: string
  type: 'weakness' | 'regression' | 'delay' | 'srs' | 'info'
  severity: 'critical' | 'warning' | 'info'
  title: string
  body: string
}

const dotColor: Record<string, string> = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
}

const badgeVariant: Record<string, 'red' | 'orange' | 'blue' | 'purple'> = {
  weakness: 'red',
  regression: 'purple',
  delay: 'orange',
  srs: 'blue',
  info: 'blue',
}

export default function AlertsFeed({ alerts }: { alerts: Alert[] }) {
  return (
    <Card header="Active Alerts" className="max-h-[320px] overflow-y-auto">
      {alerts.length === 0 ? (
        <p className="text-xs text-slate-600 text-center py-6">No alerts</p>
      ) : (
        <div className="space-y-2">
          {alerts.slice(0, 5).map(a => (
            <div key={a.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor[a.severity]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[13px] text-slate-200 font-medium truncate">{a.title}</p>
                  <Badge label={a.type} variant={badgeVariant[a.type]} />
                </div>
                <p className="text-[11px] text-slate-500 truncate">{a.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
