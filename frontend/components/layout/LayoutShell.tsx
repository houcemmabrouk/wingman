'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from './Topbar'
import SidebarNav from './Sidebar'
import Navigator from './Navigator'
import { useAuth } from '@/lib/auth'
import { fetchUserProfile, fetchAlerts } from '@/lib/wingmanApi'

function computeDaysToExam(examDateIso: string | null): number | null {
  if (!examDateIso) return null
  try {
    const diff = Math.ceil((new Date(examDateIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  } catch { return null }
}

// Optimistic local cache so the badge appears immediately on subsequent loads
// instead of flickering empty while /api/user/profile resolves.
const EXAM_DATE_CACHE_KEY = 'wingman_exam_date_cache'

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!loading && !user) router.replace('/landing')
  }, [loading, user, router])
  const [alertCount, setAlertCount] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [examDateIso, setExamDateIso] = useState<string | null>(null)

  // Hydrate from cached value first (no flicker), then refresh from /api/user/profile.
  useEffect(() => {
    try {
      const cached = localStorage.getItem(EXAM_DATE_CACHE_KEY)
      if (cached) setExamDateIso(cached)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!user?.user_id) return
    fetchUserProfile()
      .then(d => {
        const iso = typeof d?.exam_date === 'string' ? d.exam_date : null
        setExamDateIso(iso)
        try {
          if (iso) localStorage.setItem(EXAM_DATE_CACHE_KEY, iso)
          else     localStorage.removeItem(EXAM_DATE_CACHE_KEY)
        } catch { /* ignore */ }
      })
  }, [user?.user_id])

  const daysToExam = computeDaysToExam(examDateIso)

  useEffect(() => {
    // Skip while auth is loading or user not yet set — avoids the
    // `user_id=undefined` request that the backend correctly rejects with 503.
    if (!user?.user_id) return
    const refresh = async () => {
      const data = await fetchAlerts()
      setAlertCount(data.filter(a => a.severity === 'critical' || !a.is_read).length)
    }
    refresh()
    const id = setInterval(refresh, 30000)
    return () => clearInterval(id)
  }, [user])

  return (
    <>
      <Topbar daysToExam={daysToExam} examDateIso={examDateIso} userName={user?.display_name || 'User'} onMenuToggle={() => {
        // Mobile: toggle drawer, Desktop: toggle collapse
        if (window.innerWidth < 768) {
          setMobileOpen(o => !o)
        } else {
          setCollapsed(c => !c)
        }
      }} />

      <div className="flex">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* Sidebar — hidden on mobile, drawer when mobileOpen */}
        <div className={`
          fixed top-[48px] left-0 bottom-0 z-50 transition-transform duration-200
          md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <SidebarNav
            alertCount={alertCount}
            collapsed={collapsed}
            onToggle={() => setCollapsed(c => !c)}
          />
        </div>

        {/* Main content */}
        <main className={`flex-1 p-4 md:p-6 min-h-[calc(100vh-48px)] transition-[margin] duration-200 ml-0 ${collapsed ? 'md:ml-[52px]' : 'md:ml-[230px]'}`}>
          {children}
        </main>
      </div>

      {/* Navigator panel (Coach moved to /coach page) */}
      <Navigator open={navOpen} onClose={() => setNavOpen(false)} />
    </>
  )
}
