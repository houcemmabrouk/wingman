'use client'

import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { sendPrompt } from '@/lib/readiness/sendPrompt'

interface Props {
  number: number
  question: string
  state: ReactNode
  viz: ReactNode
  guidance: string
  actionLabel: string
  actionPrompt: string
  primary?: boolean
}

export default function QuestionCard({
  number,
  question,
  state,
  viz,
  guidance,
  actionLabel,
  actionPrompt,
  primary,
}: Props) {
  const buttonClass = primary
    ? 'inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-teal-50 transition-colors duration-150 hover:bg-teal-500'
    : 'inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-teal-700 px-3 py-1.5 text-xs text-teal-300 transition-colors duration-150 hover:bg-teal-900/30'

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-800/40 p-6">
      <header className="mb-4">
        <span className="text-[10px] tracking-[0.08em] uppercase text-slate-500">
          Question {number}
        </span>
        <h2 className="text-lg font-medium text-slate-100 mt-0.5 leading-snug">{question}</h2>
      </header>

      <div className="text-slate-300 mb-5">{state}</div>

      <div className="mb-5">{viz}</div>

      <p className="text-sm text-slate-400 leading-relaxed mb-5">{guidance}</p>

      <button type="button" onClick={() => sendPrompt(actionPrompt)} className={buttonClass}>
        {actionLabel}
        <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    </section>
  )
}
