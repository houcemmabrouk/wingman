'use client'

import { Modal, ModalCard } from '@/components/ui/Modal'
import { TOPICS, TOPIC_COLORS, TOPIC_ORDER, EXAM_WEIGHTS } from '@/lib/lm-data'

interface TopicMastery {
  code: string
  mastery: number
}

interface ProgressModalProps {
  open: boolean
  onClose: () => void
  globalPct: number
  goalPct: number
  topics: TopicMastery[]
}

function masteryColor(pct: number, goalPct: number): string {
  if (pct >= goalPct) return '#22c55e'  // emerald
  if (pct >= 50)      return '#3b82f6'  // blue
  if (pct >= 30)      return '#f59e0b'  // amber
  return '#ef4444'                       // red
}

export default function ProgressModal({ open, onClose, globalPct, goalPct, topics }: ProgressModalProps) {
  const gap = goalPct - globalPct
  const onTrack = globalPct >= goalPct

  // Index by code for quick lookup; topics may come in any order
  const byCode = Object.fromEntries(topics.map(t => [t.code, t.mastery]))

  // Sort: weight × (gap to goal) DESC — surfaces what's most worth lifting
  const sorted = [...TOPIC_ORDER]
    .map(code => ({
      code,
      name:    TOPICS[code]        ?? code,
      weight:  EXAM_WEIGHTS[code]  ?? 0,
      mastery: byCode[code]        ?? 0,
    }))
    .map(t => ({ ...t, leverage: t.weight * Math.max(0, goalPct - t.mastery) }))
    .sort((a, b) => b.leverage - a.leverage)

  const headline =
    onTrack            ? 'Tu es au-dessus du seuil'                      :
    gap < 5            ? 'Quasi à la zone safe'                          :
    gap < 15           ? 'Trajectoire à tenir'                           :
    gap < 25           ? 'Marche à franchir, gap chiffré'                :
                         'Gros levier disponible — le rattrapage paie'

  const detail =
    onTrack            ? 'Le passage est probable au rythme actuel. Garde l\'effort sur la rétention.' :
    gap < 5            ? `Encore ${gap}pt et tu touches le seuil ${goalPct}%. Concentre-toi sur le levier #1 ci-dessous.` :
    gap < 15           ? `${gap}pt à combler. Au rythme adaptatif, c\'est 2-3 semaines de travail ciblé sur les topics levier.` :
                         `${gap}pt à combler. Le tri ci-dessous met d\'abord les topics où chaque % gagné rapporte le plus (poids × écart au seuil).`

  return (
    <Modal open={open} onClose={onClose}>
      <ModalCard className="max-w-xl">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.14em]">Global Progress</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white text-lg leading-none"
              aria-label="Fermer"
            >×</button>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span
              className="text-5xl font-black tabular-nums leading-none"
              style={{ color: masteryColor(globalPct, goalPct) }}
            >
              {globalPct}
            </span>
            <span className="text-sm text-slate-400">/ {goalPct}% seuil de passage</span>
          </div>

          <p className="text-[13px] font-semibold text-white">{headline}</p>
          <p className="text-[12px] text-slate-400 mt-1">{detail}</p>

          {/* Visual bar with target marker */}
          <div className="mt-4 h-2 rounded-full bg-white/[0.06] overflow-hidden relative">
            <div
              className="absolute top-0 bottom-0 w-px bg-white/40 z-10"
              style={{ left: `${goalPct}%` }}
              title={`Seuil ${goalPct}%`}
            />
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(2, globalPct)}%`,
                background: masteryColor(globalPct, goalPct),
              }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
            <span>0%</span>
            <span style={{ marginLeft: `${goalPct}%` }} className="-translate-x-1/2">
              ↑ {goalPct}%
            </span>
            <span>100%</span>
          </div>
        </div>

        {/* Topic breakdown */}
        <div className="px-5 py-4 overflow-y-auto">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-3">
            Top levier d&apos;impact · poids × écart au seuil
          </div>
          <ul className="flex flex-col gap-2.5">
            {sorted.map((t, i) => {
              const color = TOPIC_COLORS[t.code] ?? '#475569'
              const masteryHex = masteryColor(t.mastery, goalPct)
              const above = t.mastery >= goalPct
              return (
                <li key={t.code} className="grid grid-cols-[24px_60px_1fr_auto] items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-600 tabular-nums text-right">#{i + 1}</span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white text-center"
                    style={{ backgroundColor: color }}
                  >
                    {t.code}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[12px] text-slate-200 truncate">{t.name}</div>
                    <div className="mt-1 h-1 rounded-full bg-white/[0.05] overflow-hidden relative">
                      <div
                        className="absolute top-0 bottom-0 w-px bg-white/30 z-10"
                        style={{ left: `${goalPct}%` }}
                      />
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(2, t.mastery)}%`,
                          background: masteryHex,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5 shrink-0">
                    <span
                      className="text-[13px] font-bold tabular-nums"
                      style={{ color: masteryHex }}
                    >
                      {Math.round(t.mastery)}%
                    </span>
                    <span className="text-[10px] text-slate-500 tabular-nums">
                      · {t.weight}% poids
                    </span>
                    {above && <span className="text-[10px] text-emerald-400">✓</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="px-5 py-3 border-t border-white/[0.06] text-[11px] text-slate-500">
          Moyenne pondérée par le poids d&apos;examen · seuil de passage CFA L1 ≈ 70%.
        </div>
      </ModalCard>
    </Modal>
  )
}
