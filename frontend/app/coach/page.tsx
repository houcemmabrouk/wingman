'use client'

/**
 * /coach — page unique du chat coach (manifest v4 § 2).
 *
 * Layout 2 colonnes desktop : diagnostic situation (Coach embedded) à gauche,
 * chat conversationnel (CoachSession) sticky à droite. Stack vertical en mobile.
 * Plus de panneau cut off — tout est dans le flow de la page.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Coach from '@/components/layout/Coach'
import CoachSession from '@/components/CoachSession'

type Energy = 'high' | 'mid' | 'low'

export default function CoachPage() {
  const router = useRouter()
  const [energy, setEnergy] = useState<Energy>('high')
  const [timeBudgetMin, setTimeBudgetMin] = useState(60)
  const [topicProgress, setTopicProgress] = useState<Record<string, number>>({})

  useEffect(() => {
    try {
      const e = localStorage.getItem('wingman_today_energy') as Energy | null
      if (e === 'high' || e === 'mid' || e === 'low') setEnergy(e)
      const t = parseInt(localStorage.getItem('wingman_today_time') || '60', 10)
      if (!Number.isNaN(t) && t > 0) setTimeBudgetMin(t)
      const tp = localStorage.getItem('wingman_topic_progress')
      if (tp) setTopicProgress(JSON.parse(tp))
    } catch {}
  }, [])

  const handleBuild = (proposal: { duration_min: number; lm_codes: string[]; session_mode: string }) => {
    // Hand the proposal to /sessions which knows how to instantiate it.
    const params = new URLSearchParams({
      mode:     proposal.session_mode,
      modules:  proposal.lm_codes.join(','),
      duration: String(proposal.duration_min),
    })
    router.push(`/sessions?${params.toString()}`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 max-w-[1400px]">
      <div className="min-w-0">
        <Coach embedded />
      </div>
      <div className="lg:sticky lg:top-4 lg:self-start min-w-0">
        <CoachSession
          energy={energy}
          timeBudgetMin={timeBudgetMin}
          topicProgress={topicProgress}
          lmProgress={{}}
          onBuild={handleBuild}
        />
      </div>
    </div>
  )
}
