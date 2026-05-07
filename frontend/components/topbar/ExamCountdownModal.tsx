'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Modal, ModalCard } from '@/components/ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  /** Date ISO string from wingman_onboarding.exam_date — null if not set. */
  examDateIso: string | null
}

interface CountdownParts {
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
  weeks: number
  months: number
  weekdayLong: string
  formattedDate: string
  isPast: boolean
}

function computeCountdown(iso: string | null): CountdownParts | null {
  if (!iso) return null
  const target = new Date(iso + 'T08:00:00').getTime()
  const now = Date.now()
  const totalMs = target - now
  const isPast = totalMs <= 0
  const abs = Math.abs(totalMs)
  const days = Math.floor(abs / 86400000)
  const hours = Math.floor((abs % 86400000) / 3600000)
  const minutes = Math.floor((abs % 3600000) / 60000)
  const seconds = Math.floor((abs % 60000) / 1000)
  const weeks = Math.floor(days / 7)
  const months = Math.round((days / 30.44) * 10) / 10
  const dt = new Date(iso + 'T00:00:00')
  const weekdayLong = dt.toLocaleDateString('fr-FR', { weekday: 'long' })
  const formattedDate = dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  return { totalMs, days, hours, minutes, seconds, weeks, months, weekdayLong, formattedDate, isPast }
}

interface Milestone {
  label: string
  daysOut: number
  description: string
  cta?: { label: string; href: string }
}

const MILESTONES: Milestone[] = [
  { label: 'T-90', daysOut: 90, description: 'Première mock complète obligatoire — baseline + plan correctif.', cta: { label: 'Lance un mock', href: '/mock-exams' } },
  { label: 'T-60', daysOut: 60, description: 'Sweep complet : un drill par topic à >50% mastery cible.', cta: { label: 'Open Inspector', href: '/exam-overview' } },
  { label: 'T-30', daysOut: 30, description: 'Phase finale — mocks fréquents (1-2/semaine), plus de nouveau contenu.', cta: { label: 'Mocks history', href: '/mock-exams' } },
  { label: 'T-14', daysOut: 14, description: 'Verrouille les forces, pas de nouvelle leak. Spaced repetition 100%.', cta: { label: 'Memory', href: '/memory' } },
  { label: 'T-7', daysOut: 7, description: 'Repos cognitif : 1h/jour max, mocks light, sommeil prioritaire.' },
  { label: 'T-1', daysOut: 1, description: 'Aucune nouvelle révision. Vérifie matériel + itinéraire centre d&apos;examen.' },
  { label: 'T-0', daysOut: 0, description: 'Jour J. Respiration. Tu es prêt.' },
]

export default function ExamCountdownModal({ open, onClose, examDateIso }: Props) {
  const [tick, setTick] = useState(0)

  // Live-tick the countdown every second while modal is open.
  useEffect(() => {
    if (!open) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [open])

  const cd = useMemo(() => computeCountdown(examDateIso), [examDateIso, tick])

  if (!cd) {
    return (
      <Modal open={open} onClose={onClose} panelClassName="w-full max-w-[500px]">
        <ModalCard>
          <div className="px-5 py-6 text-center space-y-3">
            <h2 className="text-[15px] font-bold text-white">Exam date not set</h2>
            <p className="text-[12px] text-slate-400 leading-relaxed">
              Add your CFA exam date in onboarding to unlock the countdown and milestone plan.
            </p>
            <Link href="/onboarding" onClick={onClose}
                  className="inline-block px-4 py-2 rounded-lg text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
              Set exam date →
            </Link>
          </div>
        </ModalCard>
      </Modal>
    )
  }

  const urgencyColor =
    cd.isPast ? '#94a3b8' :
    cd.days < 14 ? '#ef4444' :
    cd.days < 60 ? '#f59e0b' :
    cd.days < 120 ? '#fbbf24' :
                    '#22c55e'

  // Active milestone — the next non-passed one.
  const activeMs = MILESTONES.find(m => m.daysOut <= cd.days) || MILESTONES[MILESTONES.length - 1]

  return (
    <Modal open={open} onClose={onClose} panelClassName="w-full max-w-[560px]">
      <ModalCard>
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-[15px] font-bold text-white">Exam Countdown</h2>
            <p className="text-[10px] text-slate-500">{cd.weekdayLong} · {cd.formattedDate}</p>
          </div>
          <button onClick={onClose}
                  aria-label="Close"
                  className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Hero — big countdown */}
          <div className="px-5 py-5 border-b border-white/[0.04] text-center">
            {cd.isPast ? (
              <div className="text-[36px] font-black leading-none" style={{ color: urgencyColor }}>EXAM PASSED</div>
            ) : (
              <>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-[64px] font-black leading-none tabular-nums" style={{ color: urgencyColor }}>
                    {cd.days}
                  </span>
                  <span className="text-[14px] text-slate-500 font-semibold">days</span>
                </div>
                <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-slate-400 tabular-nums font-mono">
                  <span><span className="text-white font-bold">{cd.weeks}</span> weeks</span>
                  <span className="text-slate-600">·</span>
                  <span><span className="text-white font-bold">{cd.months}</span> months</span>
                </div>
                {/* Live HMS */}
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: urgencyColor }} />
                  <span className="text-[13px] font-mono tabular-nums text-slate-300">
                    {cd.hours.toString().padStart(2, '0')}h {cd.minutes.toString().padStart(2, '0')}m {cd.seconds.toString().padStart(2, '0')}s
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Active milestone */}
          {!cd.isPast && (
            <div className="px-5 py-4 border-b border-white/[0.04]">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">Current phase</div>
              <div className="rounded-lg p-3" style={{ background: `${urgencyColor}10`, borderLeft: `2px solid ${urgencyColor}` }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: urgencyColor }}>{activeMs.label}</span>
                  <span className="text-[10px] text-slate-500">·</span>
                  <span className="text-[10px] text-slate-400">{cd.days - activeMs.daysOut} days into this phase</span>
                </div>
                <p className="text-[12px] text-slate-300 leading-relaxed">{activeMs.description}</p>
                {activeMs.cta && (
                  <Link href={activeMs.cta.href} onClick={onClose}
                        className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300">
                    {activeMs.cta.label} →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Milestone roadmap */}
          {!cd.isPast && (
            <div className="px-5 py-4 border-b border-white/[0.04]">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-3">Roadmap</div>
              <div className="space-y-1.5">
                {MILESTONES.map(ms => {
                  const passed = cd.days < ms.daysOut
                  const active = ms.label === activeMs.label
                  const daysAway = cd.days - ms.daysOut
                  return (
                    <div key={ms.label}
                         className={`flex items-start gap-2.5 p-2 rounded transition-colors ${active ? 'bg-white/[0.04]' : ''}`}>
                      <span className={`text-[10px] font-mono font-bold w-9 shrink-0 mt-0.5 tabular-nums ${
                        active ? '' : passed ? 'text-slate-600' : 'text-slate-400'
                      }`} style={active ? { color: urgencyColor } : undefined}>
                        {ms.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] leading-snug ${passed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                          {ms.description}
                        </p>
                        <span className="text-[9px] text-slate-600 tabular-nums">
                          {passed ? `${Math.abs(daysAway)}d ago` : daysAway === 0 ? 'today' : `in ${daysAway}d`}
                        </span>
                      </div>
                      {ms.cta && !passed && (
                        <Link href={ms.cta.href} onClick={onClose}
                              className="text-[9px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 shrink-0">
                          Go →
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="px-5 py-3 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500">Wrong date?</span>
            <Link href="/onboarding" onClick={onClose}
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white">
              Update exam date →
            </Link>
          </div>
        </div>
      </ModalCard>
    </Modal>
  )
}
