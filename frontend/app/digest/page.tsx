'use client'

/**
 * /digest — Claude Weekly Brief.
 *
 * Phase 1A: récupère le digest courant (généré on-demand côté backend, pas
 * encore persisté). Affiche le markdown rendu par Claude. Phase 2 ajoutera
 * la liste des digests passés et la mise en cache via la table weekly_digests.
 */

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/wingmanApi'
import { renderDigestMarkdown } from '@/components/digest/DigestMarkdown'

interface DigestResponse {
  iso_year_week: string
  generated_at:  string
  content_md:    string
  model_used:    string
  tokens_in:     number
  tokens_out:    number
  cost_usd:      number
  error?:        string
}

export default function DigestPage() {
  const [digest, setDigest] = useState<DigestResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setErrorMsg(null)
    apiFetch<DigestResponse>('/api/v1/digest/current')
      .then(d => setDigest(d))
      .catch(e => setErrorMsg(e?.message || 'Erreur réseau'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4 max-w-[820px]">
      <header className="card">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-400">
              Weekly Brief
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              {digest?.iso_year_week
                ? `Bilan ${digest.iso_year_week}`
                : 'Ton bilan de la semaine'}
            </h1>
            <p className="text-[12px] text-slate-500 mt-1">
              Généré par Claude · sonnet-4-6 · semaine en cours vs précédente.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="btn btn-ghost text-xs disabled:opacity-40"
            title="Régénérer"
          >
            {loading ? '⟳ Génération…' : '⟳ Régénérer'}
          </button>
        </div>
        {digest && !digest.error && (
          <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
            <span>Tokens : {digest.tokens_in.toLocaleString()} in / {digest.tokens_out.toLocaleString()} out</span>
            <span className="text-slate-700">·</span>
            <span>${digest.cost_usd.toFixed(4)}</span>
            <span className="text-slate-700">·</span>
            <span>{new Date(digest.generated_at).toLocaleString('fr-FR')}</span>
          </div>
        )}
      </header>

      {loading && !digest && (
        <section className="card">
          <div className="flex flex-col gap-3">
            <div className="h-5 w-2/3 rounded bg-surface-700/40 animate-pulse" />
            <div className="h-4 w-full rounded bg-surface-700/30 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-surface-700/30 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-surface-700/30 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-500 mt-4">
            Claude rédige ton digest — ~5-15s selon la taille du payload.
          </p>
        </section>
      )}

      {errorMsg && !digest && (
        <section className="card border-red-500/30">
          <p className="text-[13px] text-red-300">{errorMsg}</p>
          <button onClick={load} className="btn btn-ghost text-xs mt-3">Réessayer</button>
        </section>
      )}

      {digest?.error && (
        <section className="card border-amber-500/30 bg-amber-500/[0.03]">
          <p className="text-[12px] text-amber-300">
            ⚠️ {digest.error === 'missing_api_key'
              ? 'Clé Anthropic absente côté serveur.'
              : `Erreur Claude : ${digest.error}`}
          </p>
        </section>
      )}

      {digest && !digest.error && digest.content_md && (
        <section className="card">
          <article className="prose-digest text-[14px] text-slate-200 leading-relaxed">
            {renderDigestMarkdown(digest.content_md)}
          </article>
        </section>
      )}
    </div>
  )
}
