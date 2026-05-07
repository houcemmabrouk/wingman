'use client'

/**
 * WeeklyDigestViewer — relire le bilan hebdomadaire (mail-mailbox semantics).
 *
 * Phase 1B : le digest est généré une seule fois par (user, iso_week), caché en
 * Redis. Le viewer fait simplement `GET /api/v1/digest/current` qui retourne
 * le cached. Si le cache est absent, l'endpoint déclenche la génération une
 * fois (premier "ouvrir") puis le cache prend la main pour les visites suivantes.
 */

import { useEffect, useState } from 'react'
import { Modal, ModalCard } from '@/components/ui/Modal'
import { renderDigestMarkdown } from '@/components/digest/DigestMarkdown'
import { apiFetch } from '@/lib/wingmanApi'

interface DigestResponse {
  iso_year_week: string
  generated_at:  string
  content_md:    string
  model_used:    string
  tokens_in:     number
  tokens_out:    number
  cost_usd:      number
  from_cache?:   boolean
  error?:        string
}

interface Props {
  open: boolean
  onClose: () => void
}

function formatLocal(iso: string): string {
  try { return new Date(iso).toLocaleString('fr-FR') } catch { return iso }
}

export default function WeeklyDigestViewer({ open, onClose }: Props) {
  const [digest, setDigest] = useState<DigestResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDigest(null)
    setErr(null)
    setLoading(true)
    let cancelled = false
    apiFetch<DigestResponse>('/api/v1/digest/current')
      .then(d => { if (!cancelled) setDigest(d) })
      .catch(e => { if (!cancelled) setErr(e?.message || 'Erreur réseau') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open])

  return (
    <Modal open={open} onClose={onClose}>
      <ModalCard className="max-w-2xl">
        <div className="px-5 pt-5 pb-3 border-b border-white/[0.06] flex items-baseline justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.14em]">
              Bilan hebdomadaire · Coach
            </h2>
            {digest?.iso_year_week && (
              <div className="text-[12px] font-semibold text-slate-300 mt-1">
                Semaine {digest.iso_year_week}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-lg leading-none"
            aria-label="Fermer"
          >×</button>
        </div>

        {loading && (
          <div className="px-5 py-10 text-center">
            <div className="inline-flex items-center gap-2 text-[13px] text-slate-300">
              <svg className="w-4 h-4 animate-spin text-accent-blue" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Chargement du bilan…
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Première ouverture cette semaine : ~5-15s pour la génération. Ensuite servi du cache instantanément.
            </p>
          </div>
        )}

        {err && !loading && (
          <div className="px-5 py-6">
            <p className="text-[13px] text-red-300">⚠️ {err}</p>
          </div>
        )}

        {digest?.error && !loading && (
          <div className="px-5 py-6">
            <p className="text-[13px] text-amber-300">
              ⚠️ {digest.error === 'missing_api_key'
                ? 'Clé Anthropic absente côté serveur.'
                : `Erreur Claude : ${digest.error}`}
            </p>
          </div>
        )}

        {digest && !digest.error && !loading && (
          <>
            <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
              <article className="text-[14px] text-slate-200 leading-relaxed">
                {renderDigestMarkdown(digest.content_md)}
              </article>
            </div>
            <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between gap-2 text-[10px] text-slate-500 flex-wrap">
              <span>
                Généré le {formatLocal(digest.generated_at)}
                {digest.from_cache ? ' · cached' : ''}
              </span>
              <button onClick={onClose} className="btn btn-primary text-xs">Fermer</button>
            </div>
          </>
        )}
      </ModalCard>
    </Modal>
  )
}
