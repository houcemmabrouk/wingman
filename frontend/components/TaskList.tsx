'use client'

import { PlanTask } from '@/lib/api'

const statusConfig: Record<string, { label: string; class: string }> = {
  pending:     { label: 'To do',      class: 'badge bg-slate-700 text-slate-300' },
  in_progress: { label: 'In progress', class: 'badge-amber' },
  completed:   { label: 'Done',      class: 'badge-green' },
  skipped:     { label: 'Skipped',   class: 'badge bg-slate-700 text-slate-500' },
}

export default function TaskList({ tasks }: { tasks: PlanTask[] }) {
  if (tasks.length === 0) {
    return (
      <div className="card">
        <h2 className="card-header">Daily Plan</h2>
        <p className="text-sm text-slate-500 text-center py-6">
          No tasks scheduled today
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="card-header">Daily Plan</h2>
      <ul className="space-y-2">
        {tasks.map((task) => {
          const cfg = statusConfig[task.status] || statusConfig.pending
          return (
            <li
              key={task.id}
              className="flex items-center justify-between p-3 rounded-lg bg-surface-700/50 hover:bg-surface-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-accent-blue shrink-0">
                  {task.module_code}
                </span>
                <span className="text-sm text-slate-200 truncate">
                  {task.module_title}
                </span>
              </div>
              <span className={cfg.class}>{cfg.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
