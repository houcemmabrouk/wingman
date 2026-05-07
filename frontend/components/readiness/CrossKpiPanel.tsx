'use client'

import type { CrossKpiDiagnosis } from '@/lib/readiness/types'

const TONE_BAR: Record<CrossKpiDiagnosis['tone'], string> = {
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
}

interface Props {
  diagnoses: CrossKpiDiagnosis[]
}

export default function CrossKpiPanel({ diagnoses }: Props) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-800/40 p-6">
      <span className="text-[10px] tracking-[0.08em] uppercase text-slate-500">
        What this means together
      </span>
      <ul className="mt-4 space-y-4">
        {diagnoses.map(d => (
          <li key={d.title} className="flex gap-3">
            <span className={`w-0.5 rounded-full shrink-0 ${TONE_BAR[d.tone]}`} aria-hidden />
            <div>
              <p className="text-sm font-medium text-slate-100 leading-snug">{d.title}</p>
              <p className="text-sm text-slate-400 leading-relaxed mt-1">{d.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
