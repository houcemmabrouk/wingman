'use client'

import { ReadinessStatus, styleFor, fmtPct } from './status'

interface StatusBannerProps {
  status: ReadinessStatus | string
  message: string
  verdict: string
  isReady: boolean
  globalPct: number
  targetPct: number
}

function Icon({ isReady, color }: { isReady: boolean; color: string }) {
  if (isReady) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"
           strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <polyline points="8 12 11 15 16 9" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

export default function StatusBanner({
  status,
  message,
  verdict,
  isReady,
  globalPct,
  targetPct,
}: StatusBannerProps) {
  const s = styleFor(status)

  return (
    <div
      className="rounded-[14px] p-3.5"
      style={{
        background: `linear-gradient(135deg, ${s.bg} 0%, rgba(9,14,28,.55) 60%)`,
        border: `1px solid ${s.border}`,
        transition: 'all 200ms ease-in-out',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="shrink-0 rounded-lg p-1.5"
          style={{ background: s.bg, border: `1px solid ${s.border}` }}
        >
          <Icon isReady={isReady} color={s.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full"
              style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
            >
              {isReady ? 'Ready' : s.label}
            </span>
            <p className="text-[13px] font-semibold leading-snug truncate" style={{ color: isReady ? s.color : '#fff' }}>
              {verdict}
            </p>
            <span className="text-[10px] text-slate-500 tabular-nums shrink-0 ml-auto">
              <span className="font-bold" style={{ color: s.color }}>{fmtPct(globalPct)}</span>
              <span className="text-slate-600"> / {fmtPct(targetPct)}</span>
            </span>
          </div>
          {message && (
            <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5 line-clamp-1">{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
