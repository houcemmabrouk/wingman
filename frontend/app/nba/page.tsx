'use client'

/**
 * /nba — Next Best Action focal page.
 *
 * Affiche la fiche action focalisée : Hero NBA card + System Diagnostic
 * (cause racine + dernier échec) + Recall Prompt (active recall sur le LO
 * cible). Pas de liste Inbox — celle-ci vit sur /inbox (canal de
 * communication transversal).
 *
 * Charte: .card / .btn-primary / .btn-danger / .btn-ghost / surface-* tokens.
 * Backend: /api/v1/nba/hero, /api/v1/nba/failures/{los}.
 */

import { useEffect, useState } from 'react'
import { TOPIC_COLORS } from '@/lib/lm-data'
import {
  fetchNbaHero, fetchLosFailures,
  type NbaHero, type LosFailure,
} from '@/lib/wingmanApi'

// ── Types ─────────────────────────────────────────────────────────

type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

type HeroAction = NbaHero & { cta_url: string }

interface SystemDiagnosticData {
  failure_count: number
  root_cause: string
  recent_failure: { date_short: string; stem_excerpt: string; picked: string; correct: string } | null
  los_code: string
  los_description: string
}

interface RecallPromptData {
  los_code: string
  prompt: string
}

// ── Helpers ──────────────────────────────────────────────────────

function buildHero(raw: NbaHero | null): HeroAction | null {
  if (!raw || !raw.lm) return null
  return { ...raw, cta_url: `/sessions?mode=reinforce&module=${raw.lm}` }
}

const FRENCH_MONTH_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

function shortFrenchDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const [, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d ?? ''} ${FRENCH_MONTH_SHORT[(m ?? 1) - 1]}`
}

function formatFrenchDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${FRENCH_MONTH_SHORT[(m ?? 1) - 1]} ${y}`
}

function buildDiagnostic(hero: HeroAction, failures: LosFailure[]): SystemDiagnosticData {
  const f = failures[0]
  return {
    failure_count: failures.length,
    root_cause:
      (f?.explanation || hero.los_description || hero.module_title || 'Diagnostic en cours.').slice(0, 280),
    recent_failure: f ? {
      date_short:   shortFrenchDate(f.created_at),
      stem_excerpt: (f.stem || '').slice(0, 140) + ((f.stem || '').length > 140 ? '…' : ''),
      picked:       f.user_answer || '?',
      correct:      f.correct_answer || '?',
    } : null,
    los_code: hero.los || hero.lm,
    los_description: hero.los_description || hero.action_text,
  }
}

function buildRecall(hero: HeroAction): RecallPromptData {
  return {
    los_code: hero.los || hero.lm,
    prompt: hero.los_description || hero.action_text,
  }
}

// ── Page ──────────────────────────────────────────────────────────

export default function NbaPage() {
  const [hero, setHero] = useState<HeroAction | null>(null)
  const [failures, setFailures] = useState<LosFailure[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const rawHero = await fetchNbaHero()
      const builtHero = buildHero(rawHero)
      if (cancelled) return
      setHero(builtHero)
      const failuresResp = builtHero?.los
        ? await fetchLosFailures(builtHero.los, 5)
        : { los_code: '', count: 0, failures: [] as LosFailure[] }
      if (cancelled) return
      setFailures(failuresResp.failures)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const diagnostic = hero ? buildDiagnostic(hero, failures) : null
  const recall     = hero ? buildRecall(hero) : null

  return (
    <div className="space-y-4 max-w-[1100px]">
      {hero ? <HeroCard action={hero} /> : <HeroSkeleton loading={loading} />}
      {diagnostic && <SystemDiagnosticBlock data={diagnostic} />}
      {recall     && <RecallPromptBlock data={recall} />}
    </div>
  )
}

// ── Hero skeleton (pre-fetch) ─────────────────────────────────────

function HeroSkeleton({ loading }: { loading: boolean }) {
  return (
    <section className="card">
      <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-500 mb-3">
        Next Best Action
      </div>
      <div className={`rounded-lg bg-surface-700/40 h-40 ${loading ? 'animate-pulse' : ''}`} />
      {!loading && (
        <div className="text-[11px] text-slate-500 mt-3">
          Aucune action prioritaire — lance une session pour activer le moteur.
        </div>
      )}
    </section>
  )
}

// ── System Diagnostic block ───────────────────────────────────────

function SystemDiagnosticBlock({ data }: { data: SystemDiagnosticData }) {
  return (
    <section className="card border-emerald-500/25 bg-emerald-500/[0.02]">
      <div className="flex items-baseline gap-3 mb-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          System Diagnostic
        </span>
        <span className="text-[11px] text-slate-500">
          {data.failure_count} failure{data.failure_count > 1 ? 's' : ''} logged
        </span>
      </div>

      <div className="text-[12px] text-slate-400 mb-3">
        <span className="font-semibold text-emerald-400">Root cause · </span>
        {data.root_cause}
      </div>

      {data.recent_failure ? (
        <div className="rounded-md bg-surface-700/40 border border-surface-600 px-3 py-2 mb-3 text-[12px]">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-slate-500">#1 · {data.recent_failure.date_short}</span>
            <span className="text-slate-200 truncate">{data.recent_failure.stem_excerpt}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11px]">
            <span className="text-red-400">picked <b>{data.recent_failure.picked}</b></span>
            <span className="text-emerald-400">correct <b>{data.recent_failure.correct}</b></span>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-slate-500 italic mb-3">
          Pas encore de tentative loggée sur ce LO.
        </div>
      )}

      <div className="text-[11px] text-slate-500">
        Relire : <span className="font-mono text-slate-300">{data.los_code}</span> — "{data.los_description}"
      </div>
    </section>
  )
}

// ── Recall Prompt block ───────────────────────────────────────────

function RecallPromptBlock({ data }: { data: RecallPromptData }) {
  const [draft, setDraft] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submit = () => {
    if (!draft.trim()) return
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2000)
    setDraft('')
  }

  return (
    <section className="card border-emerald-500/25 bg-emerald-500/[0.02]">
      <div className="flex items-baseline gap-3 mb-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Recall Prompt
        </span>
        <span className="font-mono text-[11px] text-slate-400">{data.los_code}</span>
      </div>

      <p className="text-[13px] text-slate-200 mb-3">{data.prompt}</p>

      <textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit() }}
        placeholder="Tape ton raisonnement…"
        rows={3}
        className="w-full bg-surface-900 border border-surface-600 text-[13px] text-white placeholder-slate-600 rounded-md px-3 py-2 outline-none focus:border-emerald-500/40 font-mono resize-none"
      />

      <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
        <span className="text-[11px] text-slate-500">
          {submitted
            ? <span className="text-emerald-400">✓ Soumis (mock)</span>
            : <>⌘/Ctrl + Enter pour soumettre</>}
        </span>
        <button
          onClick={submit}
          disabled={!draft.trim()}
          className="btn btn-ghost text-xs disabled:opacity-40"
        >
          Soumettre
        </button>
      </div>
    </section>
  )
}

// ── Hero card ─────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<Priority, {
  border: string; pill: string; dot: string; dateText: string; cta: string;
}> = {
  CRITICAL: {
    border:   'border-red-500/40',
    pill:     'bg-red-500/15 text-red-400',
    dot:      'bg-red-400',
    dateText: 'text-red-400',
    cta:      'btn-danger',
  },
  HIGH: {
    border:   'border-amber-500/30',
    pill:     'bg-amber-500/15 text-amber-400',
    dot:      'bg-amber-400',
    dateText: 'text-amber-400',
    cta:      'btn-primary',
  },
  MEDIUM: {
    border:   '',
    pill:     'bg-accent-blue/15 text-accent-blue',
    dot:      'bg-accent-blue',
    dateText: 'text-slate-400',
    cta:      'btn-primary',
  },
  LOW: {
    border:   '',
    pill:     'bg-emerald-500/15 text-emerald-400',
    dot:      'bg-emerald-400',
    dateText: 'text-slate-400',
    cta:      'btn-primary',
  },
}

type MetricAccent = 'red' | 'amber' | 'green' | 'blue'

const METRIC_NUM_COLOR: Record<MetricAccent, string> = {
  red:   'text-red-400',
  amber: 'text-amber-400',
  green: 'text-emerald-400',
  blue:  'text-accent-blue',
}

function HeroCard({ action }: { action: HeroAction }) {
  const style = PRIORITY_STYLE[action.priority]
  const topicHex = TOPIC_COLORS[action.topic] || '#475569'
  const masteryAccent: MetricAccent =
    action.mastery_pct < 30 ? 'red' : action.mastery_pct < 70 ? 'amber' : 'green'
  const urgencyAccent: MetricAccent =
    action.priority === 'CRITICAL' ? 'red' :
    action.priority === 'HIGH'     ? 'amber' :
    action.priority === 'LOW'      ? 'green' : 'blue'

  return (
    <section className={`card ${style.border}`}>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${style.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {action.priority}
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-slate-400">
            Next Best Action
          </span>
        </div>
        <span className={`text-sm font-semibold ${style.dateText}`}>
          J−{action.days_until_exam} · {formatFrenchDate(action.deadline)}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3 flex-wrap">
        <span
          className="px-2 py-0.5 rounded text-[11px] font-bold text-white"
          style={{ backgroundColor: topicHex }}
        >
          {action.topic}
        </span>
        <span className="font-mono text-sm text-slate-400">{action.lm}</span>
        {action.los && (
          <>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-sm text-slate-400">{action.los}</span>
          </>
        )}
        <span className="text-sm text-slate-300">{action.module_title}</span>
      </div>

      <h1 className="text-xl font-bold text-white mb-5 leading-snug">
        {action.action_text}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <MetricBox label="Mastery"     value={`${action.mastery_pct.toFixed(1)}%`}     accent={masteryAccent} />
        <MetricBox label="Exam weight" value={`${action.exam_weight_pct.toFixed(1)}%`} accent="blue" />
        <MetricBox label="Urgency"     value={action.urgency_score.toFixed(0)}         accent={urgencyAccent} highlighted={urgencyAccent === 'red'} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="text-[11px] text-slate-500">Picked by mastery × exam weight</span>
        <a href={action.cta_url} className={`btn ${style.cta} inline-flex items-center gap-1.5`}>
          Start session →
        </a>
      </div>
    </section>
  )
}

function MetricBox({
  label, value, accent, highlighted,
}: { label: string; value: string; accent: MetricAccent; highlighted?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlighted
          ? 'border-red-500/30 bg-red-500/[0.04]'
          : 'border-surface-600 bg-surface-700/40'
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${METRIC_NUM_COLOR[accent]}`}>
        {value}
      </div>
    </div>
  )
}
