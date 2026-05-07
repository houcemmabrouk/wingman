'use client'

import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Message {
  role: 'user' | 'assistant'
  text: string
  source_lm?: number | null
}

export default function CoachPanel({ lmId }: { lmId?: number }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: question }])
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/coach`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, lm_id: lmId || null }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: data.answer,
        source_lm: data.source_lm,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Coach connection error.' }])
    }
    setLoading(false)
  }

  return (
    <div className="card flex flex-col h-[400px]">
      <h2 className="card-header">AI Coach</h2>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-8">
            Ask a question about CFA Level I...
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
              m.role === 'user'
                ? 'bg-accent-blue/20 text-blue-200'
                : 'bg-surface-700 text-slate-300'
            }`}>
              {m.text}
              {m.source_lm && (
                <p className="text-[10px] text-slate-500 mt-1">Source: LM #{m.source_lm}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-700 rounded-lg p-3 text-sm text-slate-500 animate-pulse">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Your question..."
          className="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-white
                     placeholder-slate-500 focus:outline-none focus:border-accent-blue"
        />
        <button onClick={handleSend} disabled={loading} className="btn-primary">
          Send
        </button>
      </div>
    </div>
  )
}
