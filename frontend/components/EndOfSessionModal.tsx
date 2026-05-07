'use client'

import { useEffect, useMemo, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface TodayBlockLite {
  order: number
  topic_code: string
  lm_code?: string
  activity: string
  minutes: number
}

interface BlockState extends TodayBlockLite {
  done: boolean
}

type Rag = 'red' | 'amber' | 'green' | 'unset'

interface LosEntry {
  lm_code: string
  los_code: string
  los_description: string
  rag: Rag
}

interface Props {
  open: boolean
  onClose: () => void
  blocks: TodayBlockLite[]
  onSaved?: (result: { id: number; pdf_url: string }) => void
}

const RAG_COLORS: Record<Rag, { bg: string; text: string; border: string; label: string }> = {
  red:   { bg: 'rgba(239,68,68,0.15)',  text: '#F87171', border: '#F87171', label: '🔴 Redo' },
  amber: { bg: 'rgba(245,158,11,0.15)', text: '#FBBF24', border: '#FBBF24', label: '🟡 Unstable' },
  green: { bg: 'rgba(34,197,94,0.15)',  text: '#4ADE80', border: '#4ADE80', label: '🟢 Mastered' },
  unset: { bg: 'rgba(100,116,139,0.10)', text: '#94A3B8', border: 'transparent', label: '— Not rated' },
}

export default function EndOfSessionModal({ open, onClose, blocks, onSaved }: Props) {
  const [blockStates, setBlockStates] = useState<BlockState[]>([])
  const [los, setLos] = useState<LosEntry[]>([])
  const [notes, setNotes] = useState('')
  const [energy, setEnergy] = useState<number>(3)
  const [confidence, setConfidence] = useState<number>(3)
  const [minutesActual, setMinutesActual] = useState<number>(0)
  const [loadingLos, setLoadingLos] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lmCodes = useMemo(() => {
    const set = new Set<string>()
    for (const b of blocks) if (b.lm_code) set.add(b.lm_code)
    return Array.from(set)
  }, [blocks])

  // Hydrate blocks whenever the modal opens
  useEffect(() => {
    if (!open) return
    setBlockStates(blocks.map(b => ({ ...b, done: false })))
    setMinutesActual(blocks.reduce((s, b) => s + b.minutes, 0))
    setNotes('')
    setError(null)
  }, [open, blocks])

  // Fetch LOS context
  useEffect(() => {
    if (!open || lmCodes.length === 0) {
      setLos([])
      return
    }
    setLoadingLos(true)
    fetch(`${API}/api/sessions/checklist/context?lm_codes=${encodeURIComponent(lmCodes.join(','))}`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then((d: { los: { lm_code: string; los_code: string; description: string }[] }) => {
        setLos(d.los.map(l => ({
          lm_code: l.lm_code,
          los_code: l.los_code,
          los_description: l.description,
          rag: 'unset' as Rag,
        })))
      })
      .catch(() => setLos([]))
      .finally(() => setLoadingLos(false))
  }, [open, lmCodes])

  // Esc to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const toggleBlock = (order: number) => {
    setBlockStates(prev => prev.map(b => b.order === order ? { ...b, done: !b.done } : b))
  }

  const setRag = (los_code: string, rag: Rag) => {
    setLos(prev => prev.map(l => l.los_code === los_code ? { ...l, rag } : l))
  }

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        session_date: new Date().toISOString().slice(0, 10),
        blocks: blockStates.map(b => ({
          order: b.order,
          topic_code: b.topic_code,
          lm_code: b.lm_code,
          activity: b.activity,
          minutes_planned: b.minutes,
          done: b.done,
        })),
        los_mastery: los,
        notes,
        energy,
        confidence,
        minutes_actual: minutesActual,
      }
      const res = await fetch(`${API}/api/sessions/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      const result: { id: number; pdf_url: string } = await res.json()
      window.open(`${API}${result.pdf_url}`, '_blank')
      onSaved?.(result)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const doneCount = blockStates.filter(b => b.done).length
  const ragCounts = los.reduce<Record<Rag, number>>((acc, l) => {
    acc[l.rag] = (acc[l.rag] || 0) + 1
    return acc
  }, { red: 0, amber: 0, green: 0, unset: 0 })

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 md:p-8"
         onClick={onClose}>
      <div className="w-full max-w-3xl bg-surface-900 border border-white/[0.08] rounded-2xl shadow-2xl my-4"
           onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-bold text-white">End of Session</h2>
            <p className="text-xs text-slate-500 mt-1">Self-rate what you accomplished. Generates a PDF checklist + updates tomorrow's plan.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none px-2">×</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Blocks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Today's Blocks</h3>
              <span className="text-[11px] text-slate-500 tabular-nums">{doneCount}/{blockStates.length} done</span>
            </div>
            {blockStates.length > 0 && (
              <div className="h-1 w-full bg-white/[0.04] rounded-full mb-3 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-300"
                     style={{ width: `${(doneCount / blockStates.length) * 100}%` }} />
              </div>
            )}
            {blockStates.length === 0 ? (
              <p className="text-[12px] text-slate-500 italic">No planned blocks for today — you can still log your work in the notes below.</p>
            ) : (
              <div className="space-y-2">
                {blockStates.map(b => (
                  <label key={b.order}
                         className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                           b.done ? 'bg-emerald-500/[0.10] border-emerald-500/40' : 'bg-white/[0.02] border-transparent hover:bg-white/[0.04]'
                         }`}>
                    <input type="checkbox" checked={b.done} onChange={() => toggleBlock(b.order)}
                           className="w-4 h-4 accent-emerald-500" />
                    <span className="w-6 text-[11px] font-bold text-slate-600 text-right tabular-nums">{b.order}</span>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded text-white shrink-0 bg-indigo-500/70">
                      {b.topic_code}
                    </span>
                    {b.lm_code && <span className="text-[11px] text-slate-500">{b.lm_code}</span>}
                    <span className={`text-[13px] flex-1 truncate transition-colors ${
                      b.done ? 'text-slate-500 line-through' : 'text-slate-200'
                    }`}>{b.activity}</span>
                    <span className="text-[11px] text-slate-500 tabular-nums">{b.minutes} min</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* LOS mastery */}
          {(loadingLos || los.length > 0) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">LOS Mastery (RAG)</h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>🟢 {ragCounts.green}</span>
                  <span>🟡 {ragCounts.amber}</span>
                  <span>🔴 {ragCounts.red}</span>
                </div>
              </div>
              {loadingLos ? (
                <p className="text-[12px] text-slate-500 italic">Loading LOS…</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {los.map(l => (
                    <div key={l.los_code} className="flex items-center gap-2 p-2 rounded-md bg-white/[0.02]">
                      <span className="text-[10px] font-bold text-slate-500 shrink-0 w-20">{l.los_code}</span>
                      <span className="text-[12px] text-slate-300 flex-1 truncate" title={l.los_description}>{l.los_description}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {(['green', 'amber', 'red'] as Rag[]).map(r => {
                          const active = l.rag === r
                          return (
                            <button key={r} type="button" onClick={() => setRag(l.los_code, active ? 'unset' : r)}
                                    title={RAG_COLORS[r].label}
                                    className={`text-[11px] font-semibold px-2 py-1 rounded border transition-all ${
                                      active ? 'ring-2 ring-offset-1 ring-offset-surface-900 scale-105 shadow-md' : 'opacity-50 hover:opacity-100'
                                    }`}
                                    style={{
                                      background: active ? RAG_COLORS[r].bg : 'transparent',
                                      color: active ? RAG_COLORS[r].text : '#64748B',
                                      borderColor: active ? RAG_COLORS[r].border : 'rgba(100,116,139,0.2)',
                                      // @ts-expect-error ring color via custom prop
                                      '--tw-ring-color': active ? RAG_COLORS[r].border : 'transparent',
                                    }}>
                              {r === 'red' ? '🔴' : r === 'amber' ? '🟡' : '🟢'}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Energy + Confidence + Minutes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LabeledSlider label="Energy" value={energy} onChange={setEnergy} />
            <LabeledSlider label="Confidence" value={confidence} onChange={setConfidence} />
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Actual minutes</label>
              <input type="number" min={0} value={minutesActual}
                     onChange={e => setMinutesActual(parseInt(e.target.value) || 0)}
                     className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Notes (struggles, traps, flashcards to create…)
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      rows={4}
                      placeholder="e.g. Duration vs modified duration still unclear · missed Q7 on coupon bonds · create flashcard on Macaulay formula"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-blue-500/50 resize-none" />
          </div>

          {error && (
            <div className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/[0.06] bg-white/[0.02] rounded-b-2xl">
          <span className="text-[11px] text-slate-500">
            {ragCounts.red > 0 && <>🔴 {ragCounts.red} LOS will be injected as weaknesses. </>}
            PDF will open in a new tab.
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={submitting}
                    className="px-4 py-2 text-[12px] font-semibold text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={submit} disabled={submitting}
                    className="px-5 py-2 text-[12px] font-bold text-white bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Saving…' : 'Save & Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LabeledSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
        <span className="text-[12px] font-bold text-white tabular-nums">{value}/5</span>
      </div>
      <input type="range" min={1} max={5} value={value}
             onChange={e => onChange(parseInt(e.target.value))}
             className="w-full accent-blue-500" />
    </div>
  )
}
