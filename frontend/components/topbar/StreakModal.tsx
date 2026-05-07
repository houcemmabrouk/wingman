'use client'

import { Modal, ModalCard } from '@/components/ui/Modal'

interface StreakDay {
  date: string
  active: boolean
  dow: string
}

interface StreakModalProps {
  open: boolean
  onClose: () => void
  streak: number
  days: StreakDay[]
}

function formatLongDate(iso: string): string {
  try {
    const [y, m, d] = iso.split('-').map(Number)
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    return `${d} ${months[(m ?? 1) - 1]} ${y}`
  } catch { return iso }
}

export default function StreakModal({ open, onClose, streak, days }: StreakModalProps) {
  const last7 = days.slice(-7)
  const activeCount = last7.filter(d => d.active).length

  const headline =
    streak === 0      ? 'Lance la machine'           :
    streak < 3        ? 'Bon démarrage'              :
    streak < 7        ? 'Tu construis le rythme'     :
    streak < 14       ? 'Une semaine complète'       :
    streak < 30       ? 'Habitude installée'         :
                        'Discipline rare'

  const detail =
    streak === 0      ? 'Une session aujourd\'hui suffit à amorcer la série.' :
    streak < 3        ? 'Le coût mental de l\'arrêt augmente à partir de 3 jours.' :
    streak < 7        ? 'Encore quelques jours et la routine devient automatique.' :
    streak < 14       ? 'À 14 jours la rétention SRS s\'aligne avec le calendrier examen.' :
                        'Tu protèges ce qu\'aucune session de rattrapage ne remplace.'

  return (
    <Modal open={open} onClose={onClose}>
      <ModalCard className="max-w-md">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.14em]">Streak</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white text-lg leading-none"
              aria-label="Fermer"
            >×</button>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-5xl font-black text-emerald-400 tabular-nums leading-none">{streak}</span>
            <span className="text-sm text-slate-400">jour{streak > 1 ? 's' : ''} d&apos;affilée</span>
          </div>
          <p className="text-[13px] font-semibold text-white">{headline}</p>
          <p className="text-[12px] text-slate-400 mt-1">{detail}</p>
        </div>

        <div className="px-5 pb-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-2">
            7 derniers jours · {activeCount}/7 actifs
          </div>
          <div className="flex items-center justify-between gap-2">
            {last7.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                {day.active ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-600 bg-transparent" />
                )}
                <span className="text-[10px] text-slate-500">{day.dow}</span>
              </div>
            ))}
          </div>
        </div>

        {last7.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.06] text-[11px] text-slate-500">
            Du {formatLongDate(last7[0].date)} à aujourd&apos;hui.
          </div>
        )}
      </ModalCard>
    </Modal>
  )
}
