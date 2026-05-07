'use client'

import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FailureRow {
  attempt_id: number
  session_id: number
  created_at: string | null
  stem: string
  user_answer: string | null
  user_choice: string | null
  correct_answer: string | null
  correct_choice: string | null
  explanation: string | null
  difficulty: number | null
  time_spent_sec: number | null
  los_code: string
  los_description: string | null
}

interface NBA_DiagnosticPanelProps {
  losCode: string | null
  userId: string
  losDescription?: string | null
}

const TEAL = '#00e0b8'

function trim(text: string | null | undefined, n: number): string {
  if (!text) return ''
  const t = text.trim()
  return t.length > n ? t.slice(0, n).trimEnd() + '…' : t
}

function formatRelative(iso: string | null): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch {
    return iso.slice(0, 10)
  }
}

export const NBA_DiagnosticPanel = ({ losCode, userId, losDescription }: NBA_DiagnosticPanelProps) => {
  const [failures, setFailures] = useState<FailureRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!losCode) { setLoading(false); return }
    setLoading(true)
    fetch(`${API}/api/v1/nba/failures/${encodeURIComponent(losCode)}?limit=5`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(d => setFailures(Array.isArray(d?.failures) ? d.failures : []))
      .catch(() => setFailures([]))
      .finally(() => setLoading(false))
  }, [losCode, userId])

  // Aggregate signal: most-picked wrong letter across failures.
  const wrongLetterCounts: Record<string, number> = {}
  for (const f of failures) {
    const k = (f.user_answer || '').toUpperCase()
    if (k === 'A' || k === 'B' || k === 'C') {
      wrongLetterCounts[k] = (wrongLetterCounts[k] || 0) + 1
    }
  }
  const topWrongEntry = Object.entries(wrongLetterCounts).sort((a, b) => b[1] - a[1])[0]
  const topWrongLetter = topWrongEntry?.[0]
  const topWrongCount = topWrongEntry?.[1] ?? 0
  const latest = failures[0]

  return (
    <div
      className="rounded-[18px] p-5"
      style={{
        background: 'rgba(0,224,184,.04)',
        border: `1px solid ${TEAL}33`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full inline-flex items-center gap-1.5"
            style={{ background: 'rgba(0,224,184,.10)', border: `1px solid ${TEAL}77`, color: TEAL }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: TEAL, boxShadow: `0 0 6px ${TEAL}` }}
            />
            System Diagnostic
          </span>
          {!loading && (
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              {failures.length === 0 ? 'No failures yet' : `${failures.length} failure${failures.length > 1 ? 's' : ''} logged`}
            </span>
          )}
        </div>
        {loading && (
          <span className="text-[10px] text-slate-500 animate-pulse">Analyzing patterns…</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-white/[0.04] rounded w-3/4" />
          <div className="h-4 bg-white/[0.04] rounded w-1/2" />
        </div>
      ) : failures.length === 0 ? (
        <p className="text-[12px] text-slate-400 leading-relaxed">
          Aucune tentative ratée sur ce LOS pour l&apos;instant — le moteur n&apos;a rien à diagnostiquer.
        </p>
      ) : (
        <>
          {/* Root cause */}
          <div
            className="rounded-[12px] p-3 mb-3"
            style={{ background: 'rgba(0,224,184,.06)', border: `1px solid ${TEAL}22` }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-[9px] font-bold uppercase tracking-[0.18em] px-1.5 py-0.5 rounded"
                style={{ background: TEAL, color: '#000' }}
              >
                Root Cause
              </span>
            </div>
            <p className="text-[13px] text-slate-200 leading-relaxed">
              {trim(latest?.explanation, 240) || trim(latest?.stem, 240) || 'Pas d\u2019explication disponible pour cette tentative.'}
            </p>
          </div>

          {/* Pattern */}
          {topWrongLetter && topWrongCount >= 2 && (
            <div
              className="rounded-[10px] p-2.5 mb-3 flex items-baseline gap-2"
              style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.18)' }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                Pattern
              </span>
              <span className="text-[12px] text-slate-300">
                Picked <span className="font-bold text-red-400">{topWrongLetter}</span>{' '}
                on <span className="font-bold text-white">{topWrongCount}</span> of last{' '}
                {failures.length} failures.
              </span>
            </div>
          )}

          {/* Failure log */}
          <div className="space-y-1.5 mb-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
              Recent failures
            </div>
            {failures.slice(0, 3).map((f, i) => (
              <div
                key={f.attempt_id}
                className="flex items-start gap-2 text-[12px] py-1.5 px-2 rounded-md"
                style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.04)' }}
              >
                <span className="font-mono text-[10px] text-slate-600 shrink-0 mt-0.5">
                  #{i + 1}
                </span>
                <span className="font-mono text-[10px] text-slate-500 shrink-0 mt-0.5 tabular-nums">
                  {formatRelative(f.created_at)}
                </span>
                <span className="text-slate-300 flex-1 min-w-0">
                  <span className="line-clamp-1">{trim(f.stem, 90)}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Picked <span className="font-bold text-red-400">{f.user_answer}</span>
                    <span className="opacity-70"> · correct </span>
                    <span className="font-bold text-emerald-400">{f.correct_answer}</span>
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* Pointer to review */}
          <div className="pt-3 border-t border-white/[0.04] flex items-baseline gap-2 text-[11px]">
            <span className="text-slate-500">Relire :</span>
            <span className="font-mono text-slate-300">{losCode}</span>
            {losDescription && (
              <span className="text-slate-400 truncate">— &ldquo;{trim(losDescription, 80)}&rdquo;</span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NBA_DiagnosticPanel
