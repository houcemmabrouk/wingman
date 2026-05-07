'use client'

// 5-axis Radar — Framework KPIs canoniques (cf. docs/kpis_catalog.md § L)
//   V_c     · Vélocité Couverture
//   Acc_1   · Réussite Premier Passage
//   T_eff   · Efficacité Temporelle (inversé : 100 si ≤ 90s, baisse à mesure)
//   R_coeff · Coefficient Rétention
//   P_strat · Maîtrise Big 4 (Ethics + FRA + FI + Equity)

import { Radar } from 'react-chartjs-2'
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

export interface RadarKPI5Data {
  vc: number       // Vélocité Couverture (0-100)
  acc1: number     // Réussite Premier Passage (0-100)
  teff: number     // Efficacité Temporelle (0-100, déjà normalisé)
  rcoeff: number   // Coefficient Rétention (0-100)
  pstrat: number   // Piliers Stratégiques (0-100)
  ri?: number      // Readiness Index v2 calculé (0-100), optionnel pour affichage
}

const TARGET = [80, 70, 90, 70, 70]  // cibles (cf. docs/kpis_catalog.md § L.1)

export default function RadarKPI5({ data }: { data: RadarKPI5Data }) {
  const actual = [data.vc, data.acc1, data.teff, data.rcoeff, data.pstrat]

  const chartData = {
    labels: ['V. Couverture', 'Acc 1ʳᵉ passage', 'Efficacité temps', 'Rétention', 'Piliers Big 4'],
    datasets: [
      {
        label: 'Current',
        data: actual,
        backgroundColor: 'rgba(59,130,246,0.18)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        pointBackgroundColor: '#3b82f6',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Target',
        data: TARGET,
        backgroundColor: 'rgba(34,197,94,0.04)',
        borderColor: 'rgba(34,197,94,0.4)',
        borderDash: [4, 3],
        borderWidth: 1.5,
        pointRadius: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; raw: number; dataIndex: number }) => {
            const labels = ['V_c', 'Acc_1', 'T_eff', 'R_coeff', 'P_strat']
            return `${labels[ctx.dataIndex]} (${ctx.dataset.label}): ${ctx.raw.toFixed(0)}%`
          },
        },
      },
    },
    scales: {
      r: {
        min: 0, max: 100,
        ticks: { display: false, stepSize: 25 },
        grid: { color: 'rgba(255,255,255,0.06)' },
        angleLines: { color: 'rgba(255,255,255,0.06)' },
        pointLabels: { color: '#cbd5e1', font: { size: 11, weight: 'bold' as const } },
      },
    },
  }

  // Compute Readiness Index v2 if not provided.
  const ri = data.ri ?? (
    data.vc * 0.20 + data.acc1 * 0.30 + data.rcoeff * 0.25 + data.pstrat * 0.25
  )
  const riPenalty = data.teff < 70  // proxy : T_eff < 70 ≈ Time/Q > 100s
  const riAdjusted = riPenalty ? ri * 0.9 : ri  // -10% si malus temps
  const status = riAdjusted >= 80 ? 'Strong Pass'
    : riAdjusted >= 65 ? 'Borderline'
    : 'High Risk'
  const statusColor = riAdjusted >= 80 ? '#10b981'
    : riAdjusted >= 65 ? '#f59e0b'
    : '#ef4444'

  // Find weakest axis for "Borderline" deep-dive hint
  const axes = [
    { label: 'Vélocité Couverture', val: data.vc },
    { label: 'Acc 1ʳᵉ passage', val: data.acc1 },
    { label: 'Efficacité temps', val: data.teff },
    { label: 'Rétention', val: data.rcoeff },
    { label: 'Piliers Big 4', val: data.pstrat },
  ]
  const weakest = axes.reduce((min, a) => (a.val < min.val ? a : min), axes[0])

  return (
    <div className="card !p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-500">Radar — 5 KPIs canoniques</h2>
          <p className="text-[10px] text-slate-600">V<sub>c</sub> · Acc<sub>1</sub> · T<sub>eff</sub> · R<sub>coeff</sub> · P<sub>strat</sub></p>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: statusColor }}>{status}</span>
          <div className="text-2xl font-extrabold tabular-nums leading-none mt-0.5" style={{ color: statusColor }}>
            {riAdjusted.toFixed(0)}<span className="text-sm text-slate-500">%</span>
          </div>
          <div className="text-[9px] text-slate-600">Readiness Index v2{riPenalty && <span className="text-red-400 ml-1">(−10% T_eff)</span>}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Radar chart — 2/3 */}
        <div className="md:col-span-2 h-[280px]">
          <Radar data={chartData} options={options as never} />
        </div>

        {/* Side legend / values — 1/3 */}
        <div className="flex flex-col gap-1.5 text-[11px]">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Current
            <span className="ml-3 w-2 h-2 rounded-full" style={{ background: 'rgba(34,197,94,0.4)' }} /> Target
          </div>
          {axes.map((a, i) => {
            const target = TARGET[i]
            const diff = a.val - target
            return (
              <div key={a.label} className="flex items-center justify-between gap-2 py-1 border-b border-white/[0.04] last:border-0">
                <span className="text-slate-400 truncate">{a.label}</span>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <span className="font-bold text-white tabular-nums">{a.val.toFixed(0)}</span>
                  <span className={`text-[10px] tabular-nums ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(0)}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Action hint based on RI status */}
          <div className="mt-2 pt-2 border-t border-white/[0.06]">
            {riAdjusted >= 80 ? (
              <p className="text-[11px] text-emerald-400 leading-relaxed">
                ✓ Simuler des examens complets pour gérer le stress.
              </p>
            ) : riAdjusted >= 65 ? (
              <p className="text-[11px] text-amber-400 leading-relaxed">
                Deep dive sur <strong>{weakest.label}</strong> ({weakest.val.toFixed(0)}, le plus faible).
              </p>
            ) : (
              <p className="text-[11px] text-red-400 leading-relaxed">
                ⚠ Re-stratégie : prioriser Éthique + FRA + FI + Equity (Big 4).
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
