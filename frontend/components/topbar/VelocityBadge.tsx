'use client'

import { forwardRef } from 'react'
import MiniSparkline from './MiniSparkline'

export interface VelocityBadgeProps {
  velocityPct: number
  status: string
  onTrack: boolean
  trend: { readiness: number }[]
  label: string
  onClick: () => void
  /** Compact variant hides the sparkline (tablet widths). */
  compact?: boolean
}

function signedPct(v: number): string {
  const rounded = Math.round(v * 10) / 10
  const abs = Math.abs(rounded).toFixed(1)
  if (rounded > 0)  return `+${abs}`
  if (rounded < 0)  return `-${abs}`
  return '0.0'
}

function valueColor(velocityPct: number): string {
  if (velocityPct >  0.1) return '#00e0b8'
  if (velocityPct < -0.1) return '#ff4d4d'
  return '#9ca3af'
}

function dotColor(status: string, onTrack: boolean): string | null {
  if (status === 'insufficient_data') return null
  if (onTrack) return '#00e0b8'
  if (status === 'steady' || status === 'fast') return '#ffc845'
  return '#ff4d4d'  // declining, stagnant, slow (+ off-track)
}

const VelocityBadge = forwardRef<HTMLButtonElement, VelocityBadgeProps>(function VelocityBadge(
  { velocityPct, status, onTrack, trend, label, onClick, compact = false },
  ref,
) {
  const insufficient = status === 'insufficient_data'
  const color = valueColor(velocityPct)
  const dot = dotColor(status, onTrack)
  const showSparkline = !compact && !insufficient && trend.length >= 2
  const sparkData = trend.slice(-14).map(t => t.readiness)

  const signed = insufficient ? '—' : signedPct(velocityPct)
  const ariaLabel = insufficient
    ? 'Velocity: not enough data yet. Click to view details.'
    : `Progress velocity: ${signed}% per week, ${label}. Click to view details.`

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={insufficient ? 'Velocity appears after ~3 days of activity' : undefined}
      className="flex flex-col gap-0.5 px-2.5 py-1 rounded-lg hover:bg-white/[0.05] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
      style={{ transition: 'background-color 150ms ease-in-out' }}
    >
      <span className="text-[11px] font-semibold text-white uppercase tracking-wider leading-none text-left flex items-center gap-1">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}
             strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {velocityPct >= 0 ? (
            <>
              <polyline points="3 17 9 11 13 15 21 7" />
              <polyline points="14 7 21 7 21 14" />
            </>
          ) : (
            <>
              <polyline points="3 7 9 13 13 9 21 17" />
              <polyline points="14 17 21 17 21 10" />
            </>
          )}
        </svg>
        Velocity
      </span>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[14px] font-black tabular-nums leading-none" style={{ color }}>
          {signed}
          {!insufficient && (
            <span className="text-[11px] font-semibold ml-0.5" style={{ color, opacity: 0.7 }}>
              %/w
            </span>
          )}
        </span>
        {showSparkline && (
          <MiniSparkline data={sparkData} width={50} height={16} color={color} strokeWidth={1.5} />
        )}
        {dot && (
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${status === 'exceptional' ? 'animate-pulse' : ''}`}
            style={{ background: dot, boxShadow: `0 0 6px ${dot}` }}
            aria-hidden
          />
        )}
      </div>
    </button>
  )
})

export default VelocityBadge
