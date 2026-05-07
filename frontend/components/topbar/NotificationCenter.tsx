'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useNotifications, Notif } from '@/hooks/useNotifications'

const SEV_COLOR: Record<Notif['severity'], string> = {
  info:     '#6c8cff',
  success:  '#22c55e',
  warning:  '#f59e0b',
  critical: '#ef4444',
}

const SEV_BG: Record<Notif['severity'], string> = {
  info:     'rgba(108,140,255,0.10)',
  success:  'rgba(34,197,94,0.10)',
  warning:  'rgba(245,158,11,0.10)',
  critical: 'rgba(239,68,68,0.10)',
}

const KIND_ICON: Record<Notif['kind'], string> = {
  new_session:      'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  mastery_delta:    'M3 12l3-3 4 4 8-8 3 3-11 11z',
  memory_bucket:    'M12 3C7 3 3 7 3 12c0 2.5 1 4.8 2.6 6.4L12 12V3zM12 3v9l6.4 6.4C20 16.8 21 14.5 21 12c0-5-4-9-9-9z',
  streak_milestone: 'M13 10V3L4 14h7v7l9-11h-7z',
  plan_refreshed:   'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2',
  goal_reached:     'M5 13l4 4L19 7',
}

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000))
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { notifs, unreadCount, markRead, markAllRead, clearAll, refresh } = useNotifications({
    onNew: (n) => {
      // Browser-level toast — only fires for fresh polls, not on initial mount.
      if (typeof window === 'undefined') return
      try {
        // Dispatch a custom event so any toast provider can pick it up.
        window.dispatchEvent(new CustomEvent('wingman:notification', { detail: n }))
      } catch { /* ignore */ }
    },
  })

  // Click outside to close
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current && !panelRef.current.contains(t) && buttonRef.current && !buttonRef.current.contains(t)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  // Visual indicator color: severity of the most-urgent unread.
  const topUnread = notifs.find(n => !n.read)
  const dotColor = topUnread ? SEV_COLOR[topUnread.severity] : '#64748b'

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications (${unreadCount} unread)`}
        title={unreadCount > 0 ? `${unreadCount} new` : 'No new notifications'}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
            style={{ background: dotColor }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute top-full right-0 mt-2 w-[360px] max-h-[520px] rounded-xl shadow-2xl flex flex-col overflow-hidden z-50"
          style={{ background: '#0f1424', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div>
              <div className="text-[12px] font-bold text-white">Notifications</div>
              <div className="text-[10px] text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refresh}
                      title="Refresh now"
                      className="text-[10px] font-semibold text-slate-400 hover:text-white">
                ⟳
              </button>
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                        className="text-[10px] font-semibold text-blue-400 hover:text-blue-300">
                  Mark all read
                </button>
              )}
              {notifs.length > 0 && (
                <button onClick={clearAll}
                        title="Clear all notifications"
                        className="text-[10px] font-semibold text-slate-500 hover:text-red-400">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-[12px] text-slate-400">No notifications yet</div>
                <div className="text-[10px] text-slate-600 mt-1">
                  We&apos;ll alert you when sessions complete, mastery shifts, memory items fade, or your plan is refreshed.
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {notifs.map(n => {
                  const color = SEV_COLOR[n.severity]
                  const bg = SEV_BG[n.severity]
                  const inner = (
                    <div className="flex items-start gap-2.5 px-3 py-2.5"
                         style={{ background: n.read ? 'transparent' : bg }}
                         onClick={() => markRead(n.id)}>
                      <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center"
                           style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={KIND_ICON[n.kind]} />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold truncate" style={{ color: n.read ? '#94a3b8' : '#fff' }}>
                            {n.title}
                          </span>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />}
                        </div>
                        {n.body && (
                          <div className="text-[10px] text-slate-500 leading-snug mt-0.5">{n.body}</div>
                        )}
                        <div className="text-[9px] text-slate-600 mt-1 tabular-nums">{timeAgo(n.ts)}</div>
                      </div>
                    </div>
                  )
                  return n.href ? (
                    <Link key={n.id} href={n.href} onClick={() => { markRead(n.id); setOpen(false) }}
                          className="block hover:bg-white/[0.03] transition-colors">
                      {inner}
                    </Link>
                  ) : (
                    <div key={n.id} className="hover:bg-white/[0.03] transition-colors">
                      {inner}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-4 py-2 border-t border-white/[0.06]">
            <div className="text-[9px] text-slate-600 text-center">
              Polling every 60s · last {notifs.length > 0 ? timeAgo(notifs[0].ts) : '—'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
