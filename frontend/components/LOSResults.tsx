'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  fetchModules,
  fetchLosMastery,
  type TopicRow,
  type ModuleRow,
  type LosOutcome,
} from '@/lib/wingmanApi'

function pct(n: number) { return Math.round(n * 100) }

function pctBadge(p: number, attempts: number) {
  if (attempts === 0) {
    return <span className="inline-block px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-white/[0.05] text-slate-500">—</span>
  }
  const cls = p >= 70 ? 'bg-emerald-500/12 text-emerald-400'
    : p >= 50 ? 'bg-amber-500/12 text-amber-400'
    : 'bg-red-500/12 text-red-400'
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-[12px] font-bold ${cls}`}>{p}%</span>
}

function statusFor(o: LosOutcome): { label: string; cls: string } {
  if (o.attempts_total === 0) return { label: 'Not Started', cls: 'bg-white/[0.06] text-slate-500' }
  const p = pct(o.mastery)
  if (p >= 70) return { label: 'Mastered',    cls: 'bg-emerald-500/12 text-emerald-400' }
  if (p >= 50) return { label: 'In Progress', cls: 'bg-blue-500/12 text-blue-400' }
  return                  { label: 'Weak',        cls: 'bg-red-500/12 text-red-400' }
}

export default function LOSResults() {
  const [topics, setTopics] = useState<TopicRow[]>([])
  const [topicCode, setTopicCode] = useState('')
  const [moduleId, setModuleId] = useState<number | null>(null)
  const [outcomes, setOutcomes] = useState<LosOutcome[] | null>(null)
  const [loadingOutcomes, setLoadingOutcomes] = useState(false)

  // Bootstrap: fetch all modules with backend IDs (was hardcoded mock before).
  useEffect(() => { fetchModules().then(setTopics) }, [])

  const onTopicChange = useCallback((val: string) => {
    setTopicCode(val); setModuleId(null); setOutcomes(null)
  }, [])

  // Fetch outcomes when a module is picked.
  useEffect(() => {
    if (moduleId == null) { setOutcomes(null); return }
    setLoadingOutcomes(true); setOutcomes(null)
    fetchLosMastery(moduleId)
      .then(setOutcomes)
      .finally(() => setLoadingOutcomes(false))
  }, [moduleId])

  const currentTopic = useMemo(() => topics.find(t => t.code === topicCode) || null, [topics, topicCode])
  const currentModule: ModuleRow | null = useMemo(
    () => currentTopic?.modules.find(m => m.id === moduleId) || null,
    [currentTopic, moduleId],
  )

  const summary = useMemo(() => {
    if (!outcomes || outcomes.length === 0) return null
    const totalQ = outcomes.reduce((s, o) => s + o.attempts_total, 0)
    const totalCorrect = outcomes.reduce((s, o) => s + o.attempts_correct, 0)
    const overall = totalQ > 0 ? Math.round(totalCorrect / totalQ * 100) : 0
    const attempted = outcomes.filter(o => o.attempts_total > 0).length
    return { overall, totalQ, attempted, total: outcomes.length }
  }, [outcomes])

  const barColor = summary ? (summary.overall >= 70 ? '#00e0b8' : summary.overall >= 50 ? '#f0a500' : '#e05c5c') : '#6c8cff'

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <select
          value={topicCode}
          onChange={e => onTopicChange(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white min-w-[260px] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          style={{ background: '#1a2540', border: '1px solid #2a3560' }}
        >
          <option value="">Select a Topic</option>
          {topics.map(t => <option key={t.code} value={t.code}>{t.code} — {t.name}</option>)}
        </select>
        <select
          value={moduleId ?? ''}
          onChange={e => setModuleId(e.target.value ? Number(e.target.value) : null)}
          disabled={!currentTopic}
          className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white min-w-[320px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-40"
          style={{ background: '#1a2540', border: '1px solid #2a3560' }}
        >
          <option value="">Select a Learning Module</option>
          {currentTopic?.modules.map(m => <option key={m.id} value={m.id}>{m.code} — {m.title}</option>)}
        </select>
      </div>

      {currentModule && summary && (
        <div className="flex items-center gap-6 p-4 rounded-xl flex-wrap" style={{ background: '#1a2540', border: '1px solid #2a3560' }}>
          <div>
            <div className="text-[14px] font-bold text-white">{currentModule.title}</div>
            <div className="text-[12px] font-mono" style={{ color: '#6c8cff' }}>{currentModule.code}</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-extrabold tabular-nums" style={{ color: barColor }}>{summary.overall}%</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500">Overall</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-extrabold text-white tabular-nums">{summary.totalQ}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500">Questions</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-extrabold text-white tabular-nums">{summary.attempted}/{summary.total}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500">LOS</div>
          </div>
          <div className="flex-1 max-w-[240px] min-w-[120px]">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${summary.overall}%`, background: barColor }} />
            </div>
          </div>
        </div>
      )}

      {!currentModule && (
        <div className="text-center py-16 text-[13px] text-slate-500">
          Select a Topic and Learning Module above to view LOS results.
        </div>
      )}

      {currentModule && loadingOutcomes && (
        <div className="text-center py-12 text-[13px] text-slate-500">Loading LOS data…</div>
      )}

      {currentModule && outcomes && outcomes.length === 0 && (
        <div className="text-center py-16 rounded-xl" style={{ background: '#1a2540', border: '1px solid #2a3560' }}>
          <div className="text-[14px] font-semibold text-slate-300 mb-1">No learning outcomes registered for this module</div>
          <div className="text-[12px] text-slate-500">Curriculum data not yet seeded — try another module.</div>
        </div>
      )}

      {currentModule && outcomes && outcomes.length > 0 && summary && summary.totalQ === 0 && (
        <div className="text-center py-16 rounded-xl" style={{ background: '#1a2540', border: '1px solid #2a3560' }}>
          <div className="text-[14px] font-semibold text-slate-300 mb-1">No attempts yet on this module</div>
          <div className="text-[12px] text-slate-500">Start a session on <span className="font-mono text-blue-400">{currentModule.code}</span> to see per-LOS mastery here.</div>
        </div>
      )}

      {currentModule && outcomes && outcomes.length > 0 && summary && summary.totalQ > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ background: '#1a2540', border: '1px solid #2a3560' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #2a3560' }}>
                {['LOS Code','Description','Attempts','% Correct','Bloom','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8892b0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outcomes.map((o, i) => {
                const p = pct(o.mastery)
                const st = statusFor(o)
                return (
                  <tr key={o.code} className="hover:bg-white/[0.03] transition-colors" style={{ background: i % 2 === 0 ? '#1a2540' : '#1e2b50' }}>
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold" style={{ color: '#6c8cff' }}>{o.code}</td>
                    <td className="px-4 py-3 text-[13px] text-white max-w-[400px]">{o.description}</td>
                    <td className="px-4 py-3 text-[13px] text-white tabular-nums">{o.attempts_correct}/{o.attempts_total}</td>
                    <td className="px-4 py-3">{pctBadge(p, o.attempts_total)}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-500 tabular-nums">L{o.bloom_level}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                    </td>
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
