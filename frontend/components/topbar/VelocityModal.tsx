'use client'

import { useRouter } from 'next/navigation'
import { Modal, ModalCard } from '@/components/ui/Modal'
import MiniSparkline from './MiniSparkline'

export interface VelocityResult {
  velocity_weekly_pct: number
  velocity_status: string
  velocity_label: string
  velocity_is_sufficient: boolean
  velocity_floor_required: number
  days_to_exam: number
  projected_readiness_at_exam: number
  required_velocity_to_target: number
  on_track_for_exam: boolean
  trend: { date: string; readiness: number; retention: number; coverage: number }[]
  history_points: number
  current_readiness: number
  baseline_date: string
}

export interface VelocityVerdict {
  severity: 'success' | 'info' | 'neutral' | 'warning' | 'critical' | string
  headline: string
  detail: string
}

interface VelocityModalProps {
  open: boolean
  onClose: () => void
  velocity: VelocityResult
  verdict: VelocityVerdict
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  success:  { bg: 'rgba(0,224,184,0.08)',  border: '#00e0b8', text: '#6ee7d0' },
  info:     { bg: 'rgba(108,140,255,0.08)', border: '#6c8cff', text: '#a0b4ff' },
  neutral:  { bg: 'rgba(255,255,255,0.04)', border: '#475569', text: '#cbd5e1' },
  warning:  { bg: 'rgba(255,140,66,0.10)',  border: '#ff8c42', text: '#ffb088' },
  critical: { bg: 'rgba(255,77,77,0.10)',   border: '#ff4d4d', text: '#ff8a8a' },
}

function sevStyle(s: string) { return SEVERITY_STYLES[s] ?? SEVERITY_STYLES.neutral }

function signed(v: number): string {
  const r = Math.round(v * 10) / 10
  if (r > 0) return `+${r.toFixed(1)}`
  if (r < 0) return `-${Math.abs(r).toFixed(1)}`
  return '0.0'
}

function valueColor(v: number): string {
  if (v >  0.1) return '#00e0b8'
  if (v < -0.1) return '#ff4d4d'
  return '#9ca3af'
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return iso }
}

export default function VelocityModal({ open, onClose, velocity, verdict }: VelocityModalProps) {
  const router = useRouter()
  const v = velocity
  const verdictStyle = sevStyle(verdict.severity)
  const color = valueColor(v.velocity_weekly_pct)
  const insufficient = v.velocity_status === 'insufficient_data'
  const projHitsTarget = v.projected_readiness_at_exam >= 70

  const current = v.current_readiness
  const projected = v.projected_readiness_at_exam
  const target = 70

  const goDashboard = () => {
    onClose()
    router.push('/progression')
  }

  return (
    <Modal open={open} onClose={onClose} panelClassName="w-full max-w-[560px]">
      <ModalCard>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="velocity-modal-title"
          className="flex-1 min-h-0 flex flex-col overflow-hidden"
        >
          {/* Header — flex-shrink-0 so it keeps its intrinsic height */}
          <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h2 id="velocity-modal-title" className="text-[15px] font-bold text-white">
              Progression velocity
            </h2>
            <button onClick={onClose}
                    aria-label="Close"
                    className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Scrollable body — flex-1 + min-h-0 is what makes overflow-y-auto
               actually scroll inside a flex column (flex children default to
               min-height:auto which would otherwise force the parent to grow). */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Hero */}
            <div className="px-5 py-5 border-b border-white/[0.04]">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-[44px] font-black leading-none tabular-nums" style={{ color }}>
                  {insufficient ? '—' : `${signed(v.velocity_weekly_pct)}%`}
                </span>
                <span className="text-[12px] text-slate-500">per week</span>
              </div>
              <p className="text-[16px] font-semibold mt-1" style={{ color }}>
                {v.velocity_label}
              </p>

              <div className="mt-3">
                {insufficient || v.trend.length < 2 ? (
                  <div className="h-20 rounded-lg bg-white/[0.03] border border-dashed border-white/[0.08] flex items-center justify-center">
                    <span className="text-[11px] text-slate-500">
                      A trend chart will appear after a few days of data.
                    </span>
                  </div>
                ) : (
                  <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3">
                    <MiniSparkline
                      data={v.trend.slice(-30).map(t => t.readiness)}
                      width={496}
                      height={80}
                      color={color}
                      strokeWidth={2}
                      fill
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 tabular-nums">
                      <span>{formatDate(v.baseline_date)}</span>
                      <span>Today · {v.history_points} snapshots</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Verdict */}
            <div className="px-5 py-4 border-b border-white/[0.04]">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">
                Verdict
              </div>
              <div
                className="rounded-lg p-3"
                style={{
                  background: verdictStyle.bg,
                  borderLeft: `2px solid ${verdictStyle.border}`,
                }}
              >
                <p className="text-[14px] font-bold mb-1" style={{ color: verdictStyle.text }}>
                  {verdict.headline}
                </p>
                <p className="text-[12px] text-slate-300 leading-relaxed">
                  {verdict.detail}
                </p>
              </div>
            </div>

            {/* Projection track */}
            <div className="px-5 py-4 border-b border-white/[0.04]">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-3">
                Projection
              </div>

              {/* Track */}
              <div className="relative h-1.5 rounded-full mb-6 mt-4" style={{ background: 'rgba(255,255,255,.06)' }}>
                {/* Current filled */}
                <div
                  className="absolute top-0 bottom-0 left-0 rounded-full"
                  style={{ width: `${Math.min(100, current)}%`, background: '#6c8cff' }}
                />
                {/* Projected overlay (dashed) */}
                {!insufficient && projected !== current && (
                  <div
                    className="absolute top-0 bottom-0 rounded-full"
                    style={{
                      left: `${Math.min(100, Math.min(current, projected))}%`,
                      width: `${Math.min(100, Math.abs(projected - current))}%`,
                      background: projHitsTarget
                        ? 'repeating-linear-gradient(90deg, #00e0b8 0 4px, transparent 4px 8px)'
                        : 'repeating-linear-gradient(90deg, #ff8c42 0 4px, transparent 4px 8px)',
                    }}
                  />
                )}
                {/* Target marker */}
                <div
                  className="absolute -top-1 -bottom-1 w-px bg-white/70"
                  style={{ left: `${target}%` }}
                />
                {/* Current dot */}
                <div
                  className="absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-[3px]"
                  style={{ left: `${Math.min(100, current)}%`, background: '#6c8cff', boxShadow: '0 0 8px rgba(108,140,255,.5)' }}
                />
                {/* Projected circle (hollow) */}
                {!insufficient && (
                  <div
                    className="absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-[3px] border-2"
                    style={{
                      left: `${Math.min(100, projected)}%`,
                      background: '#0a0d14',
                      borderColor: projHitsTarget ? '#00e0b8' : '#ff8c42',
                    }}
                  />
                )}
              </div>

              {/* Labels below */}
              <div className="grid grid-cols-3 gap-2 text-[11px] tabular-nums">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500">Current</div>
                  <div className="font-bold" style={{ color: '#a0b4ff' }}>{current.toFixed(1)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] uppercase tracking-wider text-slate-500">Projected</div>
                  <div className="font-bold" style={{ color: projHitsTarget ? '#00e0b8' : '#ffb088' }}>
                    {insufficient ? '—' : `${projected.toFixed(1)}%`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-slate-500">Target</div>
                  <div className="font-bold text-white">{target}%</div>
                </div>
              </div>

              <div className="mt-4 text-[12px] text-slate-400 leading-relaxed">
                {v.days_to_exam} days to exam.{' '}
                {insufficient
                  ? 'A projection will appear once velocity is measurable.'
                  : <>At the current pace: <span className="font-semibold text-white">{projected.toFixed(1)}%</span>. Target: {target}%. Required velocity: <span className="font-semibold text-white">+{v.required_velocity_to_target.toFixed(1)}%/week</span>.</>}
              </div>
            </div>

            {/* Details */}
            <div className="px-5 py-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">
                Details
              </div>
              <dl className="space-y-1.5 text-[12px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Current pace</dt>
                  <dd className="font-mono tabular-nums text-white">{insufficient ? '—' : `${signed(v.velocity_weekly_pct)}%/week`}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Required pace</dt>
                  <dd className="font-mono tabular-nums text-white">
                    {v.velocity_floor_required > 0 ? `+${v.velocity_floor_required.toFixed(1)}%/week` : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">History</dt>
                  <dd className="font-mono tabular-nums text-white">{v.history_points} snapshots</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-400">Window</dt>
                  <dd className="font-mono tabular-nums text-white">
                    {formatDate(v.baseline_date)} → today
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Footer — shrink-0 so it sticks to the bottom, body scrolls above it */}
          <div className="shrink-0 px-5 py-3 border-t border-white/[0.06] flex justify-end">
            <button
              onClick={goDashboard}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              View dashboard →
            </button>
          </div>
        </div>
      </ModalCard>
    </Modal>
  )
}
