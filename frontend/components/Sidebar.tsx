'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const USER_ID = '00000000-0000-0000-0000-000000000001'

const navItems = [
  { href: '/results',     label: 'Results',       icon: '\u25A0' },
  { href: '/',            label: 'Daily Monitor', icon: '\u25CB' },
  { href: '/smart-planner', label: 'Smart Planner', icon: '\u25B6' },
  { href: '/session',     label: 'Session',       icon: '\u270E' },
  { href: '/library',     label: 'Library',       icon: '\u2605' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/alerts`, { credentials: 'include' })
        const data = await res.json()
        setAlertCount(Array.isArray(data) ? data.length : 0)
      } catch { /* ignore */ }
    }
    fetchAlerts()
    const id = setInterval(fetchAlerts, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <nav className="flex lg:flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              isActive
                ? 'bg-accent-blue/20 text-accent-blue font-medium'
                : 'text-slate-400 hover:text-white hover:bg-surface-700'
            }`}
          >
            <span className="text-xs">{item.icon}</span>
            <span>{item.label}</span>
            {item.href === '/results' && alertCount > 0 && (
              <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px]
                             flex items-center justify-center font-bold">
                {alertCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
