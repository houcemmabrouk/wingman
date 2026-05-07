'use client'

import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ErrorPattern { type: string; description: string; count: number }
interface WeakArea { topic: string; subtopic: string; severity: string; detail: string }
interface Recommendation { priority: number; action: string; module_code: string; reason: string }
interface EnhancedExplanation { question_stem: string; explanation: string; key_concept: string; study_tip: string }

interface Analysis {
  summary: string
  error_patterns: ErrorPattern[]
  weak_areas: WeakArea[]
  recommendations: Recommendation[]
  enhanced_explanations: EnhancedExplanation[]
}

interface Props {
  sessionId: number
  autoLoad?: boolean
}

const PATTERN_COLORS: Record<string, { bg: string; text: string }> = {
  conceptual: { bg: 'bg-red-500/15', text: 'text-red-400' },
  calculation: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  trick: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  recall: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
}

const SEVERITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
}

export default function AIAnalysis({ sessionId, autoLoad = false }: Props) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedExpl, setExpandedExpl] = useState<Set<number>>(new Set())

  const fetchAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/ai/analyze-session`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      const data = await res.json()
      if (data.analysis) setAnalysis(data.analysis)
      else setError('Analysis not available')
    } catch {
      setError('Connection error')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (autoLoad) fetchAnalysis()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, sessionId])

  if (!analysis && !loading && !error) {
    return (
      <button onClick={fetchAnalysis} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/20 text-sm font-medium text-blue-300 hover:from-blue-500/30 hover:to-purple-500/30 transition-all">
        Analyze with AI
      </button>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-5 bg-white/[0.04] rounded w-40" />
        <div className="h-16 bg-white/[0.04] rounded-xl" />
        <div className="h-24 bg-white/[0.04] rounded-xl" />
        <div className="h-20 bg-white/[0.04] rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={fetchAnalysis} className="text-xs text-blue-400 mt-2 hover:underline">Retry</button>
      </div>
    )
  }

  if (!analysis) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-white">AI Analysis</h3>
      </div>

      {/* Summary */}
      <div className="p-3.5 bg-gradient-to-r from-blue-500/8 to-purple-500/8 border border-blue-500/15 rounded-xl">
        <p className="text-xs text-slate-300 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Error Patterns */}
      {analysis.error_patterns.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold text-slate-500 uppercase mb-2">Error Types</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.error_patterns.map((p, i) => {
              const c = PATTERN_COLORS[p.type] || PATTERN_COLORS.recall
              return (
                <div key={i} className={`${c.bg} ${c.text} px-2.5 py-1.5 rounded-lg`}>
                  <span className="text-[11px] font-bold">{p.type}</span>
                  <span className="text-[10px] ml-1 opacity-70">x{p.count}</span>
                  <p className="text-[10px] opacity-80 mt-0.5">{p.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Weak Areas */}
      {analysis.weak_areas.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold text-slate-500 uppercase mb-2">Weak Areas</h4>
          <div className="space-y-1.5">
            {analysis.weak_areas.map((w, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-white/[0.02] rounded-lg">
                <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${SEVERITY_DOT[w.severity] || SEVERITY_DOT.medium}`} />
                <div>
                  <span className="text-[11px] font-semibold text-slate-300">{w.topic} — {w.subtopic}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{w.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold text-slate-500 uppercase mb-2">Recommendations</h4>
          <div className="space-y-1.5">
            {analysis.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-white/[0.02] rounded-lg">
                <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {r.priority}
                </span>
                <div>
                  <span className="text-[11px] font-semibold text-slate-300">{r.action}</span>
                  {r.module_code && <span className="text-[9px] text-blue-400 ml-1 font-mono">{r.module_code}</span>}
                  <p className="text-[10px] text-slate-500 mt-0.5">{r.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Explanations */}
      {analysis.enhanced_explanations.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold text-slate-500 uppercase mb-2">Detailed Explanations</h4>
          <div className="space-y-1">
            {analysis.enhanced_explanations.map((e, i) => {
              const isOpen = expandedExpl.has(i)
              return (
                <div key={i} className="border border-white/[0.04] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedExpl(prev => {
                      const next = new Set(prev)
                      if (next.has(i)) next.delete(i); else next.add(i)
                      return next
                    })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <svg className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-[11px] text-slate-400 flex-1 truncate">{e.question_stem}</span>
                    <span className="text-[9px] text-purple-400 font-semibold shrink-0">{e.key_concept}</span>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 space-y-1.5">
                      <p className="text-[11px] text-slate-300 leading-relaxed">{e.explanation}</p>
                      <p className="text-[10px] text-blue-400 italic">{e.study_tip}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
