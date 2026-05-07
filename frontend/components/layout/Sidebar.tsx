'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  alertCount?: number
  collapsed?: boolean
  onToggle?: () => void
}

interface NavBadge {
  text: string
  color: 'emerald' | 'amber' | 'red' | 'blue' | 'violet' | 'slate'
}

interface NavItem {
  href: string
  label: string
  icon: string
  soon?: boolean
  onboardingOnly?: boolean
  badgeKey?: string  // looked up in `badges` prop / state to render dynamically
}

interface NavGroup {
  title: string
  accent: string  // tailwind color name (e.g. 'emerald', 'amber') used for the section dot + active border
  items: NavItem[]
}

// Per-accent class strings — Tailwind needs the literal classnames in source
// to include them in the final bundle, so we can't compose them dynamically.
const ACCENT_DOT: Record<string, string> = {
  blue:    'bg-blue-400',
  emerald: 'bg-emerald-400',
  amber:   'bg-amber-400',
  red:     'bg-red-400',
  violet:  'bg-violet-400',
  yellow:  'bg-yellow-400',
  slate:   'bg-slate-500',
}
const ACCENT_BORDER: Record<string, string> = {
  blue:    'border-l-blue-400 bg-blue-500/[0.08]',
  emerald: 'border-l-emerald-400 bg-emerald-500/[0.08]',
  amber:   'border-l-amber-400 bg-amber-500/[0.08]',
  red:     'border-l-red-400 bg-red-500/[0.08]',
  violet:  'border-l-violet-400 bg-violet-500/[0.08]',
  yellow:  'border-l-yellow-400 bg-yellow-500/[0.08]',
  slate:   'border-l-slate-400 bg-slate-500/[0.08]',
}
const ACCENT_TEXT: Record<string, string> = {
  blue:    'text-blue-400',
  emerald: 'text-emerald-400',
  amber:   'text-amber-400',
  red:     'text-red-400',
  violet:  'text-violet-400',
  yellow:  'text-yellow-400',
  slate:   'text-slate-400',
}

const BADGE_STYLE: Record<NavBadge['color'], string> = {
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  amber:   'bg-amber-500/15 text-amber-300 border-amber-500/30',
  red:     'bg-red-500/15 text-red-300 border-red-500/30',
  blue:    'bg-blue-500/15 text-blue-300 border-blue-500/30',
  violet:  'bg-violet-500/15 text-violet-300 border-violet-500/30',
  slate:   'bg-slate-500/15 text-slate-300 border-slate-500/30',
}

// Icon paths (Heroicons-style 24x24 stroke). Kept inline so a single <svg>
// renderer can handle every entry.
const ICONS = {
  zap: 'M13 10V3L4 14h7v7l9-11h-7z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  target: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12zm0 3a3 3 0 100 6 3 3 0 000-6z',
  brain: 'M12 3C7 3 3 7 3 12c0 2.5 1 4.8 2.6 6.4L12 12V3zM12 3v9l6.4 6.4C20 16.8 21 14.5 21 12c0-5-4-9-9-9z',
  calendarCheck: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM9 16l2 2 4-4',
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
  play: 'M8 5v14l11-7z',
  trendingUp: 'M3 12l3-3 4 4 8-8 3 3-11 11z',
  flag: 'M5 3l3.057 6.114L12 3l3.943 6.114L19 3v14a2 2 0 01-2 2H7a2 2 0 01-2-2V3z',
  book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  bulb: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  cog: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  database: 'M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm0 5h16M9 4v16',
  trophy: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14v7m-3-3h6M5 7h2v3a3 3 0 003 3v0a3 3 0 003-3V7h2',
  robot: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h.01M15 9h.01M9 13a3 3 0 006 0',
  list: 'M4 6h16M4 10h16M4 14h16M4 18h16',
  examPaper: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  calc: 'M9 7h6m-6 4h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z',
}

const ONBOARDING_ITEM: NavItem = { href: '/onboarding', label: 'Onboarding', icon: ICONS.zap, onboardingOnly: true }

// Inbox = canal de communication unifié sur /inbox. Item standalone en haut
// (sous Onboarding), hors des groupes thématiques car transversal — l'utilisateur
// y revient quel que soit le contexte (training/diagnostic/exam). Distinct de
// /nba (fiche action focale : hero + diagnostic + recall).
const INBOX_ITEM: NavItem = { href: '/inbox', label: 'Inbox', icon: ICONS.list, badgeKey: 'nba_unread' }

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Now',
    accent: 'emerald',
    items: [
      { href: '/',         label: 'Today Mission',    icon: ICONS.layers },
      { href: '/nba',      label: 'Next Best Action', icon: ICONS.zap },
      { href: '/library',  label: 'Library',          icon: ICONS.book, badgeKey: 'library_lm_count' },
      { href: '/coach',    label: 'AI Coach',         icon: ICONS.robot },
    ],
  },
  {
    title: 'Training',
    accent: 'amber',
    items: [
      { href: '/learning-by-doing',   label: 'Learning by Doing',   icon: ICONS.sparkles },
      { href: '/calculator-tutorial', label: 'Calculator Tutorial', icon: ICONS.calc },
      { href: '/sessions',            label: 'Practice',            icon: ICONS.play },
      { href: '/debrief',             label: 'History',             icon: ICONS.clipboard },
      { href: '/memory',              label: 'Memory',              icon: ICONS.brain, badgeKey: 'memory_due' },
    ],
  },
  {
    title: 'Diagnostic',
    accent: 'red',
    items: [
      { href: '/readiness',   label: 'Readiness',    icon: ICONS.target, badgeKey: 'readiness_score' },
      { href: '/progression', label: 'Progression',  icon: ICONS.chart },
      { href: '/results',     label: 'Analytics',    icon: ICONS.bulb },
      { href: '/error-log',   label: 'Error Log',    icon: ICONS.warning },
    ],
  },
  {
    title: 'Exam',
    accent: 'violet',
    items: [
      { href: '/exam-overview', label: 'Overview',      icon: ICONS.layers },
      { href: '/exam-intel',    label: 'Exam Insights', icon: ICONS.bulb },
      { href: '/mock-exams',    label: 'Mock Exams',    icon: ICONS.examPaper },
    ],
  },
]

const STANDALONE: NavItem[] = [
  { href: '/settings', label: 'Settings',   icon: ICONS.cog },
  { href: '/data',     label: 'Backoffice', icon: ICONS.database },
]

export default function SidebarNav({ alertCount = 0, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [onboardingDone, setOnboardingDone] = useState(false)
  // Dynamic per-item badges. Wire to real backend endpoints when they exist;
  // for now the mock values demonstrate the visual treatment.
  // TODO: replace with real fetches:
  //   - readiness_score: GET /api/readiness/score → Math.round(score * 100) + '%'
  //   - memory_due:      GET /api/memory/due-count
  //   - library_lm_count: count of LMs scheduled today
  const [badges, setBadges] = useState<Record<string, NavBadge>>({})

  useEffect(() => {
    try {
      if (localStorage.getItem('wingman_onboarding')) setOnboardingDone(true)
    } catch {}

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    // NBA unread — red badge on Next Best Action sidebar item. Polls every 30s
    // along with the alerts refresh in LayoutShell. 0 = hidden, ≥10 = "9+".
    const refreshNbaUnread = () => {
      fetch(`${API}/api/v1/inbox/unread-count`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          const n = typeof d?.unread_count === 'number' ? d.unread_count : 0
          setBadges(prev => {
            if (n <= 0) {
              const { nba_unread, ...rest } = prev
              return rest
            }
            const text = n >= 10 ? '9+' : String(n)
            return { ...prev, nba_unread: { text, color: 'red' } }
          })
        })
        .catch(() => {})
    }
    refreshNbaUnread()
    const nbaTimer = setInterval(refreshNbaUnread, 30000)

    // Memory due — escalates fast: 0 = no badge, 1-3 amber, 4-9 red, 10+ red with bell.
    fetch(`${API}/api/v1/memory/retention?include_unseen=false`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.global) return
        const due = (d.global.fading || 0) + (d.global.at_risk || 0)
        if (due === 0) return
        const text = due >= 10 ? `${due} due !` : `${due} due`
        const color: NavBadge['color'] = due >= 4 ? 'red' : 'amber'
        setBadges(prev => ({ ...prev, memory_due: { text, color } }))
      })
      .catch(() => {})

    // Readiness — show actual % vs the 70% pass target, not just absolute number.
    // Format: "X% / 70" so the gap is always visible, with aggressive color tiers.
    fetch(`${API}/api/readiness/`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const pct = d?.metrics?.exam_readiness_pct
        if (typeof pct !== 'number') return
        const rounded = Math.round(pct)
        const text = rounded >= 70 ? `${rounded}% ✓` : `${rounded}/70`
        const color: NavBadge['color'] =
          rounded >= 70 ? 'emerald' :
          rounded >= 50 ? 'amber'   :
                          'red'
        setBadges(prev => ({ ...prev, readiness_score: { text, color } }))
      })
      .catch(() => {})

    // Library — emerald when there's a plan today (motivating: "do this"),
    //           red when nothing planned but unseen LMs exist (stress: "lots untouched"),
    //           no badge if nothing relevant.
    Promise.all([
      fetch(`${API}/api/plan/today`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/api/v1/memory/retention?include_unseen=true`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([plan, mem]) => {
      if (Array.isArray(plan) && plan.length > 0) {
        setBadges(prev => ({
          ...prev,
          library_lm_count: { text: `${plan.length} today`, color: 'emerald' },
        }))
        return
      }
      const unseen = mem?.global?.unseen
      if (typeof unseen === 'number' && unseen > 0) {
        // Amber not red — "unseen" is a backlog indicator, not a critical
        // alert. Red was reading as "broken" which it isn't.
        setBadges(prev => ({
          ...prev,
          library_lm_count: { text: `${unseen} unseen`, color: 'amber' },
        }))
      }
    })

    return () => clearInterval(nbaTimer)
  }, [])

  // Single-active-group model: only one section can be expanded at a time.
  // Precedence: hover (transient peek) > click (manual override on current
  // page) > active route group (auto-expand). Click is cleared on navigation
  // so the new route's section always takes over — we don't persist it,
  // because pinning across navigations was hiding the user's actual context.
  const [clickedGroup, setClickedGroup] = useState<string | null>(null)
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)

  // Group containing the active route — auto-expands on first paint.
  const activeGroupTitle = useMemo(() => {
    const g = NAV_GROUPS.find(grp => grp.items.some(it => !it.soon && it.href === pathname))
    return g?.title || null
  }, [pathname])

  useEffect(() => { setClickedGroup(null) }, [pathname])

  const toggleGroup = (title: string) => {
    setClickedGroup(prev => prev === title ? null : title)
  }

  const renderItem = (item: NavItem, accent: string = 'slate') => {
    const active = !item.soon && pathname === item.href
    const baseCls = `flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all relative ${active && !collapsed ? 'border-l-2 -ml-px' : ''}`
    const stateCls = item.soon
      ? 'text-slate-600 cursor-not-allowed opacity-50'
      : active
        ? `${ACCENT_BORDER[accent] || ACCENT_BORDER.slate} text-white font-medium`
        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'

    const dynamicBadge = item.badgeKey ? badges[item.badgeKey] : undefined
    const showAlertBadge = !item.soon && item.href === '/results' && alertCount > 0

    const inner = (
      <>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
        </svg>
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.soon && (
          <span className="ml-auto text-[9px] uppercase tracking-wider font-bold text-slate-600 border border-slate-700/50 rounded px-1.5 py-0.5">Soon</span>
        )}
        {!collapsed && showAlertBadge && (
          <span className="ml-auto min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold px-1">
            {alertCount}
          </span>
        )}
        {!collapsed && !item.soon && !showAlertBadge && dynamicBadge && (
          <span className={`ml-auto text-[10px] font-semibold border rounded px-1.5 py-0.5 ${BADGE_STYLE[dynamicBadge.color]}`}>
            {dynamicBadge.text}
          </span>
        )}
        {collapsed && !item.soon && item.href === '/results' && alertCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />
        )}
      </>
    )

    if (item.soon) {
      return (
        <div key={item.label} title={collapsed ? `${item.label} (soon)` : undefined} className={`${baseCls} ${stateCls}`}>
          {inner}
        </div>
      )
    }
    return (
      <Link key={item.label} href={item.href} title={collapsed ? item.label : undefined} className={`${baseCls} ${stateCls}`}>
        {inner}
      </Link>
    )
  }

  return (
    <aside className={`${collapsed ? 'w-[52px]' : 'w-[230px]'} h-full overflow-y-auto border-r border-white/[0.06] bg-surface-900/50 py-3 px-2 flex flex-col gap-1 transition-[width] duration-200`}>
      {/* Brand block */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'} px-2 pb-3 mb-1 border-b border-white/[0.06]`}>
        <div className="px-2 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-[11px] tracking-wider shrink-0">
          CFA
        </div>
        {!collapsed && (
          <div className="text-[13px] font-bold text-white leading-tight">Level 1</div>
        )}
      </div>

      {!onboardingDone && renderItem(ONBOARDING_ITEM)}
      {renderItem(INBOX_ITEM)}

      {NAV_GROUPS.map((group, idx) => {
        // Effective open state: hover (transient) wins, then click (manual on
        // current page), then the route's group.
        const effectiveOpen = hoveredGroup ?? clickedGroup ?? activeGroupTitle
        const isOpen = effectiveOpen === group.title
        const groupActive = group.items.some(it => !it.soon && it.href === pathname)
        const dotClass = ACCENT_DOT[group.accent] || ACCENT_DOT.slate
        const textClass = ACCENT_TEXT[group.accent] || 'text-slate-300'
        return (
          <div
            key={group.title}
            className={idx > 0 && !collapsed ? 'mt-2' : ''}
            onMouseEnter={() => !collapsed && setHoveredGroup(group.title)}
            onMouseLeave={() => setHoveredGroup(null)}
          >
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.title)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-[12px] uppercase tracking-wider font-bold transition-colors group ${textClass} ${
                  groupActive ? 'bg-white/[0.03] rounded' : 'hover:bg-white/[0.02]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                  {group.title}
                </span>
                <svg className={`w-3 h-3 transition-transform opacity-50 group-hover:opacity-100 ${isOpen ? '' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            {(collapsed || isOpen) && (
              <div className="flex flex-col gap-0.5">
                {group.items.map(item => renderItem(item, group.accent))}
              </div>
            )}
          </div>
        )
      })}

      <div className={`${collapsed ? '' : 'mt-3 pt-3 border-t border-white/[0.04]'} flex flex-col gap-0.5`}>
        {STANDALONE.map(item => renderItem(item, 'slate'))}
      </div>

      {/* Toggle – discret, en bas */}
      <button
        onClick={onToggle}
        className="mt-auto flex items-center justify-center w-full py-1.5 rounded-md text-slate-600 hover:text-slate-400 hover:bg-white/[0.04] transition-colors"
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {collapsed ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          )}
        </svg>
      </button>
    </aside>
  )
}
