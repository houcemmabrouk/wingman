'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { TOPIC_COLORS } from '@/lib/lm-data'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Block {
  order: number
  activity: string
  topic_code: string
  lm_code?: string
  minutes: number
}

interface SessionProposal {
  topics: string[]
  lm_codes: string[]
  duration_min: number
  session_mode: string
  blocks: Block[]
  rationale: string
}

interface Props {
  energy: 'high' | 'mid' | 'low'
  timeBudgetMin: number
  topicProgress: Record<string, number>
  lmProgress: Record<string, number>
  onBuild: (proposal: SessionProposal) => void
}

export default function CoachSession({ energy, timeBudgetMin, topicProgress, lmProgress, onBuild }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi — I know your current energy (${energy}) and time budget (${timeBudgetMin} min). What do you want to work on today?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [proposal, setProposal] = useState<SessionProposal | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Keep chat scrolled to the latest message
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, proposal, loading])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    const nextHistory = [...messages, { role: 'user' as const, content: text }]
    setMessages(nextHistory)
    setInput('')
    setLoading(true)
    setProposal(null)
    try {
      const res = await fetch(`${API}/api/coach/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          history: nextHistory.slice(0, -1),
          message: text,
          context: {
            energy,
            time_budget_min: timeBudgetMin,
            topic_progress: topicProgress,
            lm_progress: lmProgress,
            language: (typeof window !== 'undefined' && (localStorage.getItem('wingman_language') as 'fr' | 'en' | null)) || null,
          },
        }),
      })
      const data: { reply: string; proposal?: SessionProposal } = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      if (data.proposal) setProposal(data.proposal)
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Network error: ${e instanceof Error ? e.message : 'unknown'}` }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, energy, timeBudgetMin, topicProgress, lmProgress])

  const reset = () => {
    setMessages([{
      role: 'assistant',
      content: `Hi — I know your current energy (${energy}) and time budget (${timeBudgetMin} min). What do you want to work on today?`,
    }])
    setProposal(null)
    setInput('')
  }

  return (
    <div className="rounded-[18px] p-5" style={{ background: '#10182d', border: '1px solid rgba(255,255,255,.06)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-[16px] font-bold text-white">Coach Session</h3>
        <button onClick={reset} className="text-[10px] text-slate-500 hover:text-slate-300 hover:underline">Reset chat</button>
      </div>
      <p className="text-[12px] text-slate-500 mb-4">Talk to the Coach. It knows your energy, time, progress, and weaknesses.</p>

      {/* Chat area */}
      <div ref={scrollRef}
           className="space-y-2 mb-3 max-h-80 overflow-y-auto pr-1 py-1"
           style={{ scrollbarGutter: 'stable' }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] px-3 py-2 rounded-xl text-[12px] leading-relaxed ${
              m.role === 'user'
                ? 'bg-blue-500/20 text-blue-100 rounded-br-sm'
                : 'bg-white/[0.04] text-slate-200 rounded-bl-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-xl bg-white/[0.04] text-slate-400 text-[12px]">
              <span className="inline-block animate-pulse">Coach is thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* Proposal card */}
      {proposal && (
        <div className="mb-3 rounded-[14px] p-3 border border-emerald-500/30"
             style={{ background: 'rgba(16,185,129,0.05)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Session proposal</div>
            <div className="text-[10px] text-slate-500 tabular-nums">
              {proposal.duration_min} min · {proposal.blocks.length} blocks · {proposal.session_mode}
            </div>
          </div>
          <div className="space-y-1.5 mb-3">
            {proposal.blocks.map(b => (
              <div key={b.order} className="flex items-center gap-2 text-[11px]">
                <span className="w-4 text-slate-600 text-right tabular-nums">{b.order}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white shrink-0"
                      style={{ background: TOPIC_COLORS[b.topic_code] || '#6366f1' }}>
                  {b.topic_code}
                </span>
                {b.lm_code && <span className="text-[9px] font-mono text-slate-500 shrink-0">{b.lm_code}</span>}
                <span className="text-slate-200 flex-1 truncate">{b.activity}</span>
                <span className="text-slate-500 tabular-nums shrink-0">{b.minutes}m</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 italic mb-3 leading-relaxed">{proposal.rationale}</p>
          <button onClick={() => onBuild(proposal)}
                  className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white transition-all hover:brightness-110"
                  style={{ background: '#10b981' }}>
            ✓ Build this session
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="e.g. 45 min, low energy, want to consolidate FI LM02"
          rows={2}
          disabled={loading}
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-slate-200 focus:outline-none focus:border-blue-500/50 resize-none disabled:opacity-50" />
        <button onClick={send} disabled={loading || !input.trim()}
                className="px-4 py-2 rounded-lg text-[12px] font-bold text-white bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Send
        </button>
      </div>
    </div>
  )
}
