'use client'

import { useEffect, useRef, useState } from 'react'

interface MetricCardProps {
  label: string
  value: number
  suffix?: string
  color?: string
}

export default function MetricCard({ label, value, suffix = '', color }: MetricCardProps) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame: number
    const start = performance.now()
    const duration = 1000
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(Math.round(eased * value))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return (
    <div ref={ref} className="bg-surface-800/60 rounded-lg px-4 py-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color || 'text-white'}`}>
        {display}{suffix}
      </p>
    </div>
  )
}
