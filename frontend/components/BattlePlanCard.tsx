'use client'

import type { SessionData } from '@/lib/sessionMatrix'
import { SIGNAL_COLORS } from '@/lib/sessionMatrix'

const PANEL_BG = '#10182d'
const CARD_BG = '#0d1627'
const ACCENT_BLUE = '#6c8cff'
const BLUE_LIGHT = '#a0b4ff'
const BORDER = 'rgba(255,255,255,.06)'

interface Props {
  session: SessionData
  onReset: () => void
  onStart: () => void
  onTogglePanel: (tab: 'custom' | 'lib') => void
}

export default function BattlePlanCard({ session, onReset, onStart, onTogglePanel }: Props) {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto" style={{ padding: '16px 20px' }}>
      {/* Eyebrow */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: ACCENT_BLUE }} />
        <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,.4)' }}>
          {session.eyebrow}
        </span>
      </div>

      {/* Title */}
      <h1 className="mb-1" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em', color: '#fff', lineHeight: 1.15 }}>
        {session.title}
      </h1>
      <p className="mb-4" style={{ fontSize: 12, color: 'rgba(255,255,255,.32)' }}>
        {session.subtitle}
      </p>

      {/* LM Cards */}
      <div className="space-y-2 mb-4">
        {session.lms.map((lm, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-4"
            style={{ background: CARD_BG, border: '1px solid rgba(108,140,255,.1)', borderRadius: 11 }}
          >
            <div className="shrink-0">
              <span
                className="inline-block px-2 py-1 rounded text-[10px] font-bold"
                style={{ background: 'rgba(108,140,255,.14)', color: BLUE_LIGHT }}
              >
                {lm.badge}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-white mb-0.5">{lm.name}</div>
              <div className="text-[11px]" style={{ color: 'rgba(255,255,255,.35)' }}>{lm.meta}</div>
            </div>
            <span
              className="shrink-0 px-2 py-1 rounded text-[9px] font-bold uppercase"
              style={{ background: lm.typeBg, color: lm.typeColor }}
            >
              {lm.type}
            </span>
          </div>
        ))}
      </div>

      {/* Why card */}
      <div
        className="p-3 mb-4"
        style={{ background: CARD_BG, border: '1px solid rgba(108,140,255,.12)', borderRadius: 11 }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BLUE_LIGHT} strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span className="text-[12px] font-bold" style={{ color: BLUE_LIGHT }}>{session.whyTitle}</span>
        </div>
        <p className="text-[12px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,.45)' }}>
          {session.whyBody}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {session.signals.map((s, i) => {
            const c = SIGNAL_COLORS[s.variant]
            return (
              <span
                key={i}
                className="px-2 py-1 rounded-full text-[9px] font-bold"
                style={{ background: c.bg, color: c.text }}
              >
                {s.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2.5">
        <button
          onClick={onStart}
          className="w-full text-[13px] font-bold text-white transition-all hover:brightness-110"
          style={{ height: 44, borderRadius: 12, background: ACCENT_BLUE }}
        >
          Start Session
        </button>
        <button
          onClick={onReset}
          className="w-full py-2 text-[11px] font-medium transition-all hover:text-white/50"
          style={{ color: 'rgba(255,255,255,.25)', background: 'transparent', border: 'none' }}
        >
          Regenerate
        </button>
      </div>
    </div>
  )
}
