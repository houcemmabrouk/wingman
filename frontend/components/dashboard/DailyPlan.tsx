'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface Task {
  id: string
  title: string
  lm: string
  minutes: number
  type: string
  completed: boolean
  active: boolean
}

const typeBadge: Record<string, 'blue' | 'green' | 'orange' | 'purple'> = {
  review: 'blue',
  qcm: 'green',
  srs: 'purple',
  study: 'orange',
  mock: 'red' as 'orange',
}

interface Props {
  tasks: Task[]
  streakDays: boolean[]
}

export default function DailyPlan({ tasks, streakDays }: Props) {
  const [items, setItems] = useState(tasks)
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const toggle = async (id: string) => {
    try {
      await fetch(`${API}/api/plan/entry/${id}/complete`, { method: 'POST', credentials: 'include' })
    } catch { /* ignore */ }
    setItems(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed, active: false } : t))
  }

  return (
    <Card header="Daily Plan">
      <div className="space-y-1.5 mb-4">
        {items.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
              t.active ? 'bg-blue-500/10 border border-blue-500/20' :
              t.completed ? 'bg-white/[0.01]' : 'bg-white/[0.02]'
            }`}
          >
            <button
              onClick={() => toggle(t.id)}
              className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                t.completed
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-slate-600 hover:border-slate-400'
              }`}
            >
              {t.completed && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] truncate ${t.completed ? 'text-slate-600 line-through' : 'text-slate-200'}`}>
                {t.title}
              </p>
            </div>
            <Badge label={t.type} variant={typeBadge[t.type] || 'blue'} />
            <span className="text-[10px] text-slate-600 tabular-nums w-10 text-right">{t.minutes}m</span>
          </div>
        ))}
      </div>

      {/* Streak dots */}
      <div className="pt-3 border-t border-white/[0.04]">
        <p className="text-[10px] text-slate-600 mb-2">21-day Streak</p>
        <div className="flex gap-1">
          {streakDays.map((active, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-white/[0.06]'}`}
              title={`Day ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
