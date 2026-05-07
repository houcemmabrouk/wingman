'use client'

import { PlanTask } from '@/lib/api'

const statusStyles: Record<string, string> = {
  completed:   'line-through text-slate-500',
  in_progress: 'text-amber-400 font-medium',
  pending:     'text-slate-200',
  skipped:     'text-slate-600 line-through',
}

const statusIcon: Record<string, string> = {
  completed:   '\u2713',
  in_progress: '\u25B6',
  pending:     '\u25CB',
  skipped:     '\u2212',
}

interface PlanTimelineProps {
  entries: PlanTask[]
}

export default function PlanTimeline({ entries }: PlanTimelineProps) {
  // Group by date
  const grouped = entries.reduce<Record<string, PlanTask[]>>((acc, e) => {
    const d = e.scheduled_date
    if (!acc[d]) acc[d] = []
    acc[d].push(e)
    return acc
  }, {})

  const dates = Object.keys(grouped).sort()

  if (dates.length === 0) {
    return (
      <div className="card">
        <h2 className="card-header">Plan Timeline</h2>
        <p className="text-sm text-slate-500 text-center py-8">
          No active plan. Generate a plan to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="card-header">Plan Timeline</h2>
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {dates.map((dateStr) => {
          const isToday = dateStr === new Date().toISOString().split('T')[0]
          return (
            <div key={dateStr}>
              <div className={`text-xs font-mono mb-1 ${isToday ? 'text-accent-blue font-bold' : 'text-slate-500'}`}>
                {isToday ? 'Today' : dateStr}
              </div>
              <ul className="space-y-1 ml-3 border-l border-surface-600 pl-3">
                {grouped[dateStr].map((task) => (
                  <li key={task.id} className="flex items-center gap-2">
                    <span className="text-xs w-4">{statusIcon[task.status] || '\u25CB'}</span>
                    <span className={`text-xs font-mono text-accent-blue ${task.status === 'completed' ? 'opacity-50' : ''}`}>
                      {task.module_code}
                    </span>
                    <span className={`text-sm truncate ${statusStyles[task.status] || ''}`}>
                      {task.module_title}
                    </span>
                    <span className="badge text-[10px] bg-surface-700 text-slate-400 ml-auto">
                      {task.topic_code}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
