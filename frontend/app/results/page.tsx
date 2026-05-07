'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Diagnostic imports ───────────────────────────────────
import { useDashboard } from '@/hooks/useDashboard'
import KPICards from '@/components/dashboard/KPICards'
import TopicBars from '@/components/dashboard/TopicBars'
import DashAlertsFeed from '@/components/dashboard/AlertsFeed'
import ProgressChart from '@/components/dashboard/ProgressChart'
import RadarChart from '@/components/dashboard/RadarChart'
import RadarKPI5, { type RadarKPI5Data } from '@/components/dashboard/RadarKPI5'
import PassRateChart from '@/components/dashboard/PassRateChart'
import DailyPlan from '@/components/dashboard/DailyPlan'
import DashHeatmapGrid from '@/components/dashboard/HeatmapGrid'
import FatigueCurve from '@/components/dashboard/FatigueCurve'
import ConsistencyChart from '@/components/dashboard/ConsistencyChart'
import ProjectionChart from '@/components/dashboard/ProjectionChart'
import RepeatErrorChart from '@/components/dashboard/RepeatErrorChart'
import SRSAdherenceChart from '@/components/dashboard/SRSAdherenceChart'
import MetricCard from '@/components/ui/MetricCard'
import Link from 'next/link'

// ── Performance imports ──────────────────────────────────
import ProgressCurve from '@/components/ProgressCurve'
import LMScoreTable from '@/components/LMScoreTable'
import ExportButton from '@/components/ExportButton'

// ── LOS Results import ───────────────────────────────────
import LOSResults from '@/components/LOSResults'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const FALLBACK_UID = '00000000-0000-0000-0000-000000000001'
function getUID(): string {
  if (typeof window === 'undefined') return FALLBACK_UID
  try { const u = localStorage.getItem('wingman_user'); if (u) { const p = JSON.parse(u); if (p.user_id) return p.user_id } } catch {}
  return FALLBACK_UID
}

const TABS = [
  { key: 'diagnostic', label: 'Diagnostic' },
  { key: 'performance', label: 'Performance' },
  { key: 'los', label: 'LOS Results' },
] as const

type TabKey = (typeof TABS)[number]['key']

// ── Diagnostic Tab (powered by /api/kpis) ───────────────

interface KPIData {
  total_sessions: number; completion_rate: number; abandon_rate: number
  avg_session_duration_min: number; avg_focus_score: number; avg_quiz_score: number
  concept_accuracy_rate: number; study_days_last_14: number; consistency_score: number
  retention_score: number; error_quality_score: number; confidence_calibration_score: number
  mastery_score: number; readiness_score: number; trap_error_rate: number
  overconfidence_gap: number; coach_effectiveness_score: number; dropoff_risk_score: number
  days_since_last_session: number; coverage_pct: number; total_questions_attempted: number
  weak_areas: { concept_tag: string; error_rate: number; attempts: number; errors: number }[]
  strong_areas: { concept_tag: string; accuracy: number; attempts: number; corrects: number }[]
}

function ScoreRing({ value, label, color, size = 80 }: { value: number; label: string; color: string; size?: number }) {
  const r = (size - 12) / 2
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-lg font-extrabold text-white">{Math.round(value)}</span>
      </div>
      <span className="text-[9px] uppercase tracking-wider text-slate-500 mt-1">{label}</span>
    </div>
  )
}

function DiagnosticTab() {
  const [kpi, setKpi] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/kpis`, { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(d => setKpi(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white/[0.04] rounded-xl" />)}</div>
      <div className="grid grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-white/[0.04] rounded-xl" />)}</div>
    </div>
  )
  if (error || !kpi) return <div className="text-center py-20 text-red-400 text-sm">{error || 'No data'}</div>

  const masteryColor = kpi.mastery_score >= 70 ? '#22c55e' : kpi.mastery_score >= 50 ? '#f59e0b' : '#ef4444'
  const readyColor = kpi.readiness_score >= 70 ? '#22c55e' : kpi.readiness_score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="space-y-5">
      {/* Hero scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5 flex flex-col items-center relative">
          <ScoreRing value={kpi.mastery_score} label="Mastery Score" color={masteryColor} size={90} />
          <div className="text-[10px] text-slate-500 mt-2">Quiz {kpi.avg_quiz_score}% · Retention {kpi.retention_score}%</div>
        </div>
        <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5 flex flex-col items-center relative">
          <ScoreRing value={kpi.readiness_score} label="Readiness Score" color={readyColor} size={90} />
          <div className="text-[10px] text-slate-500 mt-2">Coverage {kpi.coverage_pct}% · {kpi.total_questions_attempted} questions</div>
        </div>
        <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5 space-y-3">
          <div className="flex justify-between"><span className="text-[11px] text-slate-500">Sessions</span><span className="text-[14px] font-bold text-white">{kpi.total_sessions}</span></div>
          <div className="flex justify-between"><span className="text-[11px] text-slate-500">Completion</span><span className="text-[14px] font-bold text-emerald-400">{kpi.completion_rate}%</span></div>
          <div className="flex justify-between"><span className="text-[11px] text-slate-500">Avg Duration</span><span className="text-[14px] font-bold text-white">{kpi.avg_session_duration_min}m</span></div>
          <div className="flex justify-between"><span className="text-[11px] text-slate-500">Consistency</span><span className="text-[14px] font-bold text-blue-400">{kpi.study_days_last_14}/14 days</span></div>
        </div>
      </div>

      {/* Radar KPI5 — V_c · Acc_1 · T_eff · R_coeff · P_strat (cf. docs/kpis_catalog.md § L) */}
      {(() => {
        // Mock-derived from existing KPI fields. Champs réels manquants
        // (T_eff par Q, P_strat sur Big 4) à wirer quand exposés côté backend.
        const radarData: RadarKPI5Data = {
          vc: kpi.coverage_pct,                                  // proxy : coverage = velocity output
          acc1: kpi.avg_quiz_score,                              // proxy : EOC pas distingué pour l'instant
          teff: 78,                                              // mock — pas d'avg_time_per_q exposé
          rcoeff: kpi.retention_score,                           // proxy : SRS adherence
          pstrat: Math.round((kpi.mastery_score + kpi.avg_quiz_score) / 2),  // proxy Big 4
        }
        return <RadarKPI5 data={radarData} />
      })()}

      {/* Performance metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Focus Score', value: kpi.avg_focus_score, color: kpi.avg_focus_score >= 70 ? '#22c55e' : '#f59e0b' },
          { label: 'Quiz Accuracy', value: kpi.concept_accuracy_rate, color: kpi.concept_accuracy_rate >= 70 ? '#22c55e' : '#f59e0b' },
          { label: 'Error Quality', value: kpi.error_quality_score, color: kpi.error_quality_score >= 70 ? '#22c55e' : '#f59e0b' },
          { label: 'Calibration', value: kpi.confidence_calibration_score, color: kpi.confidence_calibration_score >= 70 ? '#22c55e' : '#f59e0b' },
        ].map(m => (
          <div key={m.label} className="rounded-xl bg-surface-800/60 border border-white/[0.06] p-4 text-center">
            <div className="text-[22px] font-extrabold tabular-nums" style={{ color: m.color }}>{m.value}%</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Weak + Strong areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-surface-800/60 border border-white/[0.06] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Weak Areas</span>
          </div>
          <div className="space-y-2">
            {kpi.weak_areas.map((w, i) => (
              <div key={w.concept_tag || i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                <span className="text-[11px] font-semibold text-white flex-1">{(w.concept_tag || 'unknown').replace(/_/g, ' ')}</span>
                <div className="w-20 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-red-400" style={{ width: `${w.error_rate}%` }} />
                </div>
                <span className="text-[11px] font-bold text-red-400 tabular-nums w-12 text-right">{w.error_rate}%</span>
                <span className="text-[9px] text-slate-600">{w.attempts}q</span>
              </div>
            ))}
            {kpi.weak_areas.length === 0 && <p className="text-[11px] text-slate-600">No weak areas detected yet</p>}
          </div>
        </div>

        <div className="rounded-xl bg-surface-800/60 border border-white/[0.06] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Strong Areas</span>
          </div>
          <div className="space-y-2">
            {kpi.strong_areas.map((s, i) => (
              <div key={s.concept_tag || i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                <span className="text-[11px] font-semibold text-white flex-1">{(s.concept_tag || 'unknown').replace(/_/g, ' ')}</span>
                <div className="w-20 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${s.accuracy}%` }} />
                </div>
                <span className="text-[11px] font-bold text-emerald-400 tabular-nums w-12 text-right">{s.accuracy}%</span>
                <span className="text-[9px] text-slate-600">{s.attempts}q</span>
              </div>
            ))}
            {kpi.strong_areas.length === 0 && <p className="text-[11px] text-slate-600">No strong areas detected yet</p>}
          </div>
        </div>
      </div>

      {/* Risk + Coach */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl bg-surface-800/60 border border-white/[0.06] p-4 text-center">
          <div className="text-[22px] font-extrabold tabular-nums" style={{ color: kpi.trap_error_rate > 20 ? '#ef4444' : '#f59e0b' }}>{kpi.trap_error_rate}%</div>
          <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-1">Trap Error Rate</div>
        </div>
        <div className="rounded-xl bg-surface-800/60 border border-white/[0.06] p-4 text-center">
          <div className="text-[22px] font-extrabold tabular-nums" style={{ color: kpi.overconfidence_gap > 10 ? '#ef4444' : kpi.overconfidence_gap > 0 ? '#f59e0b' : '#22c55e' }}>{kpi.overconfidence_gap > 0 ? '+' : ''}{kpi.overconfidence_gap}%</div>
          <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-1">Overconfidence Gap</div>
        </div>
        <div className="rounded-xl bg-surface-800/60 border border-white/[0.06] p-4 text-center">
          <div className="text-[22px] font-extrabold tabular-nums" style={{ color: kpi.coach_effectiveness_score >= 70 ? '#22c55e' : '#f59e0b' }}>{kpi.coach_effectiveness_score}%</div>
          <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-1">Coach Effectiveness</div>
        </div>
        <div className="rounded-xl bg-surface-800/60 border border-white/[0.06] p-4 text-center">
          <div className="text-[22px] font-extrabold tabular-nums" style={{ color: kpi.dropoff_risk_score >= 60 ? '#ef4444' : kpi.dropoff_risk_score >= 40 ? '#f59e0b' : '#22c55e' }}>{kpi.dropoff_risk_score}</div>
          <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-1">Drop-off Risk</div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/session" className="bg-blue-500 hover:bg-blue-600 text-white text-center py-3 rounded-lg text-sm font-medium transition-colors">Start Session</Link>
        <Link href="/session?mode=srs" className="bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-center py-3 rounded-lg text-sm font-medium transition-colors">Review SRS</Link>
        <Link href="/session?mode=mock" className="bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-center py-3 rounded-lg text-sm font-medium transition-colors">Launch Mock</Link>
        <Link href="/library" className="bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-center py-3 rounded-lg text-sm font-medium transition-colors">Library</Link>
      </div>
    </div>
  )
}

// ── Performance Tab ──────────────────────────────────────

interface CurvePoint {
  date: string
  avg_score: number
  sessions_count: number
}

interface LMScore {
  module_code: string
  module_title: string
  avg_score: number
  attempt_count: number
  topic_code: string
}

function PerformanceTab() {
  const [curve, setCurve] = useState<CurvePoint[]>([])
  const [scores, setScores] = useState<LMScore[]>([])

  const fetchData = useCallback(async () => {
    try {
      const [curveRes, scoresRes] = await Promise.all([
        fetch(`${API_URL}/api/performance/curve?days=30`, { credentials: 'include' }),
        fetch(`${API_URL}/api/performance/scores`, { credentials: 'include' }),
      ])
      setCurve(await curveRes.json())
      if (scoresRes.ok) {
        setScores(await scoresRes.json())
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Performance</h2>
        <ExportButton />
      </div>
      <ProgressCurve data={curve} />
      <LMScoreTable scores={scores} />
    </div>
  )
}

// ── Main Results Page ────────────────────────────────────

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('diagnostic')
  const [helpOpen, setHelpOpen] = useState(false)

  // Sync with URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as TabKey
    if (TABS.some(t => t.key === hash)) {
      setActiveTab(hash)
    }
  }, [])

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key)
    window.history.replaceState(null, '', `#${key}`)
  }

  return (
    <div className="space-y-5" suppressHydrationWarning>
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-white">Results</h1>
        <button
          onClick={() => setHelpOpen(true)}
          title="Aide — comment lire les KPI"
          className="w-6 h-6 rounded-full border border-white/[0.12] text-slate-400 hover:text-white hover:border-white/[0.3] hover:bg-white/[0.04] transition-colors flex items-center justify-center text-[12px] font-bold"
        >
          ?
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04]">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white/[0.08] text-white'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — lazy mounted */}
      {activeTab === 'diagnostic' && <DiagnosticTab />}
      {activeTab === 'performance' && <PerformanceTab />}
      {activeTab === 'los' && <LOSResults />}

      {helpOpen && <KpiHelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  )
}

// ── KPI Help Modal — Framework CFA L1 (cf. docs/kpis.md) ────────────────────

interface KpiHelpItem {
  label: string
  formula: string
  interpretation: string
  thresholds: { critical: string; watch: string; healthy: string }
}

interface KpiCategory {
  title: string
  description: string
  items: KpiHelpItem[]
}

const KPI_FRAMEWORK: KpiCategory[] = [
  {
    title: '1. Couverture (quantitatif)',
    description: 'Avancement « physique » dans le curriculum.',
    items: [
      {
        label: 'LOS Completion Rate',
        formula: '% de Learning Outcome Statements validés / total des LOS du programme.',
        interpretation: 'Combien tu as physiquement parcouru. Un LOS « validé » = lu + au moins 1 quiz passé.',
        thresholds: { critical: '< 40% à T-90j', watch: '40-80%', healthy: '100% avant T-30j' },
      },
      {
        label: 'Reading Velocity',
        formula: 'Readings terminés / semaine, comparé au rythme nécessaire pour finir 4-6 sem. avant l\'examen (« buffer zone »).',
        interpretation: 'Si tu lis plus lentement que le rythme cible, tu n\'auras pas de buffer pour réviser.',
        thresholds: { critical: '< 50% du rythme cible', watch: '50-100%', healthy: '≥ 100%' },
      },
      {
        label: 'Burn-down',
        formula: 'Pages ou chapitres restants / temps disponible. Graphe linéaire descendant.',
        interpretation: 'Ta pente actuelle vs la pente théorique pour finir à temps.',
        thresholds: { critical: 'Pente < pente théorique', watch: '≈ pente théorique', healthy: 'Pente > pente théorique' },
      },
    ],
  },
  {
    title: '2. Maîtrise (qualitatif)',
    description: 'C\'est ici que se joue la réussite. Un chapitre lu n\'est pas un chapitre acquis.',
    items: [
      {
        label: 'QBank Score / Topic',
        formula: 'Précision moyenne en QBank par topic (ETH, FSA, FI, ...).',
        interpretation: 'Si un topic descend sous 65%, il passe en Alerte Rouge. ≥ 70% = cible MPS-friendly.',
        thresholds: { critical: '< 65% (Alerte Rouge)', watch: '65-70%', healthy: '≥ 70%' },
      },
      {
        label: 'First-pass vs Second-pass Accuracy',
        formula: 'Précision au 1ᵉʳ passage d\'une question vs au 2ᵉ passage de la même question.',
        interpretation: 'Un gap large entre 1ᵉʳ et 2ᵉ passage = apprentissage réel. Un gap nul = mémorisation des réponses, pas de compréhension.',
        thresholds: { critical: 'Δ < 5 pts (mémorisation)', watch: 'Δ 5-15 pts', healthy: 'Δ ≥ 15 pts (apprentissage)' },
      },
      {
        label: 'Time / Question',
        formula: 'Temps moyen passé par question.',
        interpretation: 'Le CFA est une course contre la montre. Trop lent = tu n\'auras pas le temps à l\'examen.',
        thresholds: { critical: '> 120 s ou < 45 s', watch: '90-120 s', healthy: '≈ 90 s (cible L1)' },
      },
    ],
  },
  {
    title: '3. Rétention (long-term)',
    description: 'Le programme est si vaste que l\'on oublie les premiers chapitres en avançant.',
    items: [
      {
        label: 'Spaced Review Score',
        formula: 'Score sur quiz aléatoire portant uniquement sur des chapitres étudiés il y a > 30 jours.',
        interpretation: 'Mesure du décrochage long-terme. Bas = tu oublies les chapitres anciens — il faut espacer plus.',
        thresholds: { critical: '< 50%', watch: '50-70%', healthy: '≥ 70%' },
      },
      {
        label: 'Confidence Index (1-5)',
        formula: 'Auto-évaluation 1-5 sur chaque lecture (« je me sens à 4/5 sur ce chapitre »), comparée au QBank Score du topic.',
        interpretation: 'Confidence = 5 mais QBank = 40% → biais cognitif (overconfidence) à corriger d\'urgence. Confidence basse + QBank haute = tu doutes inutilement.',
        thresholds: { critical: 'Gap |confiance × 20 − QBank| > 25 pts', watch: 'Gap 15-25 pts', healthy: 'Gap < 15 pts' },
      },
    ],
  },
  {
    title: '4. Mock Exams (phase finale)',
    description: 'À activer dans le dernier mois.',
    items: [
      {
        label: 'Delta Progression',
        formula: 'Score Mock N+1 − Score Mock N (entre 2 examens blancs consécutifs).',
        interpretation: 'Si Δ < 0 ou stagne, ta méthode ne marche pas. Plateau accepté seulement si déjà au-dessus du MPS.',
        thresholds: { critical: 'Δ < 0', watch: 'Δ 0-3 pts', healthy: 'Δ ≥ 3 pts' },
      },
      {
        label: 'Error Type Distribution',
        formula: 'Répartition des fautes en 3 buckets : knowledge_gap / misinterpretation / calculation.',
        interpretation: 'Si calculation > 30% → fatigue ou vitesse. Si misinterpretation > 30% → relire 2× chaque énoncé. Si knowledge_gap > 50% → tu n\'es pas prêt.',
        thresholds: { critical: 'knowledge_gap > 50%', watch: 'Une catégorie > 30%', healthy: 'Distribution ≈ 33/33/33' },
      },
    ],
  },
]

function KpiHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
         onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] bg-surface-900 border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <div className="text-base font-bold text-white">Comprendre les KPI</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Calcul · Interprétation · Seuils de surveillance</div>
          </div>
          <button onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-5">
          <div className="rounded-lg bg-blue-500/[0.06] border border-blue-500/20 p-3 text-[12px] text-slate-300 leading-relaxed">
            <strong className="text-blue-400">Lecture des seuils.</strong> Chaque KPI a 3 zones :
            <span className="ml-2 text-red-400 font-semibold">🔴 critical</span> = action requise,
            <span className="ml-2 text-amber-400 font-semibold">🟠 watch</span> = à surveiller,
            <span className="ml-2 text-emerald-400 font-semibold">🟢 healthy</span> = OK.
            Les seuils ci-dessous sont des defaults — calibrés pour un candidat CFA L1 visant 70%+ à l\'examen, à T ≥ 60 jours.
          </div>

          {KPI_FRAMEWORK.map(cat => (
            <section key={cat.title} className="space-y-3">
              <div>
                <h2 className="text-[13px] font-bold text-white">{cat.title}</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">{cat.description}</p>
              </div>
              {cat.items.map(k => (
                <div key={k.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <h3 className="text-[13px] font-bold text-white mb-2">{k.label}</h3>
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">Calcul</div>
                      <div className="text-[12px] text-slate-300 leading-relaxed">{k.formula}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-0.5">Interprétation</div>
                      <div className="text-[12px] text-slate-300 leading-relaxed">{k.interpretation}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Seuils de surveillance</div>
                      <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                        <div className="rounded bg-red-500/10 border border-red-500/20 px-2 py-1.5">
                          <div className="text-red-400 font-bold mb-0.5">🔴 Critical</div>
                          <div className="text-slate-400">{k.thresholds.critical}</div>
                        </div>
                        <div className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-1.5">
                          <div className="text-amber-400 font-bold mb-0.5">🟠 Watch</div>
                          <div className="text-slate-400">{k.thresholds.watch}</div>
                        </div>
                        <div className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5">
                          <div className="text-emerald-400 font-bold mb-0.5">🟢 Healthy</div>
                          <div className="text-slate-400">{k.thresholds.healthy}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ))}

          {/* 5. Indice de Maîtrise Pondéré */}
          <section className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4">
            <h2 className="text-[13px] font-bold text-violet-300 mb-1">5. Indice de Maîtrise Pondéré (par topic)</h2>
            <p className="text-[11px] text-slate-400 mb-3">Score composite, calculé à la volée pour chaque topic.</p>
            <div className="rounded bg-black/30 border border-white/[0.06] p-3 font-mono text-[12px] text-slate-200 mb-2 text-center">
              Score<sub>Topic</sub> = (T<sub>c</sub> × 0.3) + (Q<sub>acc</sub> × 0.5) + (R<sub>acc</sub> × 0.2)
            </div>
            <ul className="text-[11px] text-slate-300 space-y-0.5">
              <li><code className="text-violet-300">T<sub>c</sub></code> — Taux de complétion du chapitre</li>
              <li><code className="text-violet-300">Q<sub>acc</sub></code> — Précision sur les questions d&apos;entraînement</li>
              <li><code className="text-violet-300">R<sub>acc</sub></code> — Précision lors des sessions de révision globale</li>
            </ul>
            <p className="text-[11px] text-slate-400 mt-2">
              La maîtrise (Q<sub>acc</sub>) pèse 50% — avancer sans maîtriser est un piège.
            </p>
          </section>

          {/* 6. Allocation MPS */}
          <section className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
            <h2 className="text-[13px] font-bold text-amber-300 mb-1">6. Allocation MPS-orientée</h2>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
              <strong className="text-amber-300">L&apos;objectif n&apos;est pas 100% partout — c&apos;est d&apos;atteindre le MPS.</strong>
              {' '}Si tu plafonnes sur un topic à faible poids (ex: Derivatives 5%), bascule l&apos;énergie sur un topic à fort poids (FSA 13-17%, Ethics 15-20%).
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5">
                <div className="text-emerald-400 font-bold">High-leverage</div>
                <div className="text-slate-400">Ethics (15-20%) · FSA (13-17%)</div>
              </div>
              <div className="rounded bg-blue-500/10 border border-blue-500/20 px-2 py-1.5">
                <div className="text-blue-400 font-bold">Standard</div>
                <div className="text-slate-400">FI · Equity (~10% chacun)</div>
              </div>
              <div className="rounded bg-slate-500/10 border border-slate-500/20 px-2 py-1.5">
                <div className="text-slate-400 font-bold">Solidifier</div>
                <div className="text-slate-500">Quants · Eco · Corp · PM (8-12%)</div>
              </div>
              <div className="rounded bg-red-500/10 border border-red-500/20 px-2 py-1.5">
                <div className="text-red-400 font-bold">Plafond OK</div>
                <div className="text-slate-400">Derivatives · Alternatives (5-8%)</div>
              </div>
            </div>
          </section>

          <div className="text-[10px] text-slate-600 text-center pt-2">
            Voir <code>docs/kpis.md</code> pour la spec complète. Certains champs ne sont pas encore exposés côté backend (Time/Question, Confidence Index, First-pass vs Second-pass) — implémentation progressive.
          </div>
        </div>
      </div>
    </div>
  )
}
