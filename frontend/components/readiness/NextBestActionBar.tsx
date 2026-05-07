'use client'

import { ArrowUpRight } from 'lucide-react'
import type { NextBestAction } from '@/lib/readiness/types'
import { sendPrompt } from '@/lib/readiness/sendPrompt'

interface Props {
  data: NextBestAction
}

export default function NextBestActionBar({ data }: Props) {
  return (
    <section className="rounded-xl border border-teal-700/40 bg-teal-900/15 p-6">
      <span className="text-[10px] tracking-[0.08em] uppercase text-teal-300/80">
        If you only do one thing today
      </span>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-100 leading-relaxed flex-1 min-w-[260px]">{data.body}</p>
        <button
          type="button"
          onClick={() => sendPrompt(data.prompt)}
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-teal-50 transition-colors duration-150 hover:bg-teal-500"
        >
          Operate
          <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </section>
  )
}
