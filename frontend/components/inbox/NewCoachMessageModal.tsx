'use client'

/**
 * NewCoachMessageModal — vrai aller-retour mail user ↔ Coach (Phase 1A).
 *
 * États :
 *   1. compose  — l'utilisateur tape subject + body, clique Envoyer
 *   2. sending  — appel POST /api/coach/mail/send (Claude ~5-15s)
 *   3. reply    — affiche la réponse coach format mail dans la même modal
 *
 * Backend : `/api/coach/mail/send` (Redis-backed, voir
 * `backend/app/services/coach_mail.py`). La réponse est aussi remontée par
 * l'inbox aggregator (slot _coach_mail_replies) → l'utilisateur la retrouve
 * dans /inbox même après fermeture.
 */

import { useEffect, useRef, useState } from 'react'
import { Modal, ModalCard } from '@/components/ui/Modal'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Props {
  open: boolean
  onClose: () => void
}

interface ThreadResp {
  thread_id:   string
  subject:     string
  user_body:   string
  coach_reply: string
  created_at:  string
  read_at:     string | null
}

type Phase = 'compose' | 'sending' | 'reply' | 'error'

function formatLocal(iso: string): string {
  try { return new Date(iso).toLocaleString('fr-FR') } catch { return iso }
}

export default function NewCoachMessageModal({ open, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('compose')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [thread, setThread] = useState<ThreadResp | null>(null)
  const [errMsg, setErrMsg] = useState('')
  const taRef = useRef<HTMLTextAreaElement | null>(null)

  // Reset on open
  useEffect(() => {
    if (open) {
      setPhase('compose')
      setSubject('')
      setBody('')
      setThread(null)
      setErrMsg('')
      const id = setTimeout(() => taRef.current?.focus(), 80)
      return () => clearTimeout(id)
    }
  }, [open])

  const send = async () => {
    const text = body.trim()
    if (!text || phase === 'sending') return
    setPhase('sending')
    setErrMsg('')
    try {
      const res = await fetch(`${API}/api/coach/mail/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject: subject.trim(), body: text }),
      })
      if (!res.ok) {
        setErrMsg(`Erreur HTTP ${res.status}`)
        setPhase('error')
        return
      }
      const data = (await res.json()) as ThreadResp
      setThread(data)
      setPhase('reply')
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'erreur réseau')
      setPhase('error')
    }
  }

  const composeNew = () => {
    setPhase('compose')
    setSubject('')
    setBody('')
    setThread(null)
    setErrMsg('')
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalCard className="max-w-lg">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-white/[0.06] flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-[0.14em]">
            {phase === 'reply' ? 'Réponse · Coach' : 'Nouveau mail · Coach'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-lg leading-none"
            aria-label="Fermer"
          >×</button>
        </div>

        {/* Compose */}
        {phase === 'compose' && (
          <>
            <div className="px-5 pt-4 pb-3">
              <p className="text-[12px] text-slate-400">
                Le Coach connaît ton énergie, ton temps, tes faiblesses.
                Dis ce que tu veux travailler, il te répond en mail.
              </p>
            </div>
            <div className="px-5 pb-4 space-y-3">
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Objet (optionnel)"
                maxLength={140}
                className="w-full bg-surface-900 border border-surface-600 text-[13px] text-white placeholder-slate-600 rounded-md px-3 py-2 outline-none focus:border-accent-blue/40"
              />
              <textarea
                ref={taRef}
                value={body}
                onChange={e => setBody(e.target.value)}
                onKeyDown={e => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="ex. 45 min, énergie basse, je veux consolider FI LM02"
                rows={6}
                className="w-full bg-surface-900 border border-surface-600 text-[13px] text-white placeholder-slate-600 rounded-md px-3 py-2 outline-none focus:border-accent-blue/40 resize-none"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>{body.length} caractère{body.length > 1 ? 's' : ''}</span>
                <span>⌘/Ctrl + Enter pour envoyer</span>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
              <button onClick={onClose} className="btn btn-ghost text-xs">Annuler</button>
              <button
                onClick={send}
                disabled={!body.trim()}
                className="btn btn-primary text-xs disabled:opacity-40"
              >
                Envoyer →
              </button>
            </div>
          </>
        )}

        {/* Sending */}
        {phase === 'sending' && (
          <div className="px-5 py-8 text-center">
            <div className="inline-flex items-center gap-2 text-[13px] text-slate-300">
              <svg className="w-4 h-4 animate-spin text-accent-blue" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Coach rédige sa réponse…
            </div>
            <p className="text-[10px] text-slate-500 mt-2">~5-15s selon la longueur.</p>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="px-5 py-6">
            <p className="text-[13px] text-red-300 mb-3">⚠️ {errMsg || 'Erreur inconnue.'}</p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={onClose}    className="btn btn-ghost text-xs">Fermer</button>
              <button onClick={() => setPhase('compose')} className="btn btn-primary text-xs">Réessayer</button>
            </div>
          </div>
        )}

        {/* Reply */}
        {phase === 'reply' && thread && (
          <>
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="badge bg-accent-blue/15 text-accent-blue">Coach</span>
                <span className="text-[12px] font-semibold text-white truncate">{thread.subject}</span>
              </div>
              <div className="text-[10px] text-slate-500">{formatLocal(thread.created_at)}</div>
            </div>
            <div className="px-5 py-4 max-h-[420px] overflow-y-auto">
              <article className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-line">
                {thread.coach_reply}
              </article>
            </div>
            <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
              <button onClick={composeNew} className="btn btn-ghost text-xs">
                ← Nouveau mail
              </button>
              <button onClick={onClose} className="btn btn-primary text-xs">Fermer</button>
            </div>
          </>
        )}
      </ModalCard>
    </Modal>
  )
}
