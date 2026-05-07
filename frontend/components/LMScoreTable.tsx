'use client'

import { useState } from 'react'

interface LMScore {
  module_code: string
  module_title: string
  avg_score: number
  attempt_count: number
  topic_code: string
}

const masteryBadge = (score: number) => {
  if (score >= 80) return { label: 'Strong', cls: 'badge-green' }
  if (score >= 60) return { label: 'Adequate', cls: 'badge-amber' }
  return { label: 'Weak', cls: 'badge-red' }
}

type SortKey = 'module_code' | 'avg_score' | 'attempt_count'

export default function LMScoreTable({ scores }: { scores: LMScore[] }) {
  const [sortBy, setSortBy] = useState<SortKey>('avg_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortDir('desc')
    }
  }

  const sorted = [...scores].sort((a, b) => {
    const va = a[sortBy]
    const vb = b[sortBy]
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
    return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
  })

  const arrow = (key: SortKey) => sortBy === key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''

  return (
    <div className="card">
      <h2 className="card-header">Scores by Module</h2>
      {scores.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No performance recorded</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-surface-600">
                <th className="pb-2 cursor-pointer hover:text-white" onClick={() => handleSort('module_code')}>
                  Module{arrow('module_code')}
                </th>
                <th className="pb-2">Title</th>
                <th className="pb-2 cursor-pointer hover:text-white text-right" onClick={() => handleSort('avg_score')}>
                  Avg Score{arrow('avg_score')}
                </th>
                <th className="pb-2 cursor-pointer hover:text-white text-right" onClick={() => handleSort('attempt_count')}>
                  Attempts{arrow('attempt_count')}
                </th>
                <th className="pb-2 text-right">Mastery</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => {
                const badge = masteryBadge(s.avg_score)
                return (
                  <tr key={s.module_code} className="border-b border-surface-700 hover:bg-surface-700/50">
                    <td className="py-2 font-mono text-accent-blue">{s.module_code}</td>
                    <td className="py-2 text-slate-300 truncate max-w-[200px]">{s.module_title}</td>
                    <td className="py-2 text-right font-mono">{s.avg_score.toFixed(1)}%</td>
                    <td className="py-2 text-right">{s.attempt_count}</td>
                    <td className="py-2 text-right"><span className={badge.cls}>{badge.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
