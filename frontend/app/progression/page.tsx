'use client'

/**
 * /progression — independent page (extracted back out of /results Progression tab).
 *
 * Combines IVA gauge + side panels + topic mastery heatmap + alerts feed.
 * Toutes les données dérivent d'endpoints existants — pas de wiring backend.
 */

import { useEffect, useState } from 'react'
import IVAGauge, { IVASidePanels, type IVAData } from '@/components/IVAGauge'
import HeatmapGrid from '@/components/HeatmapGrid'
import AlertsFeed from '@/components/AlertsFeed'
import ProgressFocus from '@/components/ProgressFocus'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface HeatmapItem {
  lm_code: string
  lm_title: string
  topic: string
  mastery_level: number
  attempts: number
}

interface AlertItem {
  id: number
  alert_type: string
  title: string
  body: string | null
  created_at: string
}

export default function ProgressionPage() {
  const [iva, setIva] = useState<IVAData | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/readiness/`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_URL}/api/kpis/los-mastery`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API_URL}/api/alerts`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([readiness, mastery, alertsData]) => {
      const v = readiness?.velocity
      const m = readiness?.metrics
      if (v && m) {
        const required = Math.max(0.1, v.required_velocity_to_target || 0.5)
        const ivaScore = Math.max(0, Math.min(1.2, (v.velocity_weekly_pct || 0) / required))
        setIva({
          iva: ivaScore,
          delta: 0,
          velocityActual: Number((v.velocity_weekly_pct || 0).toFixed(2)),
          velocityRequired: Number(required.toFixed(2)),
          masteryScore: Math.round(m.coverage_retention_pct || 0),
          readingsRemaining: Math.max(0, (m.total_lms || 0) - (m.seen_lms || 0)),
          weeksRemaining: Math.max(1, Math.ceil((v.days_to_exam || 0) / 7) - 4),
        })
      }
      if (Array.isArray(mastery)) setHeatmap(mastery)
      if (Array.isArray(alertsData)) setAlerts(alertsData)
    }).finally(() => setLoading(false))
  }, [])

  const dismissAlert = (id: number) => setAlerts(prev => prev.filter(a => a.id !== id))

  if (loading) {
    return (
      <div className="space-y-4 max-w-[1100px] animate-pulse">
        <div className="h-44 bg-white/[0.04] rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-32 bg-white/[0.04] rounded-xl" />
          <div className="h-32 bg-white/[0.04] rounded-xl" />
          <div className="h-32 bg-white/[0.04] rounded-xl" />
        </div>
        <div className="h-64 bg-white/[0.04] rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-[1100px]">
      {iva ? (
        <>
          <IVAGauge data={iva} />
          <IVASidePanels data={iva} />
        </>
      ) : (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 text-[12px] text-amber-300">
          Pas encore assez d&apos;historique pour calculer l&apos;IVA. Reviens après quelques sessions.
        </div>
      )}

      <ProgressFocus />

      {heatmap.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Mastery by topic</div>
          <HeatmapGrid items={heatmap} />
        </div>
      )}

      {alerts.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Alerts</div>
          <AlertsFeed alerts={alerts} onDismiss={dismissAlert} />
        </div>
      )}
    </div>
  )
}
