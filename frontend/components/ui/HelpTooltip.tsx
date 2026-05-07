'use client'

import { useState, ReactNode } from 'react'

interface HelpTooltipProps {
  /** Title shown bold at the top of the tooltip. */
  title: string
  /** Body content — string or rich JSX (formula spans, links, etc.). */
  children: ReactNode
  /** Tooltip width. Default 260px. */
  width?: number
  /** Anchor side of the tooltip relative to the ? button. Default 'bottom-right'. */
  side?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Override aria-label for the trigger button. */
  ariaLabel?: string
}

/**
 * Tiny `?` button that toggles an explanatory popover. Used to surface where
 * a metric comes from (backend route, formula, last-updated time) without
 * cluttering the main UI.
 *
 * Hover-on-pointer-devices + click-to-pin (also keyboard-accessible).
 */
export default function HelpTooltip({
  title,
  children,
  width = 260,
  side = 'bottom-right',
  ariaLabel = 'What is this number?',
}: HelpTooltipProps) {
  const [open, setOpen] = useState(false)

  const sideClasses: Record<NonNullable<HelpTooltipProps['side']>, string> = {
    'bottom-right': 'top-full mt-2 right-0',
    'bottom-left':  'top-full mt-2 left-0',
    'top-right':    'bottom-full mb-2 right-0',
    'top-left':     'bottom-full mb-2 left-0',
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
        aria-label={ariaLabel}
        className="w-3.5 h-3.5 rounded-full border border-slate-600 text-slate-500 hover:text-white hover:border-white/40 flex items-center justify-center text-[8px] font-bold leading-none"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute ${sideClasses[side]} z-30 rounded-lg p-3 text-left shadow-xl normal-case`}
          style={{ width, background: '#0a0d14', border: '1px solid rgba(255,255,255,0.12)' }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{title}</span>
          <span className="block text-[11px] text-slate-300 leading-relaxed">{children}</span>
        </span>
      )}
    </span>
  )
}
