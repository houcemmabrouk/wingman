'use client'

import { useEffect, useState } from 'react'
import { getLast7DaysStatus, getCurrentStreak, seedDemoBadges } from '@/lib/badges'

interface DayStatus {
  date: string
  active: boolean
  dayLabel: string
}

export default function StreakDots() {
  const [days, setDays] = useState<DayStatus[]>([])
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    seedDemoBadges()
    setDays(getLast7DaysStatus())
    setStreak(getCurrentStreak())
  }, [])

  // Compute consecutive streak ending at each day (for gold star logic)
  function getConsecutiveCountAt(index: number): number {
    let count = 0
    for (let i = index; i >= 0; i--) {
      if (days[i]?.active) {
        count++
      } else {
        break
      }
    }
    return count
  }

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-1.5">
        {days.map((day, i) => {
          const consecutiveCount = getConsecutiveCountAt(i)
          const isGoldStar = day.active && consecutiveCount > 0 && consecutiveCount % 7 === 0

          return (
            <div key={day.date} className="flex flex-col items-center gap-1">
              {isGoldStar ? (
                /* Gold star for every 7th consecutive day */
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="#f59e0b"
                  stroke="#f59e0b"
                  strokeWidth={1}
                >
                  <path d="M12 2l2.09 6.26L20.18 9.27l-4.64 4.53L16.54 20 12 16.9 7.46 20l1-6.2-4.64-4.53 6.09-1.01L12 2z" />
                </svg>
              ) : day.active ? (
                /* Green filled dot */
                <div className="w-3.5 h-3.5 rounded-full bg-accent-green shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
              ) : (
                /* Gray empty dot */
                <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600 bg-transparent" />
              )}
              <span className="text-[9px] text-slate-500 leading-none">{day.dayLabel}</span>
            </div>
          )
        })}
      </div>
      <p className="text-lg font-bold text-white leading-tight">{streak}j</p>
      <p className="text-xs text-slate-400 mt-0.5">Streak</p>
    </div>
  )
}
