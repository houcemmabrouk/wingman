'use client'

import { ReadinessStatus, styleFor, fmtPct } from './status'

interface GaugeCardProps {
  title: string
  value: number                // 0..100
  target?: number              // threshold marker (e.g. 70)
  status: ReadinessStatus | string
  subtitle?: string
  variant?: 'primary' | 'secondary'
}

export default function GaugeCard({
  title,
  value,
  target,
  status,
  subtitle,
  variant = 'primary',
}: GaugeCardProps) {
  const s = styleFor(status)
  const clamped = Math.max(0, Math.min(100, value))
  const isExcellent = status === 'excellent'
  const valueSize = variant === 'primary' ? 'text-[44px]' : 'text-[30px]'
  const padding   = variant === 'primary' ? 'p-5 sm:p-6' : 'p-4 sm:p-5'

  return (
    <div
      className={`rounded-[18px] ${padding} relative overflow-hidden`}
      style={{
        background: 'linear-gradient(135deg, rgba(9,14,28,.65) 0%, rgba(9,14,28,.35) 100%)',
        border: `1px solid ${s.border}`,
        boxShadow: isExcellent ? s.glow : undefined,
        transition: 'all 200ms ease-in-out',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
          {title}
        </h3>
        <span
          className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full shrink-0"
          style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
        >
          {s.label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-3">
        <span
          className={`${valueSize} font-extrabold tabular-nums leading-none`}
          style={{ color: s.color, textShadow: isExcellent ? `0 0 16px ${s.color}88` : undefined }}
        >
          {fmtPct(clamped)}
        </span>
        {target != null && (
          <span className="text-[11px] text-slate-500 tabular-nums">target {fmtPct(target)}</span>
        )}
      </div>

      {/* Bar + target marker */}
      <div
        className="relative h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,.06)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${clamped}%`,
            background: s.color,
            transition: 'width 200ms ease-in-out',
          }}
        />
        {target != null && (
          <div
            className="absolute top-[-4px] bottom-[-4px] pointer-events-none"
            style={{
              left: `${Math.max(0, Math.min(100, target))}%`,
              width: 0,
              borderLeft: '1px dashed rgba(255,255,255,.45)',
            }}
            aria-hidden
          />
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">{subtitle}</p>
      )}
    </div>
  )
}
