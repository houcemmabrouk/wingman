'use client'

// Indice de Vélocité Adaptatif — gauge en demi-cercle 4 zones avec aiguille.
// Spec : docs/kpis_catalog.md § K + K.bis

import HelpTooltip from '@/components/ui/HelpTooltip'

export interface IVAData {
  iva: number                // 0 — 1.20 typically
  delta?: number             // change vs previous week
  velocityActual: number     // readings/sem actuel
  velocityRequired: number   // readings/sem requis (avec buffer)
  masteryScore: number       // 0-100 (QBank pondéré)
  masterySparkline?: number[] // 4-12 points pour mini-courbe
  readingsRemaining: number
  weeksRemaining: number     // semaines avant T-30j buffer
}

const VAL_MAX = 1.20
// Boundaries — match docs/kpis_catalog.md K.bis
const BOUNDARIES = [0, 0.65, 0.85, 1.10, 1.20]
const ZONES = [
  { from: BOUNDARIES[0], to: BOUNDARIES[1], color: '#ef4444', label: "RISQUE D'ÉCHEC" },
  { from: BOUNDARIES[1], to: BOUNDARIES[2], color: '#eab308', label: 'EN ALERTE' },
  { from: BOUNDARIES[2], to: BOUNDARIES[3], color: '#10b981', label: 'OBJECTIF ATTEINT' },
  { from: BOUNDARIES[3], to: BOUNDARIES[4], color: '#3b82f6', label: "SURPLUS" },
]

function pct(v: number): number {
  return (Math.max(0, Math.min(VAL_MAX, v)) / VAL_MAX) * 100
}

function zoneOf(v: number) {
  return ZONES.find(z => v >= z.from && v < z.to) || ZONES[ZONES.length - 1]
}

export default function IVAGauge({ data }: { data: IVAData }) {
  const zone = zoneOf(data.iva)
  const markerPct = pct(data.iva)
  const isCritical = data.iva < BOUNDARIES[1]
  const isWatch = data.iva >= BOUNDARIES[1] && data.iva < BOUNDARIES[2]

  return (
    <div className="card !p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
            Indice de Vélocité Adaptatif (IVA)
            <HelpTooltip title="IVA — Indice de Vélocité Adaptatif" width={300}>
              Composite <span className="font-mono text-blue-400">rythme × maîtrise</span>.
              Le rythme se mesure en <span className="font-mono">readings/semaine</span> ;
              la maîtrise est ton score moyen QBank.
              <br /><br />
              <span className="text-slate-400 font-bold">4 zones :</span>
              <br />🔴 <span className="text-red-400">&lt; 0.65</span> Risque d&apos;échec —
              rythme et/ou maîtrise insuffisants
              <br />🟡 <span className="text-amber-400">0.65–0.85</span> En alerte — un signal
              à corriger sous 1-2 semaines
              <br />🟢 <span className="text-emerald-400">0.85–1.10</span> Objectif atteint
              <br />🔵 <span className="text-blue-400">&gt; 1.10</span> Surplus — capacité
              d&apos;intensifier ou de prendre du buffer
              <br /><br />
              Source : <span className="font-mono text-slate-500">docs/kpis_catalog.md § K.bis</span>
              — calculé localement à partir des champs <span className="font-mono">velocity_weekly_pct</span>
              et <span className="font-mono">required_velocity_to_target</span> de
              <span className="font-mono"> /api/readiness/</span>.
            </HelpTooltip>
          </h2>
          <p className="text-[10px] text-slate-600">Rythme × Maîtrise — diagnostic combiné</p>
        </div>
        <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full" style={{ background: `${zone.color}22`, color: zone.color, border: `1px solid ${zone.color}55` }}>
          {zone.label}
        </span>
      </div>

      {/* Headline number + delta */}
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-4xl font-extrabold tabular-nums leading-none" style={{ color: zone.color }}>{data.iva.toFixed(2)}</span>
        <span className="text-sm text-slate-500 tabular-nums">({(data.iva * 100 / VAL_MAX).toFixed(0)}%)</span>
        {data.delta !== undefined && (
          <span className={`text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded ${
            data.delta > 0 ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
            : data.delta < 0 ? 'text-red-400 bg-red-500/10 border border-red-500/30'
            : 'text-slate-500 bg-slate-500/10 border border-slate-500/30'
          }`}>
            {data.delta > 0 ? '▲' : data.delta < 0 ? '▼' : '–'} {data.delta > 0 ? '+' : ''}{data.delta.toFixed(2)}
            <span className="text-slate-500 font-normal ml-1">sem. dernière</span>
          </span>
        )}
      </div>

      {/* Segmented bar with 4 zones + marker */}
      <div className="relative pt-1 pb-7">
        {/* Zone labels above */}
        <div className="absolute inset-x-0 top-0 h-3 pointer-events-none">
          {ZONES.map(z => {
            const left = pct(z.from)
            const width = pct(z.to) - pct(z.from)
            return (
              <div key={`lbl-${z.from}`}
                className="absolute text-[8px] uppercase tracking-wider font-bold text-center"
                style={{ left: `${left}%`, width: `${width}%`, color: z.color, opacity: 0.7 }}>
                {width > 12 ? z.label : ''}
              </div>
            )
          })}
        </div>

        {/* The bar itself */}
        <div className="relative h-4 rounded-md overflow-hidden flex mt-4 bg-surface-700/40">
          {ZONES.map(z => {
            const width = pct(z.to) - pct(z.from)
            const active = data.iva >= z.from && data.iva < z.to
            return (
              <div key={z.from}
                className="h-full transition-opacity"
                style={{ width: `${width}%`, background: z.color, opacity: active ? 1 : 0.35 }}
              />
            )
          })}
          {/* Vertical marker */}
          <div
            className="absolute top-[-3px] bottom-[-3px] w-[3px] bg-white rounded-sm shadow-[0_0_8px_rgba(255,255,255,0.6)]"
            style={{ left: `calc(${markerPct}% - 1.5px)` }}
          />
        </div>

        {/* Boundary tick labels below */}
        <div className="absolute inset-x-0 bottom-0 h-5 pointer-events-none">
          {BOUNDARIES.map(v => {
            const left = pct(v)
            return (
              <span key={v}
                className="absolute font-mono tabular-nums text-[9px] text-slate-500"
                style={{ left: `${left}%`, transform: 'translateX(-50%)' }}>
                {v.toFixed(2)}
              </span>
            )
          })}
        </div>
      </div>

      {/* ── Projection à rythme constant ─────────────────────────── */}
      {(() => {
        const va = data.velocityActual
        const vr = data.velocityRequired
        const wRemaining = Math.max(0.1, data.weeksRemaining)
        const readingsRemaining = Math.max(0, data.readingsRemaining)
        // Combien de semaines tu mettras au rythme actuel pour finir tout ce qui reste.
        const weeksAtCurrent = va > 0 ? readingsRemaining / va : Infinity
        const weeksDelta = weeksAtCurrent - wRemaining
        const daysDelta = Math.round(weeksDelta * 7)
        const projectedCovered = Math.min(readingsRemaining, Math.round(va * wRemaining))
        const projectedPct = readingsRemaining > 0
          ? Math.round((projectedCovered / readingsRemaining) * 100)
          : 100
        const isOnTrack = weeksDelta <= 0.5
        const projColor = isOnTrack ? '#22c55e' : weeksDelta < 2 ? '#f59e0b' : '#ef4444'
        return (
          <div className="mt-3 rounded-lg p-3 text-[12px] leading-relaxed"
               style={{ background: `${projColor}10`, border: `1px solid ${projColor}33` }}>
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke={projColor} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: projColor }}>
                Si tu conserves ce rythme — projection
              </span>
            </div>
            <p className="text-slate-300">
              {readingsRemaining === 0 ? (
                <>Tu as déjà couvert tous les LMs requis. Reste à consolider la maîtrise et faire des mocks.</>
              ) : isOnTrack && va >= vr ? (
                <>
                  À <span className="font-bold text-white">{va.toFixed(1)} readings/sem</span> tu finiras
                  les <span className="font-bold text-white">{readingsRemaining}</span> LMs restants en
                  {' '}<span className="font-bold text-white">{Math.ceil(weeksAtCurrent)}</span> semaines —
                  soit <span className="font-bold" style={{ color: projColor }}>
                    {daysDelta < 0 ? `${Math.abs(daysDelta)} jours d'avance` : 'pile dans les temps'}
                  </span> sur l&apos;objectif. Continue.
                </>
              ) : (
                <>
                  À <span className="font-bold text-white">{va.toFixed(1)} readings/sem</span> tu n&apos;auras
                  couvert que <span className="font-bold" style={{ color: projColor }}>~{projectedCovered}/{readingsRemaining}</span>
                  {' '}LMs ({projectedPct}%) avant le buffer T-30j —
                  soit <span className="font-bold" style={{ color: projColor }}>{daysDelta} jours de retard</span>.
                </>
              )}
            </p>
          </div>
        )
      })()}

      {/* ── Recommandation détaillée — combien d'effort en plus ──── */}
      {(isCritical || isWatch) && (() => {
        const deficit = Math.max(0, data.velocityRequired - data.velocityActual)  // readings/sem manquants
        const minPerReading = 30                                                  // ≈ temps moyen par LM
        const extraMinPerWeek = Math.round(deficit * minPerReading)
        const extraMinPerDay = Math.round(extraMinPerWeek / 7)
        const sessionLen = 45                                                     // bloc Pomodoro
        const extraSessionsPerWeek = Math.ceil(extraMinPerWeek / sessionLen)
        const lowMastery = data.masteryScore < 70
        const masteryOK = !lowMastery
        const tone = isCritical ? 'red' : 'amber'
        const tColor = isCritical ? '#ef4444' : '#f59e0b'
        return (
          <div className={`mt-3 rounded-lg border p-3 text-[12px] leading-relaxed ${
            tone === 'red' ? 'border-red-500/30 bg-red-500/[0.08]' : 'border-amber-500/30 bg-amber-500/[0.08]'
          }`}>
            <div className="flex items-start gap-2 mb-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke={tColor} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-bold" style={{ color: tColor }}>
                {isCritical ? 'Alerte performance — Zone Rouge' : 'En alerte — Zone Jaune'}
              </span>
            </div>

            <p className="text-slate-300 mb-2">
              {masteryOK
                ? <>Ta maîtrise est OK ({data.masteryScore}%) mais ton rythme est trop lent : <span className="font-bold text-white">{data.velocityActual.toFixed(1)} vs {data.velocityRequired.toFixed(1)} readings/sem</span>.</>
                : data.velocityActual / Math.max(0.1, data.velocityRequired) >= 0.9
                  ? <>Ton rythme est correct mais ta maîtrise est faible (<span className="font-bold text-white">{data.masteryScore}%</span>). Ralentir et consolider plutôt qu&apos;avancer.</>
                  : <>Rythme <span className="font-bold text-white">et</span> maîtrise insuffisants : <span className="font-bold text-white">{data.velocityActual.toFixed(1)} vs {data.velocityRequired.toFixed(1)} readings/sem</span> avec <span className="font-bold text-white">{data.masteryScore}%</span> de maîtrise.</>}
            </p>

            {/* Quantified gap */}
            {deficit > 0 && (
              <div className="rounded-md p-2 mb-2 grid grid-cols-3 gap-2 text-center"
                   style={{ background: 'rgba(0,0,0,.25)', border: '1px solid rgba(255,255,255,.05)' }}>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500">Manque</div>
                  <div className="text-[14px] font-bold text-white tabular-nums">+{deficit.toFixed(1)}/sem</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500">Effort sup.</div>
                  <div className="text-[14px] font-bold text-white tabular-nums">~{extraMinPerWeek}m/sem</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500">≈ par jour</div>
                  <div className="text-[14px] font-bold text-white tabular-nums">+{extraMinPerDay}m</div>
                </div>
              </div>
            )}

            {/* Concrete session plan */}
            <div className="text-slate-300">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Plan d&apos;action proposé</div>
              {masteryOK && deficit > 0 && (
                <ul className="space-y-1 text-[11px] list-disc list-inside marker:text-slate-600">
                  <li><span className="font-bold text-white">+{extraSessionsPerWeek} session{extraSessionsPerWeek > 1 ? 's' : ''}/semaine</span> de {sessionLen}min ciblée Reading + LOS Sheet sur les topics à fort poids non encore couverts.</li>
                  <li>Garder un bloc <span className="font-bold text-white">QBank de 20-30 min</span> par session pour ancrer la maîtrise pendant la phase rythme.</li>
                  <li>Vérifier l&apos;IVA dans 7 jours : objectif <span className="font-bold" style={{ color: '#10b981' }}>≥ 0.85</span>.</li>
                </ul>
              )}
              {!masteryOK && data.velocityActual / Math.max(0.1, data.velocityRequired) >= 0.9 && (
                <ul className="space-y-1 text-[11px] list-disc list-inside marker:text-slate-600">
                  <li>Pause sur les nouveaux readings — concentrer <span className="font-bold text-white">3 sessions/semaine de 45min en QBank+SRS</span> sur les LMs déjà étudiés.</li>
                  <li>Pour chaque LM &lt; 70% : <span className="font-bold text-white">2 cycles Drill (10q) + Error Debrief</span>, jusqu&apos;à atteindre 75%.</li>
                  <li>Reprendre la cadence de readings une fois l&apos;avg mastery ≥ 70%.</li>
                </ul>
              )}
              {!masteryOK && data.velocityActual / Math.max(0.1, data.velocityRequired) < 0.9 && (
                <ul className="space-y-1 text-[11px] list-disc list-inside marker:text-slate-600">
                  <li>Ré-allouer le scope : viser uniquement les <span className="font-bold text-white">topics &gt; 10% poids d&apos;examen</span> (ETH, FSA, EQU, FI) — laisser DER/ALT/PM en deuxième passe.</li>
                  <li><span className="font-bold text-white">+{extraSessionsPerWeek} session{extraSessionsPerWeek > 1 ? 's' : ''}/sem de {sessionLen}min</span> structurée en 2 blocs : Reading (25min) + Drill QBank (20min).</li>
                  <li>Si l&apos;effort sup. n&apos;est pas tenable → repousser l&apos;examen au sitting suivant.</li>
                </ul>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── Side panels (3 cards) — alimentées par les mêmes données ────────────

export function IVASidePanels({ data }: { data: IVAData }) {
  const velocityRatio = data.velocityRequired > 0 ? data.velocityActual / data.velocityRequired : 0
  const velocityPct = Math.min(100, velocityRatio * 100)
  const sparkline = data.masterySparkline || []

  return (
    <div className="card !p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:divide-x lg:divide-white/[0.06]">
        {/* Vélocité d'avancement */}
        <div className="lg:pr-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">Vélocité d&apos;avancement</div>
          <div className="relative h-1.5 bg-surface-700 rounded-full mb-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${velocityRatio >= 1 ? 'bg-emerald-500' : velocityRatio >= 0.7 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${velocityPct}%` }}
            />
            <div className="absolute top-0 h-1.5 w-0.5 bg-white/40" style={{ left: '100%', transform: 'translateX(-1px)' }} />
          </div>
          <div className="space-y-1 text-[12px]">
            <div className="flex items-baseline justify-between">
              <span className="text-slate-500">V. Réelle</span>
              <span className="font-bold text-white tabular-nums">{data.velocityActual.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">readings/sem</span></span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-slate-500">V. Requise</span>
              <span className="font-bold text-white tabular-nums">{data.velocityRequired.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">readings/sem</span></span>
            </div>
          </div>
        </div>

        {/* Score de maîtrise */}
        <div className="lg:px-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">Score de maîtrise (QBank)</div>
          <div className="flex items-center gap-2">
            <span className={`text-3xl font-extrabold tabular-nums ${data.masteryScore >= 70 ? 'text-emerald-400' : data.masteryScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
              {data.masteryScore}%
            </span>
            {sparkline.length > 1 && (
              <svg viewBox="0 0 100 30" className="flex-1 h-7" preserveAspectRatio="none">
                {(() => {
                  const min = Math.min(...sparkline), max = Math.max(...sparkline)
                  const range = Math.max(1, max - min)
                  const pts = sparkline.map((v, i) => `${(i / (sparkline.length - 1)) * 100},${30 - ((v - min) / range) * 26 - 2}`).join(' ')
                  return (
                    <polyline points={pts} fill="none" stroke="#60a5fa" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
                  )
                })()}
              </svg>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Average accuracy</div>
        </div>

        {/* Burn-down status */}
        <div className="lg:pl-4">
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">Burn-down status</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-2xl font-bold text-white tabular-nums leading-none">{data.readingsRemaining}</div>
              <div className="text-[10px] text-slate-500 mt-1">Readings restants</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white tabular-nums leading-none">{data.weeksRemaining}</div>
              <div className="text-[10px] text-slate-500 mt-1">Sem. avant buffer</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
