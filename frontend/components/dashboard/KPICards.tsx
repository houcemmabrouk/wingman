'use client'

import { useEffect, useState } from 'react'

interface KPICardsProps {
  globalScore: number
  passRate: number
  projectedScore: number
  atRiskTopics: string[]
  daysToExam: number
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let frame: number
    const start = performance.now()
    const dur = 1000
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(e * value))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <>{display}{suffix}</>
}

function scoreColor(v: number) {
  if (v >= 70) return 'text-emerald-400'
  if (v >= 60) return 'text-amber-400'
  return 'text-red-400'
}

export default function KPICards({ globalScore, passRate, projectedScore, atRiskTopics, daysToExam }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Score global */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Score global</p>
        <p className={`text-4xl font-bold tabular-nums ${scoreColor(globalScore)}`}>
          <AnimatedNumber value={globalScore} suffix="%" />
        </p>
        <p className="text-[10px] text-slate-600 mt-1">moyenne ponderee</p>
      </div>

      {/* Pass rate */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Pass Rate</p>
        <p className={`text-4xl font-bold tabular-nums ${scoreColor(passRate)}`}>
          <AnimatedNumber value={passRate} suffix="%" />
        </p>
        <p className="text-[10px] text-slate-600 mt-1">topics au-dessus MPS</p>
      </div>

      {/* Projected score */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Score J-exam</p>
        <p className={`text-4xl font-bold tabular-nums ${scoreColor(projectedScore)}`}>
          <AnimatedNumber value={projectedScore} suffix="%" />
        </p>
        <p className="text-[10px] text-slate-600 mt-1">projection lineaire</p>
      </div>

      {/* At risk */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Topics a risque</p>
        <p className="text-4xl font-bold tabular-nums text-red-400">
          <AnimatedNumber value={atRiskTopics.length} />
        </p>
        <p className="text-[10px] text-slate-600 mt-1 truncate">{atRiskTopics.join(' · ')}</p>
      </div>
    </div>
  )
}
