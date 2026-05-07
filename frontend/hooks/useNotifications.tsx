'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { apiSafe, fetchKPIs, fetchSessionsHistory, fetchMemoryRetention, fetchTodayStats, fetchStreak } from '@/lib/wingmanApi'

const SNAPSHOT_KEY = 'wingman_notif_snapshot_v1'
const NOTIFS_KEY   = 'wingman_notifs_v1'
const POLL_MS = 60_000

export type NotifSeverity = 'info' | 'success' | 'warning' | 'critical'
export type NotifKind =
  | 'new_session'
  | 'mastery_delta'
  | 'memory_bucket'
  | 'streak_milestone'
  | 'plan_refreshed'
  | 'goal_reached'

export interface Notif {
  id: string                 // stable: kind + key fields
  kind: NotifKind
  severity: NotifSeverity
  title: string
  body?: string
  href?: string              // deeplink
  ts: number                 // unix ms
  read: boolean
}

interface Snapshot {
  last_session_id?: number
  mastery_score?: number
  fading_count?: number
  at_risk_count?: number
  streak?: number
  plan_rationale_hash?: string
  daily_goal_min?: number
  today_min?: number
  goal_hit_today?: boolean
  last_poll?: number
}

function loadSnapshot(): Snapshot {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || '{}') } catch { return {} }
}

function saveSnapshot(s: Snapshot) {
  try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

function loadNotifs(): Notif[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(NOTIFS_KEY) || '[]') } catch { return [] }
}

function saveNotifs(n: Notif[]) {
  try { localStorage.setItem(NOTIFS_KEY, JSON.stringify(n.slice(0, 50))) } catch { /* ignore */ }
}

function djb2(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i)
  return (h >>> 0).toString(36)
}

const STREAK_MILESTONES = [1, 3, 7, 14, 30, 60, 100]

interface DetectArgs {
  prev: Snapshot
  next: Snapshot
  // Extra context fetched from APIs
  lastSessionTopic?: string
  lastSessionScore?: number
  lastSessionLm?: string
}

function detectNotifs({ prev, next, lastSessionTopic, lastSessionScore, lastSessionLm }: DetectArgs): Notif[] {
  const out: Notif[] = []
  const now = Date.now()

  // 1) New session completed
  if (
    next.last_session_id != null &&
    prev.last_session_id != null &&
    next.last_session_id > prev.last_session_id
  ) {
    const score = lastSessionScore ?? 0
    const sev: NotifSeverity = score >= 70 ? 'success' : score >= 50 ? 'info' : 'warning'
    out.push({
      id: `new_session-${next.last_session_id}`,
      kind: 'new_session',
      severity: sev,
      title: `Session completed — ${score}%`,
      body: lastSessionTopic ? `${lastSessionTopic} ${lastSessionLm || ''}` : undefined,
      href: '/debrief',
      ts: now,
      read: false,
    })
  }

  // 2) Mastery delta ≥ 2pt
  if (next.mastery_score != null && prev.mastery_score != null) {
    const delta = Math.round(next.mastery_score - prev.mastery_score)
    if (Math.abs(delta) >= 2) {
      const sev: NotifSeverity = delta > 0 ? 'success' : 'warning'
      out.push({
        id: `mastery-${next.mastery_score}-${now}`,
        kind: 'mastery_delta',
        severity: sev,
        title: `Mastery ${delta > 0 ? 'up' : 'down'} ${Math.abs(delta)} pt`,
        body: `Now at ${Math.round(next.mastery_score)}%`,
        href: '/results',
        ts: now,
        read: false,
      })
    }
  }

  // 3) Memory bucket — fading or at-risk count changed
  const prevDue = (prev.fading_count || 0) + (prev.at_risk_count || 0)
  const nextDue = (next.fading_count || 0) + (next.at_risk_count || 0)
  if (prev.fading_count != null && nextDue !== prevDue) {
    const diff = nextDue - prevDue
    if (Math.abs(diff) >= 1) {
      const sev: NotifSeverity = diff > 0 ? 'warning' : 'success'
      out.push({
        id: `memory_bucket-${nextDue}-${now}`,
        kind: 'memory_bucket',
        severity: sev,
        title: diff > 0 ? `${diff} LM fading` : `${Math.abs(diff)} LM recovered`,
        body: `${nextDue} due for review`,
        href: '/memory',
        ts: now,
        read: false,
      })
    }
  }

  // 4) Streak milestone
  if (next.streak != null && prev.streak != null && next.streak > prev.streak) {
    if (STREAK_MILESTONES.includes(next.streak)) {
      out.push({
        id: `streak-${next.streak}`,
        kind: 'streak_milestone',
        severity: 'success',
        title: `${next.streak}-day streak 🔥`,
        body: `Keep it going to hit the next milestone.`,
        href: '/',
        ts: now,
        read: false,
      })
    }
  }

  // 5) Plan rationale changed (refresh of today's plan)
  if (
    next.plan_rationale_hash &&
    prev.plan_rationale_hash &&
    next.plan_rationale_hash !== prev.plan_rationale_hash
  ) {
    out.push({
      id: `plan_refresh-${next.plan_rationale_hash}`,
      kind: 'plan_refreshed',
      severity: 'info',
      title: "Today's plan refreshed",
      body: 'New blocks queued in Today Mission.',
      href: '/',
      ts: now,
      read: false,
    })
  }

  // 6) Daily goal hit (transitions from below to >= goal)
  if (
    next.daily_goal_min != null &&
    next.today_min != null &&
    next.today_min >= next.daily_goal_min &&
    !prev.goal_hit_today
  ) {
    out.push({
      id: `goal-${new Date().toISOString().slice(0, 10)}`,
      kind: 'goal_reached',
      severity: 'success',
      title: `Daily goal hit — ${next.today_min} min`,
      body: `Target was ${next.daily_goal_min} min. Bonus minutes count too.`,
      href: '/',
      ts: now,
      read: false,
    })
  }

  return out
}

export interface UseNotificationsReturn {
  notifs: Notif[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
  clearAll: () => void
  /** Force a poll right now (useful for manual refresh button). */
  refresh: () => void
}

/**
 * Polls backend KPI/session/memory/plan endpoints, diffs against the previous
 * snapshot in localStorage, and emits typed notifications when something
 * meaningful changes. The notification list is also persisted (last 50).
 */
export function useNotifications(opts?: { onNew?: (n: Notif) => void }): UseNotificationsReturn {
  // Initialise to [] so SSR and the first client render match. Stored notifs
  // are hydrated in useEffect below — reading localStorage in the initialiser
  // breaks hydration (server has 0 → no badge <span>; client has N → badge).
  const [notifs, setNotifs] = useState<Notif[]>([])
  useEffect(() => { setNotifs(loadNotifs()) }, [])
  const onNewRef = useRef(opts?.onNew)
  useEffect(() => { onNewRef.current = opts?.onNew }, [opts?.onNew])

  const poll = useCallback(async () => {
    try {
      const [kpis, sessHist, memGlobal, plan, todayStats] = await Promise.all([
        fetchKPIs(),
        fetchSessionsHistory(1, 0),
        fetchMemoryRetention(false),
        apiSafe<{ rationale?: string }>('/api/plan/state', {}, { query: { use_cache: true } }),
        fetchTodayStats(),
      ])

      const lastSession = sessHist.sessions?.[0]
      const next: Snapshot = {
        last_session_id: lastSession?.session_id,
        mastery_score: typeof kpis?.mastery_score === 'number' ? kpis.mastery_score : undefined,
        fading_count: memGlobal.fading,
        at_risk_count: memGlobal.at_risk,
        streak: undefined,
        plan_rationale_hash: plan.rationale ? djb2(plan.rationale) : undefined,
        daily_goal_min: todayStats.daily_goal_minutes,
        today_min: todayStats.total_minutes,
        goal_hit_today: (todayStats.total_minutes ?? 0) >= (todayStats.daily_goal_minutes ?? 90),
        last_poll: Date.now(),
      }

      // Streak from a separate cheap endpoint
      try { next.streak = (await fetchStreak()).streak } catch { /* ignore */ }

      const prev = loadSnapshot()
      const fresh = detectNotifs({
        prev,
        next,
        lastSessionTopic: lastSession?.topic_code,
        lastSessionScore: lastSession?.score_pct,
        lastSessionLm: lastSession?.module_code,
      })

      saveSnapshot(next)

      if (fresh.length > 0) {
        setNotifs(prevNotifs => {
          // De-duplicate by id (latest wins)
          const byId = new Map<string, Notif>()
          for (const n of [...fresh, ...prevNotifs]) {
            if (!byId.has(n.id)) byId.set(n.id, n)
          }
          const merged = Array.from(byId.values()).sort((a, b) => b.ts - a.ts).slice(0, 50)
          saveNotifs(merged)
          return merged
        })
        for (const n of fresh) onNewRef.current?.(n)
      }
    } catch { /* swallow — polling is best-effort */ }
  }, [])

  // Initial run + interval
  useEffect(() => {
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => clearInterval(id)
  }, [poll])

  const markRead = useCallback((id: string) => {
    setNotifs(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n)
      saveNotifs(next)
      return next
    })
  }, [])

  const markAllRead = useCallback(() => {
    setNotifs(prev => {
      const next = prev.map(n => ({ ...n, read: true }))
      saveNotifs(next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setNotifs([])
    saveNotifs([])
  }, [])

  const unreadCount = notifs.filter(n => !n.read).length

  return { notifs, unreadCount, markRead, markAllRead, clearAll, refresh: poll }
}
