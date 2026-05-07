'use client'

import { useEffect, useState } from 'react'
import { DailyBriefData } from '@/lib/api'
import {
  Badge,
  RARITY_STYLES,
  BADGE_ICONS,
  getRecentlyUnlockedBadges,
  seedDemoBadges,
} from '@/lib/badges'
import StreakDots from './StreakDots'

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  )
}

function SmallBadgeIcon({ badge }: { badge: Badge }) {
  const iconPath = BADGE_ICONS[badge.icon]
  const style = RARITY_STYLES[badge.rarity]

  if (!iconPath) return null

  return (
    <div
      className="w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0"
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        boxShadow: style.glow,
      }}
      title={badge.name}
    >
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke={style.text}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={iconPath} />
      </svg>
    </div>
  )
}

export default function DailyBrief({ data }: { data: DailyBriefData | null }) {
  const [recentBadges, setRecentBadges] = useState<Badge[]>([])

  useEffect(() => {
    seedDemoBadges()
    setRecentBadges(getRecentlyUnlockedBadges(3))
  }, [])

  if (!data) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-surface-700 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-surface-700 rounded" />
          ))}
        </div>
      </div>
    )
  }

  const pct = data.daily_minutes_goal > 0
    ? Math.min(100, Math.round((data.today_minutes / data.daily_minutes_goal) * 100))
    : 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="card-header mb-0">Daily Brief</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <StreakDots />
        <StatBox label="XP Total" value={data.xp_total.toLocaleString()} />
        <StatBox label="Sessions" value={data.today_sessions} sub="today" />
        <StatBox label="Cards Due" value={data.cards_due} />
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{data.today_minutes} min</span>
          <span>Goal {data.daily_minutes_goal} min</span>
        </div>
        <div className="w-full bg-surface-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              pct >= 100 ? 'bg-accent-green' : pct >= 50 ? 'bg-accent-blue' : 'bg-accent-amber'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Recent badges preview */}
      {recentBadges.length > 0 && (
        <div className="mt-3 pt-3 border-t border-surface-600">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Recent</span>
            <div className="flex items-center gap-1.5">
              {recentBadges.map(badge => (
                <SmallBadgeIcon key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
