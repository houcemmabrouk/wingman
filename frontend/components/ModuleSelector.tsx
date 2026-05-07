'use client'

import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const TOPIC_COLORS: Record<string, string> = {
  ETH: '#DC2626', QM: '#7C3AED', ECO: '#059669', FSA: '#D4537E', FRA: '#D4537E',
  CORP: '#EA580C', CF: '#EA580C', EQU: '#2563EB', EQ: '#2563EB',
  FI: '#0891B2', DER: '#65A30D', ALT: '#D97706', AI: '#D97706', PM: '#6B7280',
}

const SELECT_STYLE: React.CSSProperties = {
  background: '#1a2540',
  border: '1px solid #2a3560',
  color: '#f5f7ff',
  paddingRight: '36px',
}

interface Module {
  id: number; code: string; title: string
  question_count: number; flashcard_count: number
  mastery_level: number | null; last_studied: string | null
}

interface Topic {
  id: number; code: string; name: string; weight_pct: number; modules: Module[]
}

interface Props {
  userId?: string
  selectedModuleId: number | null
  onSelect: (moduleId: number, moduleCode: string) => void
  showMastery?: boolean
  initialTopicCode?: string
}

export default function ModuleSelector({ userId, selectedModuleId, onSelect, showMastery = true, initialTopicCode }: Props) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/modules`, { credentials: 'include' }).then(r => r.json()).then(d => {
      const t = d.topics || []
      setTopics(t)
      if (initialTopicCode && t.length) {
        const match = t.find((tp: Topic) => tp.code === initialTopicCode)
        if (match) setSelectedTopicId(match.id)
      }
    }).catch(() => {})
  }, [userId, initialTopicCode])

  const selectedTopic = topics.find(t => t.id === selectedTopicId)
  const modules = selectedTopic?.modules || []

  const handleTopicChange = (topicId: number | null) => {
    setSelectedTopicId(topicId)
    onSelect(0, '')
  }

  const handleModuleChange = (moduleId: number) => {
    const m = modules.find(mod => mod.id === moduleId)
    if (m) onSelect(m.id, m.code)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Topic</label>
        <select
          value={selectedTopicId ?? ''}
          onChange={e => handleTopicChange(e.target.value ? Number(e.target.value) : null)}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
          style={SELECT_STYLE}
        >
          <option value="" style={{ background: '#1a2540' }}>Select a Topic</option>
          {topics.map(t => (
            <option key={t.id} value={t.id} style={{ background: '#1a2540' }}>{t.code} — {t.name} ({t.weight_pct}%)</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Learning Module</label>
        <select
          value={selectedModuleId || ''}
          onChange={e => e.target.value && handleModuleChange(Number(e.target.value))}
          disabled={!selectedTopicId}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={SELECT_STYLE}
        >
          <option value="" style={{ background: '#1a2540' }}>Select a Learning Module</option>
          {modules.map(m => (
            <option key={m.id} value={m.id} style={{ background: '#1a2540' }}>
              {m.code} — {m.title} ({m.question_count}q{showMastery && m.mastery_level != null ? ` · ${Math.round(m.mastery_level)}%` : ''})
            </option>
          ))}
        </select>
      </div>

      {selectedModuleId && (() => {
        const m = modules.find(mod => mod.id === selectedModuleId)
        if (!m) return null
        const color = TOPIC_COLORS[selectedTopic?.code || ''] || '#6B7280'
        const mastery = m.mastery_level
        const masteryColor = mastery != null ? (mastery >= 75 ? '#22c55e' : mastery >= 60 ? '#f59e0b' : '#ef4444') : '#475569'
        return (
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(108,140,255,.06)', border: '1px solid rgba(108,140,255,.15)' }}>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: color }}>{selectedTopic?.code}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-white truncate">{m.title}</div>
              <div className="text-[10px] text-slate-500 font-mono">{m.code}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] text-slate-500">{m.question_count}q · {m.flashcard_count}f</div>
              {showMastery && mastery != null && (
                <div className="text-[12px] font-bold" style={{ color: masteryColor }}>{Math.round(mastery)}%</div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
