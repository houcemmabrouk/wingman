'use client'

import { TOPIC_COLORS } from '@/lib/lm-data'

interface NBAData {
  topic: string | null
  lm: string | null
  los: string | null
  action_text: string
  deadline: string
  priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string
  mastery_pct?: number
  exam_weight_pct?: number
  urgency_score?: number
  days_until_exam?: number
  module_title?: string
  // Recent error signal — count of wrong answers in the last 7 days on this LOS.
  // Drives the urgency boost the backend applies (+5 per recent error).
  recent_errors_count?: number
  last_error_at?: string | null
  base_urgency?: number
}

interface NBADashboardProps {
  data: NBAData
  onExecute?: () => void
}

const PRIORITY_STYLES: Record<string, { color: string; tint: string; label: string; pulse: boolean }> = {
  CRITICAL: { color: '#ef4444', tint: 'rgba(239,68,68,.08)',  label: 'Critical', pulse: true  },
  HIGH:     { color: '#f59e0b', tint: 'rgba(245,158,11,.07)', label: 'High',     pulse: true  },
  MEDIUM:   { color: '#6c8cff', tint: 'rgba(108,140,255,.06)', label: 'Medium',  pulse: false },
  LOW:      { color: '#22c55e', tint: 'rgba(34,197,94,.06)',  label: 'Low',     pulse: false },
}

function formatDeadline(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export const NBADashboard = ({ data, onExecute }: NBADashboardProps) => {
  const p = PRIORITY_STYLES[(data.priority || 'MEDIUM').toUpperCase()] || PRIORITY_STYLES.MEDIUM
  const topicColor = data.topic ? TOPIC_COLORS[data.topic] || '#6c8cff' : '#6c8cff'
  const isCritical = (data.priority || '').toUpperCase() === 'CRITICAL'
  const isHigh = (data.priority || '').toUpperCase() === 'HIGH'

  return (
    <>
      <style jsx>{`
        @keyframes nba-pulse-ring {
          0%, 100% { box-shadow: 0 0 0 1px ${p.color}22, 0 0 32px ${p.color}22, 0 12px 40px ${p.color}11; }
          50%      { box-shadow: 0 0 0 1px ${p.color}55, 0 0 56px ${p.color}55, 0 12px 60px ${p.color}33; }
        }
        @keyframes nba-pulse-dot {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(1.4); }
        }
        @keyframes nba-deadline-flash {
          0%, 100% { color: #fff; text-shadow: 0 0 8px ${p.color}aa; }
          50%      { color: ${p.color}; text-shadow: 0 0 14px ${p.color}; }
        }
        @keyframes nba-bar-shimmer {
          0%   { transform: translateY(-100%); opacity: 0.0; }
          50%  { opacity: 0.8; }
          100% { transform: translateY(100%); opacity: 0.0; }
        }
        .nba-card { animation: ${p.pulse ? 'nba-pulse-ring 2.4s ease-in-out infinite' : 'none'}; }
        .nba-dot  { animation: ${p.pulse ? 'nba-pulse-dot 1.2s ease-in-out infinite' : 'none'}; }
        .nba-countdown-critical { animation: nba-deadline-flash 1.4s ease-in-out infinite; }
        .nba-bar-shimmer { animation: nba-bar-shimmer 2.2s linear infinite; }
      `}</style>

      <div
        className="nba-card relative rounded-[18px] p-5 sm:p-6 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${p.tint} 0%, rgba(9,14,28,.55) 60%)`,
          border: `1px solid ${p.color}55`,
        }}
      >
        {/* Left accent bar in priority color */}
        <div
          className="absolute top-0 bottom-0 left-0 w-[4px] overflow-hidden"
          style={{ background: p.color }}
        >
          {p.pulse && (
            <div
              className="nba-bar-shimmer absolute inset-x-0 h-1/3"
              style={{ background: 'linear-gradient(180deg, transparent, #fff, transparent)' }}
            />
          )}
        </div>

        {/* Header strip */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.06] pl-2">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full inline-flex items-center gap-1.5"
              style={{ background: p.tint, border: `1px solid ${p.color}77`, color: p.color }}
            >
              <span
                className="nba-dot inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }}
              />
              {p.label}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Next Best Action
            </span>
          </div>
          <span className="text-[11px] tabular-nums">
            {typeof data.days_until_exam === 'number' && (
              <>
                <span
                  className={isCritical ? 'nba-countdown-critical font-bold' : 'font-bold text-white'}
                  style={isHigh ? { color: p.color } : undefined}
                >
                  {data.days_until_exam}d
                </span>
                <span className="text-slate-600"> · </span>
              </>
            )}
            <span className="text-slate-500">{data.deadline && formatDeadline(data.deadline)}</span>
          </span>
        </div>

        {/* Topic / LM / LOS labels */}
        <div className="flex items-center gap-2 mb-3 flex-wrap pl-2">
          {data.topic && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
              style={{ background: topicColor }}
            >
              {data.topic}
            </span>
          )}
          {data.lm && (
            <span className="text-[10px] font-mono text-slate-400">{data.lm}</span>
          )}
          {data.los && (
            <span className="text-[10px] font-mono text-slate-500">· {data.los}</span>
          )}
          {data.module_title && (
            <span className="text-[11px] text-slate-300 truncate">{data.module_title}</span>
          )}
        </div>

        {/* Action text */}
        <p className="text-[18px] sm:text-[20px] leading-snug text-white font-semibold mb-5 pl-2">
          {data.action_text}
        </p>

        {/* KPI strip */}
        {(data.mastery_pct != null || data.exam_weight_pct != null || data.urgency_score != null) && (
          <div className={`grid ${(data.recent_errors_count ?? 0) > 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-2 mb-5 pl-2`}>
            {data.mastery_pct != null && (
              <div className="rounded-[10px] p-2.5" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                <div className="text-[8px] text-slate-500 uppercase tracking-wider">Mastery</div>
                <div
                  className="text-[16px] font-extrabold tabular-nums mt-0.5"
                  style={{
                    color: data.mastery_pct >= 70 ? '#22c55e' : data.mastery_pct >= 40 ? '#f59e0b' : '#ef4444',
                  }}
                >
                  {data.mastery_pct.toFixed(1)}%
                </div>
              </div>
            )}
            {data.exam_weight_pct != null && (
              <div className="rounded-[10px] p-2.5" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                <div className="text-[8px] text-slate-500 uppercase tracking-wider">Exam weight</div>
                <div className="text-[16px] font-extrabold tabular-nums mt-0.5" style={{ color: '#a0b4ff' }}>
                  {data.exam_weight_pct.toFixed(1)}%
                </div>
              </div>
            )}
            {(data.recent_errors_count ?? 0) > 0 && (
              <div
                className="rounded-[10px] p-2.5"
                style={{ background: 'rgba(244,63,94,.10)', border: '1px solid rgba(244,63,94,.30)' }}
                title={data.last_error_at ? `Dernière erreur : ${new Date(data.last_error_at).toLocaleString('fr-FR')}` : undefined}
              >
                <div className="text-[8px] uppercase tracking-wider" style={{ color: '#fda4af' }}>Errors 7d</div>
                <div className="text-[16px] font-extrabold tabular-nums mt-0.5" style={{ color: '#f43f5e' }}>
                  {data.recent_errors_count}
                </div>
              </div>
            )}
            {data.urgency_score != null && (
              <div className="rounded-[10px] p-2.5" style={{ background: p.tint, border: `1px solid ${p.color}33` }}>
                <div className="text-[8px] uppercase tracking-wider" style={{ color: `${p.color}cc` }}>Urgency</div>
                <div className="text-[16px] font-extrabold tabular-nums mt-0.5" style={{ color: p.color }}>
                  {data.urgency_score.toFixed(0)}
                </div>
                {data.base_urgency != null && data.base_urgency !== data.urgency_score && (
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    base {data.base_urgency.toFixed(0)} · +{(data.urgency_score - data.base_urgency).toFixed(0)} from errors
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/[0.04] pl-2">
          <span className="text-[11px] text-slate-500">
            Picked by mastery × exam weight
            {(data.recent_errors_count ?? 0) > 0 && (
              <> · boosted by <span className="text-rose-300 font-semibold">{data.recent_errors_count} recent error{(data.recent_errors_count ?? 0) > 1 ? 's' : ''}</span></>
            )}
          </span>
          <button
            onClick={onExecute}
            disabled={!onExecute}
            className="px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: p.color,
              boxShadow: p.pulse ? `0 0 20px ${p.color}77` : 'none',
            }}
          >
            Start session →
          </button>
        </div>
      </div>
    </>
  )
}

export default NBADashboard
