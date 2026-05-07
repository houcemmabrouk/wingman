'use client'

/**
 * CoachMailViewer — relire un thread coach mail existant.
 *
 * Récupère `/api/coach/mail/{threadId}` (Redis-backed, 30j TTL), affiche le
 * mail user et la réponse coach, et marque lu via `POST /{thread_id}/read`.
 *
 * Distinct de NewCoachMessageModal qui sert à composer un nouveau mail.
 */

import { useEffect, useState } from 'react'
import { Modal, ModalCard } from '@/components/ui/Modal'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ThreadResp {
  thread_id:   string
  subject:     string
  user_body:   string
  coach_reply: string
  created_at:  string
  read_at:     string | null
}

interface Props {
  open: boolean
  onClose: () => void
  threadId: string | null
  /** Optional callback fired after the thread is marked read, so the inbox can refresh. */
  onMarkedRead?: (threadId: string) => void
}

function formatLocal(iso: string): string {
  try { return new Date(iso).toLocaleString('fr-FR') } catch { return iso }
}

export default function CoachMailViewer({ open, onClose, threadId, onMarkedRead }: Props) {
  const [thread, setThread] = useState<ThreadResp | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !threadId) return
    setThread(null)
    setErr(null)
    setLoading(true)
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API}/api/coach/mail/${encodeURIComponent(threadId)}`, {
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as ThreadResp
        if (cancelled) return
        setThread(data)
        // Mark read in background — idempotent. Fire-and-forget.
        if (!data.read_at) {
          fetch(`${API}/api/coach/mail/${encodeURIComponent(threadId)}/read`, {
            method: 'POST', credentials: 'include',
          }).then(() => onMarkedRead?.(threadId)).catch(() => {})
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'erreur réseau')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [open, threadId, onMarkedRead])

  return (
    <Modal open={open} onClose={onClose}>
      <ModalCard className="max-w-lg">
        <div className="px-5 pt-5 pb-3 border-b border-white/[0.06] flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-[0.14em]">
            Mail · Coach
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-lg leading-none"
            aria-label="Fermer"
          >×</button>
        </div>

        {loading && (
          <div className="px-5 py-8 text-center text-[13px] text-slate-400">
            Chargement…
          </div>
        )}

        {err && !loading && (
          <div className="px-5 py-6">
            <p className="text-[13px] text-red-300">⚠️ {err}</p>
          </div>
        )}

        {thread && !loading && (
          <>
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="badge bg-accent-blue/15 text-accent-blue">Coach</span>
                <span className="text-[12px] font-semibold text-white truncate">{thread.subject}</span>
              </div>
              <div className="text-[10px] text-slate-500">{formatLocal(thread.created_at)}</div>
            </div>

            <div className="px-5 py-4 max-h-[420px] overflow-y-auto space-y-4">
              {/* Outgoing — user's mail */}
              <section>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-1.5">
                  Tu as écrit
                </div>
                <article className="text-[12.5px] text-slate-300 leading-relaxed whitespace-pre-line bg-surface-700/30 border border-surface-600 rounded-lg px-3 py-2.5">
                  {thread.user_body}
                </article>
              </section>

              {/* Incoming — coach reply */}
              <section>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-blue mb-1.5">
                  Coach a répondu
                </div>
                <article className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-line">
                  {thread.coach_reply}
                </article>
              </section>
            </div>

            <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-end">
              <button onClick={onClose} className="btn btn-primary text-xs">Fermer</button>
            </div>
          </>
        )}
      </ModalCard>
    </Modal>
  )
}
