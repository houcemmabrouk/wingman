'use client'

/**
 * InboxView — self-contained Inbox component.
 *
 * Mounts on /inbox (and historically embedded on /nba). Owns its own data
 * fetching, filtering state, optimistic mark-read/dismiss. Charte: .card +
 * surface-* + accent-* tokens.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  fetchInbox, markInboxRead, dismissInbox,
  type InboxItemDTO,
} from '@/lib/wingmanApi'
import NewCoachMessageModal from '@/components/inbox/NewCoachMessageModal'
import CoachMailViewer from '@/components/inbox/CoachMailViewer'
import WeeklyDigestViewer from '@/components/inbox/WeeklyDigestViewer'

// ── Types ─────────────────────────────────────────────────────────

type Category = 'action' | 'alert' | 'dispute' | 'coach' | 'plan' | 'srs'
type Filter = 'all' | Category

interface NeverSurrenderTier {
  level: 1 | 2 | 3
  label: string
  title: string
  meta: string
  cta_url: string
  suggested?: boolean
}

const NS_TIERS: NeverSurrenderTier[] = [
  { level: 1, label: 'TIER 1 · PASSIF',   title: 'Audio Reading Summary',     meta: '5-10 min · écoute',     cta_url: '/sessions?mode=audio' },
  { level: 2, label: 'TIER 2 · ENCODING', title: 'Reading + LOS Sheet',       meta: '10-15 min · lecture',   cta_url: '/sessions?mode=discovery', suggested: true },
  { level: 3, label: 'TIER 3 · + CHECK',  title: 'Reading + LOS + quiz easy', meta: '15-20 min · 3-5 q',     cta_url: '/sessions?mode=reinforce' },
]

const FILTER_CHIPS: { key: Filter; label: string; icon: string }[] = [
  { key: 'all',     label: 'Tous',     icon: '📥' },
  { key: 'action',  label: 'Actions',  icon: '⚡' },
  { key: 'alert',   label: 'Alerts',   icon: '🔔' },
  { key: 'dispute', label: 'Disputes', icon: '⚖' },
  { key: 'coach',   label: 'Coach',    icon: '💬' },
  { key: 'plan',    label: 'Plan',     icon: '📅' },
  { key: 'srs',     label: 'SRS',      icon: '🧠' },
]

// charte limits .badge-* to green/amber/red ; blue/purple via raw accent tokens.
const CATEGORY_BADGE: Record<Category, string> = {
  action:  'badge bg-accent-purple/15 text-accent-purple',
  alert:   'badge-amber',
  dispute: 'badge-green',
  coach:   'badge bg-accent-blue/15 text-accent-blue',
  plan:    'badge-green',
  srs:     'badge-amber',
}

const CATEGORY_LABEL: Record<Category, string> = {
  action: 'Action', alert: 'Alert', dispute: 'Dispute',
  coach:  'Coach',  plan:  'Plan',  srs:     'SRS',
}

// Per-category avatar styling — soft tinted square with matching ring.
const CATEGORY_AVATAR: Record<Category, string> = {
  action:  'bg-accent-purple/15 ring-accent-purple/25 text-accent-purple',
  alert:   'bg-accent-amber/15  ring-accent-amber/25  text-accent-amber',
  dispute: 'bg-accent-green/15  ring-accent-green/25  text-accent-green',
  coach:   'bg-accent-blue/15   ring-accent-blue/25   text-accent-blue',
  plan:    'bg-accent-green/15  ring-accent-green/25  text-accent-green',
  srs:     'bg-accent-amber/15  ring-accent-amber/25  text-accent-amber',
}

// ── Component ─────────────────────────────────────────────────────

export default function InboxView() {
  const [filter, setFilter] = useState<Filter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [viewerThreadId, setViewerThreadId] = useState<string | null>(null)
  const [digestOpen, setDigestOpen] = useState(false)
  const [items, setItems] = useState<InboxItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const resp = await fetchInbox()
      if (cancelled) return
      setItems(resp.items)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const visibleItems = useMemo(
    () => items
      .filter(i => !dismissedKeys.has(i.item_key))
      .filter(i => filter === 'all' || i.category === filter),
    [items, filter, dismissedKeys]
  )

  const totalAll = useMemo(
    () => items.filter(i => !dismissedKeys.has(i.item_key)).length,
    [items, dismissedKeys]
  )

  const unreadCount = visibleItems.filter(i => i.unread).length

  const handleItemClick = (item: InboxItemDTO) => {
    setItems(prev => prev.map(i => i.item_key === item.item_key ? { ...i, unread: false } : i))
    markInboxRead(item.item_key).catch(() => {})

    // Coach mail items open in-place via the viewer modal — no navigation,
    // since the thread lives in Redis and is keyed by item_key suffix.
    if (item.item_key.startsWith('coach:mail:')) {
      const threadId = item.item_key.slice('coach:mail:'.length)
      setViewerThreadId(threadId)
      return
    }
    // Weekly digest item opens its own viewer — read-only, never regenerates.
    if (item.item_key.startsWith('coach:digest:')) {
      setDigestOpen(true)
      return
    }
    window.location.href = item.cta_url
  }

  const handleDismiss = (item_key: string) => {
    setDismissedKeys(prev => new Set(prev).add(item_key))
    dismissInbox(item_key).catch(() => {})
  }

  return (
    <section className="card">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-white">
            Inbox
            {unreadCount > 0 && (
              <span className="ml-2 badge bg-accent-blue/15 text-accent-blue">{unreadCount} unread</span>
            )}
          </h2>
          <span className="text-xs text-slate-500">
            {visibleItems.length} / {totalAll} item{totalAll > 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { console.log('[InboxView] open compose'); setComposeOpen(true) }}
            className="btn btn-primary text-xs inline-flex items-center gap-1.5"
            title="Nouveau message au Coach"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouveau message
          </button>
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className="btn btn-ghost text-xs inline-flex items-center gap-1"
          >
            Filtrer {filtersOpen ? '▴' : '▾'}
            {filter !== 'all' && (
              <span className="ml-1 badge bg-accent-purple/15 text-accent-purple">{CATEGORY_LABEL[filter as Category]}</span>
            )}
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div className="flex flex-wrap gap-1.5 mb-4 pb-3 border-b border-surface-600">
          {FILTER_CHIPS.map(chip => {
            const active = filter === chip.key
            return (
              <button
                key={chip.key}
                onClick={() => setFilter(chip.key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-accent-blue text-white border-accent-blue'
                    : 'bg-surface-700 border-surface-600 text-slate-300 hover:bg-surface-600'
                }`}
              >
                <span className="mr-1">{chip.icon}</span>
                {chip.label}
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-14 rounded-lg bg-surface-700/40 animate-pulse" />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <NeverSurrenderEmptyState />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {visibleItems.map(item => (
            <InboxRow
              key={item.item_key}
              item={item}
              onClick={() => handleItemClick(item)}
              onDismiss={() => handleDismiss(item.item_key)}
            />
          ))}
        </ul>
      )}

      <NewCoachMessageModal open={composeOpen} onClose={() => setComposeOpen(false)} />
      <CoachMailViewer
        open={viewerThreadId !== null}
        onClose={() => setViewerThreadId(null)}
        threadId={viewerThreadId}
      />
      <WeeklyDigestViewer
        open={digestOpen}
        onClose={() => setDigestOpen(false)}
      />
    </section>
  )
}

// ── Helpers ────────────────────────────────────────────────────────

/** Short absolute timestamp for the inbox row chip — "DD/MM HH:mm" today,
 *  "DD/MM" otherwise. Returns '' if iso is null/invalid. */
function formatEntryTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth() &&
    d.getDate()     === now.getDate()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  if (sameDay) {
    const hh = String(d.getHours()).padStart(2, '0')
    const mn = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mn}`
  }
  return `${dd}/${mm}`
}

// ── Inbox row ─────────────────────────────────────────────────────

function InboxRow({
  item, onClick, onDismiss,
}: { item: InboxItemDTO; onClick: () => void; onDismiss: () => void }) {
  const cat = item.category as Category
  const accent = item.urgent
    ? 'border-l-[3px] border-l-accent-amber shadow-[inset_2px_0_0_rgba(245,158,11,0.15)]'
    : item.unread
      ? 'border-l-[3px] border-l-accent-blue'
      : 'border-l border-l-transparent'
  const bg = item.unread
    ? 'bg-surface-700/50 hover:bg-surface-700'
    : 'bg-transparent hover:bg-surface-700/60'

  return (
    <li
      onClick={onClick}
      className={`group grid grid-cols-[40px_1fr_auto] items-start gap-3 px-3.5 py-3 rounded-xl cursor-pointer transition-all duration-150 hover:translate-x-[1px] ${bg} ${accent}`}
    >
      {/* Avatar — category-tinted square with soft ring */}
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ring-1 ${CATEGORY_AVATAR[cat]}`}>
        {item.icon}
      </span>

      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={CATEGORY_BADGE[cat]}>
            {CATEGORY_LABEL[cat]}
          </span>
          <span className={`text-[12px] font-semibold truncate ${item.unread ? 'text-white' : 'text-slate-300'}`}>
            {item.from}
          </span>
          {item.urgent && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent-amber">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse" />
              urgent
            </span>
          )}
        </div>
        <div className={`text-[13px] leading-snug truncate ${item.unread ? 'text-white font-semibold' : 'text-slate-200'}`}>
          {item.title}
        </div>
        <div className="text-[11px] text-slate-500 truncate mt-0.5 leading-snug">
          {item.preview}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span
          className="text-[10px] font-mono tabular-nums text-slate-400 px-2 py-0.5 rounded-md bg-surface-700/60 border border-white/[0.04]"
          title={item.entry_at_iso ? new Date(item.entry_at_iso).toLocaleString('fr-FR') : ''}
        >
          {formatEntryTime(item.entry_at_iso) || item.time}
        </span>
        {item.entry_at_iso && (
          <span className="text-[9px] text-slate-600">{item.time}</span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDismiss() }}
          className="text-[10px] text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
          title="Dismiss"
        >
          ✕ dismiss
        </button>
      </div>
    </li>
  )
}

// ── Empty state — Never Surrender ─────────────────────────────────

function NeverSurrenderEmptyState() {
  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🐇</span>
        <h3 className="text-sm font-bold text-white">Never Surrender</h3>
      </div>
      <p className="text-xs italic text-slate-400 mb-4">
        "Je fais le max que je peux, même si je suis mort."
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {NS_TIERS.map(tier => (
          <a
            key={tier.level}
            href={tier.cta_url}
            className={`block rounded-lg border p-3 transition-colors ${
              tier.suggested
                ? 'border-emerald-500/50 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.12]'
                : 'border-surface-600 bg-surface-700/40 hover:bg-surface-700'
            }`}
          >
            <div className="text-[10px] font-bold tracking-wider text-emerald-400">{tier.label}</div>
            <div className="text-[13px] font-semibold text-white mt-1">{tier.title}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{tier.meta}</div>
            {tier.suggested && (
              <div className="text-[10px] text-emerald-400 mt-2 font-semibold">✓ Suggéré pour ton état</div>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
