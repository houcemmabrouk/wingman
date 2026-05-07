'use client'

import { useState } from 'react'
import { TOPIC_COLORS } from '@/lib/lm-data'
import EisenhowerPlanner from '@/components/EisenhowerPlanner'

// ── Priority Matrix — 11-Step Method ──────────────────────
const ETAPE_LABELS = [
  { id: 1,  label: 'Reading Summary',    labelFr: 'Reading Summary',       category: 'encoding' },
  { id: 2,  label: 'Essential Sheet',     labelFr: 'Essential Sheet',   category: 'encoding' },
  { id: 3,  label: 'LOS Sheet',           labelFr: 'LOS Sheet',           category: 'encoding' },
  { id: 4,  label: 'Concept Check',        labelFr: 'Concept Check',    category: 'recall' },
  { id: 5,  label: 'QBank Diagnostic',     labelFr: 'QBank Diagnostic',   category: 'practice' },
  { id: 6,  label: 'Error Analysis',       labelFr: 'Error Analysis',    category: 'practice' },
  { id: 7,  label: 'Exam Traps',           labelFr: 'Exam Traps',     category: 'practice' },
  { id: 8,  label: 'QBank Reinforcement',  labelFr: 'QBank Reinforcement', category: 'practice' },
  { id: 9,  label: 'Calculator Mastery',    labelFr: 'Calculator',      category: 'practice' },
  { id: 10, label: 'Decision Tree',         labelFr: 'Decision Tree',   category: 'meta' },
  { id: 11, label: 'Spaced Repetition',     labelFr: 'Repetition',       category: 'review' },
]

const MATRIX_TOPICS = ['CORP', 'FI', 'EQU', 'QM', 'ETH', 'FSA', 'ECO', 'DER', 'ALT', 'PM'] as const

// Rows: étapes 1-11 | Cols: topics — values 0-3
const PRIORITY_MATRIX: number[][] = [
  /* É1  Reading     */ [2, 2, 2, 2, 1, 2, 2, 2, 1, 2],
  /* É2  Essential   */ [2, 1, 2, 1, 0, 2, 1, 1, 1, 1],
  /* É3  LOS         */ [2, 1, 2, 2, 1, 3, 2, 2, 1, 2],
  /* É4  Concept     */ [2, 1, 2, 2, 0, 3, 2, 2, 1, 2],
  /* É5  QBank Diag  */ [2, 2, 2, 2, 3, 3, 2, 2, 2, 2],
  /* É6  Error       */ [2, 2, 2, 2, 3, 3, 2, 2, 2, 2],
  /* É7  Traps       */ [3, 2, 2, 2, 3, 3, 2, 2, 2, 2],
  /* É8  QBank Reinf */ [2, 3, 2, 2, 3, 3, 2, 2, 2, 2],
  /* É9  Calculator  */ [1, 3, 1, 3, 0, 2, 1, 3, 1, 2],
  /* É10 Decision    */ [3, 1, 2, 1, 0, 2, 1, 2, 1, 2],
  /* É11 Repetition  */ [1, 1, 2, 2, 3, 3, 2, 2, 2, 2],
]

// ── Content Matrix — Material by Topic (0-3 intensity) ──
const CONTENT_MATRIX_TOPICS = [
  { code: 'ETH',  name: 'Ethics',                  group: 'Conceptual'        },
  { code: 'FSA',  name: 'FSA',                     group: 'Hybrid'            },
  { code: 'EQU',  name: 'Equity',                  group: 'Hybrid'            },
  { code: 'FI',   name: 'Fixed Income',            group: 'Calculation-heavy' },
  { code: 'QM',   name: 'Quant',                   group: 'Calculation-heavy' },
  { code: 'ECO',  name: 'Economics',               group: 'Conceptual'        },
  { code: 'CORP', name: 'Corporate Issuers',       group: 'Light'             },
  { code: 'PM',   name: 'Portfolio Management',    group: 'Conceptual'        },
  { code: 'DER',  name: 'Derivatives',             group: 'Calculation-heavy' },
  { code: 'ALT',  name: 'Alternative Investments', group: 'Light'             },
] as const

const CONTENT_MATRIX_COLS = [
  'Reading Summary', 'Synthesis Sheet', 'Review Sheet', 'LOS Sheet',
  'Concept by Concept', 'Learning Map', 'Exam Traps', 'Decision Tree',
  'Formula Sheet', 'Weakness Pool', 'Targeted QBank', 'Audio',
]

// Rows align with CONTENT_MATRIX_TOPICS, cols with CONTENT_MATRIX_COLS (0-5 scale)
const CONTENT_MATRIX: number[][] = [
  /* ETH  */ [3, 5, 5, 5, 3, 5, 5, 5, 0, 5, 5, 3],
  /* FSA  */ [5, 5, 5, 5, 5, 5, 5, 4, 5, 5, 5, 3],
  /* EQU  */ [3, 4, 5, 5, 5, 5, 5, 4, 4, 5, 5, 2],
  /* FI   */ [3, 4, 5, 5, 5, 3, 5, 5, 5, 5, 5, 2],
  /* QM   */ [3, 4, 5, 5, 5, 3, 4, 4, 5, 5, 5, 2],
  /* ECO  */ [3, 4, 4, 5, 3, 3, 4, 2, 2, 5, 5, 2],
  /* CORP */ [2, 4, 4, 4, 3, 3, 4, 2, 2, 3, 5, 2],
  /* PM   */ [2, 4, 4, 4, 3, 3, 4, 3, 2, 3, 5, 2],
  /* DER  */ [2, 4, 4, 4, 5, 2, 5, 4, 5, 5, 5, 2],
  /* ALT  */ [2, 4, 4, 4, 3, 3, 4, 2, 2, 3, 5, 2],
]

const GROUP_STYLE: Record<string, { color: string; icon: string }> = {
  'Conceptual':        { color: '#8B5CF6', icon: '🧠' },
  'Hybrid':            { color: '#06B6D4', icon: '🔀' },
  'Calculation-heavy': { color: '#F59E0B', icon: '🧮' },
  'Light':             { color: '#64748B', icon: '🪶' },
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  encoding: { bg: 'rgba(59,130,246,0.12)', text: '#60A5FA', label: 'Encoding' },
  recall:   { bg: 'rgba(139,92,246,0.12)', text: '#A78BFA', label: 'Recall' },
  practice: { bg: 'rgba(245,158,11,0.12)', text: '#FBBF24', label: 'Practice' },
  meta:     { bg: 'rgba(236,72,153,0.12)', text: '#F472B6', label: 'Meta' },
  review:   { bg: 'rgba(34,197,94,0.12)',  text: '#4ADE80', label: 'Review' },
}

// ── Static Exam Intelligence Data ─────────────────────────

const PASS_RATES = [
  { year: '2019', rate: 41 }, { year: '2020', rate: 49 }, { year: '2021-Feb', rate: 44 },
  { year: '2021-Jul', rate: 22 }, { year: '2022-Feb', rate: 36 }, { year: '2022-Aug', rate: 38 },
  { year: '2023-Feb', rate: 38 }, { year: '2023-Aug', rate: 37 }, { year: '2024-Feb', rate: 44 },
  { year: '2024-Aug', rate: 43 },
]

const TOPIC_WEIGHTS = [
  { code: 'ETH', name: 'Ethical & Professional Standards', weight: '15-20%', lm: 3, los: 15 },
  { code: 'QM', name: 'Quantitative Methods', weight: '8-12%', lm: 11, los: 41 },
  { code: 'ECO', name: 'Economics', weight: '8-12%', lm: 8, los: 30 },
  { code: 'FSA', name: 'Financial Statement Analysis', weight: '13-17%', lm: 12, los: 61 },
  { code: 'CORP', name: 'Corporate Issuers', weight: '8-12%', lm: 7, los: 22 },
  { code: 'EQU', name: 'Equity Investments', weight: '10-12%', lm: 7, los: 58 },
  { code: 'FI', name: 'Fixed Income', weight: '11-14%', lm: 19, los: 48 },
  { code: 'DER', name: 'Derivatives', weight: '5-8%', lm: 10, los: 23 },
  { code: 'ALT', name: 'Alternative Investments', weight: '5-8%', lm: 7, los: 22 },
  { code: 'PM', name: 'Portfolio Management', weight: '5-8%', lm: 6, los: 40 },
]

const STRATEGIES = [
  { title: 'Start with Ethics', desc: 'Successful candidates spend 15-20% of their time on Ethics. It\'s the most heavily weighted and most predictable topic — high ROI.' },
  { title: 'FRA + FI = 30% of the exam', desc: 'Financial Statement Analysis and Fixed Income represent ~30% of questions. Mastering these two topics is non-negotiable.' },
  { title: '300+ study hours', desc: 'CFA Institute reports an average of 303 hours for successful candidates. Top performers exceed 350h.' },
  { title: 'Mocks > Reading', desc: 'Successful candidates spend 40-50% of their time on MCQs and mocks, not on reading. Active practice beats passive review.' },
  { title: 'Never leave blank', desc: 'No penalty for wrong answers. Every unanswered question = guaranteed 0 points. Guessing gives a 33% chance.' },
  { title: 'Exam day time management', desc: '180 questions in 270 min = 90 sec/question. If stuck after 60 sec, flag and move on. Come back at the end.' },
]

const COMMON_MISTAKES = [
  { mistake: 'Neglecting Ethics', impact: 'critical', detail: 'Ethics can tip a borderline result. CFA Institute adjusts the MPS using Ethics scores.' },
  { mistake: 'Underestimating Fixed Income', impact: 'critical', detail: '19 modules, 48 LOS — the largest topic by volume. Many duration/convexity calculations.' },
  { mistake: 'Not enough mocks', impact: 'high', detail: 'Candidates who take <3 full mocks have a 15% lower pass rate.' },
  { mistake: 'Studying linearly', impact: 'high', detail: 'Reviewing V1 to V10 in order is inefficient. Prioritize by exam weight and weaknesses.' },
  { mistake: 'Ignoring formulas', impact: 'medium', detail: '~40% of L1 questions require a calculation. Memorizing key formulas is essential.' },
  { mistake: 'Calculator not mastered', impact: 'medium', detail: 'Losing 30 sec per TVM calculation = 15 min lost. Master the BA II Plus before the exam.' },
]

const CALCULATOR_SHORTCUTS = [
  { key: '2ND + CLR TVM', action: 'Reset all TVM values' },
  { key: '2ND + P/Y', action: 'Set Periods/Year (set to 1!)' },
  { key: 'CPT + I/Y', action: 'Calculate the rate of return' },
  { key: 'CF + NPV', action: 'Calculate the NPV of a cash flow' },
  { key: '2ND + STAT', action: 'Statistics mode — mean, standard deviation' },
  { key: 'IRR + CPT', action: 'IRR after entering cash flows' },
  { key: 'AMORT (2ND + PV)', action: 'Amortization table' },
  { key: 'BGN/END (2ND + PMT)', action: 'Toggle annuity begin/end' },
]

const STUDY_HOURS = [
  { range: '< 200h', pct: 12, pass: false },
  { range: '200-250h', pct: 28, pass: false },
  { range: '250-300h', pct: 55, pass: true },
  { range: '300-350h', pct: 68, pass: true },
  { range: '350-400h', pct: 74, pass: true },
  { range: '> 400h', pct: 78, pass: true },
]

// ── Tracker Data (from CFA_L1_Tracker_v2.xlsx) ───────────

const TRACKER_DASHBOARD = [
  { code: 'QM',   name: 'Quantitative Methods',             los: 41, modules: 11, weight: '8–12%',  avgPrio: 3.97, avgDiff: 3.36, color: '#7C3AED' },
  { code: 'ECO',  name: 'Economics',                        los: 30, modules: 8,  weight: '8–12%',  avgPrio: 2.45, avgDiff: 1.50, color: '#2563EB' },
  { code: 'CORP', name: 'Corporate Issuers',                los: 22, modules: 7,  weight: '8–12%',  avgPrio: 2.52, avgDiff: 1.42, color: '#D97706' },
  { code: 'FSA',  name: 'Financial Statement Analysis',     los: 61, modules: 12, weight: '13–17%', avgPrio: 3.70, avgDiff: 1.76, color: '#059669' },
  { code: 'EQU',  name: 'Equity Investments',               los: 58, modules: 7,  weight: '10–12%', avgPrio: 3.29, avgDiff: 1.78, color: '#0891B2' },
  { code: 'FI',   name: 'Fixed Income',                     los: 51, modules: 19, weight: '10–12%', avgPrio: 4.12, avgDiff: 2.79, color: '#4F46E5' },
  { code: 'DER',  name: 'Derivatives',                      los: 23, modules: 10, weight: '5–8%',   avgPrio: 3.27, avgDiff: 3.37, color: '#BE185D' },
  { code: 'ALT',  name: 'Alternative Investments',          los: 22, modules: 7,  weight: '5–8%',   avgPrio: 2.03, avgDiff: 1.69, color: '#7C2D12' },
  { code: 'PM',   name: 'Portfolio Management',             los: 40, modules: 6,  weight: '5–8%',   avgPrio: 2.79, avgDiff: 1.55, color: '#4338CA' },
  { code: 'ETH',  name: 'Ethical & Professional Standards', los: 15, modules: 3,  weight: '15–20%', avgPrio: 3.47, avgDiff: 1.17, color: '#DC2626' },
]

const DIFFICULTY_DISTRIBUTION = [
  { level: 'Very Hard', count: 47, pct: 12.9, color: '#EF4444' },
  { level: 'Hard',      count: 64, pct: 17.6, color: '#F59E0B' },
  { level: 'Medium',          count: 118,pct: 32.5, color: '#3B82F6' },
  { level: 'Easy',         count: 134,pct: 36.9, color: '#22C55E' },
]

// Top 30 highest-priority LOS — the "kill list"
const TOP_PRIORITY_LOS = [
  { rank: 1,  id: 'LM01-b', cur: 'QM',  mod: 'LM01', title: 'Rates and Returns',                             score: 4.6, diff: 'Very Hard', desc: 'Calculate/interpret return measurement approaches' },
  { rank: 2,  id: 'LM01-d', cur: 'QM',  mod: 'LM01', title: 'Rates and Returns',                             score: 4.6, diff: 'Very Hard', desc: 'Evaluate portfolio performance measures' },
  { rank: 3,  id: 'LM02-a', cur: 'QM',  mod: 'LM02', title: 'Time Value of Money',                           score: 4.6, diff: 'Very Hard', desc: 'Calculate PV of fixed-income/equity instruments' },
  { rank: 4,  id: 'LM02-b', cur: 'QM',  mod: 'LM02', title: 'Time Value of Money',                           score: 4.6, diff: 'Very Hard', desc: 'Calculate implied return/required return/growth' },
  { rank: 5,  id: 'LM02-c', cur: 'QM',  mod: 'LM02', title: 'Time Value of Money',                           score: 4.6, diff: 'Very Hard', desc: 'Cash flow additivity & no-arbitrage condition' },
  { rank: 6,  id: 'LM05-a', cur: 'QM',  mod: 'LM05', title: 'Portfolio Mathematics',                         score: 4.6, diff: 'Very Hard', desc: 'Calculate expected value/variance/covariance of returns' },
  { rank: 7,  id: 'LM06-a', cur: 'FI',  mod: 'LM06', title: 'Bond Valuation: Prices & Yields',               score: 4.6, diff: 'Very Hard', desc: 'Calculate bond price given YTM on/between coupons' },
  { rank: 8,  id: 'LM07-a', cur: 'FI',  mod: 'LM07', title: 'Yield Spread Measures (Fixed-Rate)',             score: 4.6, diff: 'Very Hard', desc: 'Calculate annual yield for varying compounding' },
  { rank: 9,  id: 'LM08-a', cur: 'FI',  mod: 'LM08', title: 'Yield Spread Measures (Floating-Rate)',          score: 4.6, diff: 'Very Hard', desc: 'Calculate yield spreads for floating-rate instruments' },
  { rank: 10, id: 'LM09-c', cur: 'FI',  mod: 'LM09', title: 'Term Structure of Interest Rates',              score: 4.6, diff: 'Very Hard', desc: 'Compare spot, par, and forward curves' },
  { rank: 11, id: 'LM10-a', cur: 'FI',  mod: 'LM10', title: 'Interest Rate Risk and Return',                 score: 4.6, diff: 'Very Hard', desc: 'Calculate/interpret sources of return on fixed-rate bond' },
  { rank: 12, id: 'LM12-a', cur: 'FI',  mod: 'LM12', title: 'Bond Convexity & Portfolio Properties',         score: 4.6, diff: 'Very Hard', desc: 'Calculate/interpret convexity and adjustment' },
  { rank: 13, id: 'LM12-b', cur: 'FI',  mod: 'LM12', title: 'Bond Convexity & Portfolio Properties',         score: 4.6, diff: 'Very Hard', desc: '% price change given duration and convexity' },
  { rank: 14, id: 'LM13-a', cur: 'FI',  mod: 'LM13', title: 'Curve-Based Risk Measures',                     score: 4.6, diff: 'Very Hard', desc: 'Effective duration/convexity for embedded options' },
  { rank: 15, id: 'LM16-b', cur: 'FI',  mod: 'LM16', title: 'Credit Analysis Corporate',                     score: 4.6, diff: 'Very Hard', desc: 'Calculate/interpret credit analysis financial ratios' },
  { rank: 16, id: 'LM01-a', cur: 'QM',  mod: 'LM01', title: 'Rates and Returns',                             score: 4.2, diff: 'Hard',      desc: 'Interest rates as required return/discount rate' },
  { rank: 17, id: 'LM06-a', cur: 'QM',  mod: 'LM06', title: 'Simulation Methods',                            score: 4.2, diff: 'Hard',      desc: 'Monte Carlo simulation applications' },
  { rank: 18, id: 'LM10-e', cur: 'QM',  mod: 'LM10', title: 'Simple Linear Regression',                      score: 4.2, diff: 'Hard',      desc: 'Calculate/interpret regression coefficients' },
  { rank: 19, id: 'LM02-f', cur: 'FSA', mod: 'LM02', title: 'Analyzing Income Statements',                   score: 4.2, diff: 'Hard',      desc: 'Evaluate earnings quality/sustainability' },
  { rank: 20, id: 'LM03-e', cur: 'FSA', mod: 'LM03', title: 'Analyzing Balance Sheets',                      score: 4.2, diff: 'Hard',      desc: 'Analyze off-balance-sheet items' },
  { rank: 21, id: 'LM04-f', cur: 'FSA', mod: 'LM04', title: 'Cash Flows I',                                  score: 4.2, diff: 'Hard',      desc: 'Convert cash flows between direct/indirect' },
  { rank: 22, id: 'LM04-a', cur: 'DER', mod: 'LM04', title: 'Arbitrage, Replication & Cost of Carry',        score: 4.2, diff: 'Hard',      desc: 'No-arbitrage pricing via replication' },
  { rank: 23, id: 'LM05-a', cur: 'DER', mod: 'LM05', title: 'Pricing Forward Contracts',                     score: 4.2, diff: 'Hard',      desc: 'Calculate/interpret forward contract prices' },
  { rank: 24, id: 'LM07-a', cur: 'DER', mod: 'LM07', title: 'Interest Rate Swaps',                           score: 4.2, diff: 'Hard',      desc: 'Price/value interest rate swaps' },
  { rank: 25, id: 'LM08-a', cur: 'DER', mod: 'LM08', title: 'Pricing Options',                               score: 4.2, diff: 'Hard',      desc: 'Calculate option value with BSM factors' },
  { rank: 26, id: 'LM09-a', cur: 'DER', mod: 'LM09', title: 'Put-Call Parity',                               score: 4.2, diff: 'Hard',      desc: 'Option replication using put-call parity' },
  { rank: 27, id: 'LM10-a', cur: 'DER', mod: 'LM10', title: 'Binomial Model',                                score: 4.2, diff: 'Hard',      desc: 'One-period binomial derivative valuation' },
  { rank: 28, id: 'LM11-a', cur: 'FI',  mod: 'LM11', title: 'Bond Duration Measures',                        score: 4.2, diff: 'Hard',      desc: 'Calculate/interpret Macaulay/modified duration' },
  { rank: 29, id: 'LM14-a', cur: 'FI',  mod: 'LM14', title: 'Credit Risk',                                   score: 4.2, diff: 'Hard',      desc: 'Describe credit risk and credit-related risks' },
  { rank: 30, id: 'LM18-a', cur: 'FI',  mod: 'LM18', title: 'ABS Instruments & Valuation',                   score: 4.2, diff: 'Hard',      desc: 'Describe ABS features and valuation' },
]

// Topic code mapping for colors in top LOS
const TRACKER_COLORS: Record<string, string> = {
  QM: '#7C3AED', FI: '#4F46E5', FSA: '#059669', DER: '#BE185D',
  ETH: '#DC2626', ECO: '#2563EB', CORP: '#D97706', EQU: '#0891B2',
  ALT: '#7C2D12', PM: '#4338CA',
}

// ── Components ────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  )
}

type TabId = 'numbers' | 'curriculum' | 'tracker' | 'method' | 'strategies' | 'data' | 'calculator' | 'eisenhower'

const TABS: { id: TabId; label: string }[] = [
  { id: 'numbers', label: 'The Exam in Numbers' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'tracker', label: 'Tracker Intel' },
  { id: 'method', label: '11-Step Method' },
  { id: 'strategies', label: 'Strategies' },
  { id: 'data', label: 'Real Data' },
  { id: 'calculator', label: 'Calculator' },
  { id: 'eisenhower', label: 'Eisenhower' },
]

export default function ExamIntelPage() {
  const [tab, setTab] = useState<TabId>('numbers')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Exam Intelligence</h1>
        <p className="text-xs text-slate-500 mt-1">Everything you need to know to pass the CFA Level I</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white/[0.02] rounded-lg p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'numbers' && (
        <div className="space-y-4">
          {/* Pass rates */}
          <Section title="Historical Pass Rates — CFA Level I">
            <div className="flex items-end gap-2.5 h-40">
              {PASS_RATES.map(p => (
                <div key={p.year} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[11px] text-slate-400 tabular-nums">{p.rate}%</span>
                  <div
                    className={`w-full rounded-t transition-all ${p.rate >= 40 ? 'bg-blue-500/60' : 'bg-red-500/50'}`}
                    style={{ height: `${p.rate * 1.5}%` }}
                  />
                  <span className="text-[8px] text-slate-600 truncate w-full text-center">{p.year}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.04] grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">~40%</p>
                <p className="text-[11px] text-slate-500">Average pass rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">180</p>
                <p className="text-[11px] text-slate-500">Questions (2 sessions x 90)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">270</p>
                <p className="text-[11px] text-slate-500">Total minutes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">~70%</p>
                <p className="text-[11px] text-slate-500">Estimated MPS (not public)</p>
              </div>
            </div>
          </Section>

          {/* Score distribution */}
          <Section title="Typical Score Distribution">
            <div className="space-y-2">
              {[
                { range: '< 50%', pct: 15, color: 'bg-red-500/60' },
                { range: '50-60%', pct: 20, color: 'bg-red-500/40' },
                { range: '60-65%', pct: 18, color: 'bg-amber-500/50' },
                { range: '65-70%', pct: 12, color: 'bg-amber-500/40' },
                { range: '70-75%', pct: 15, color: 'bg-emerald-500/40' },
                { range: '75-80%', pct: 12, color: 'bg-emerald-500/50' },
                { range: '> 80%', pct: 8, color: 'bg-emerald-500/60' },
              ].map(s => (
                <div key={s.range} className="flex items-center gap-4">
                  <span className="text-[11px] text-slate-400 w-14 text-right tabular-nums">{s.range}</span>
                  <div className="flex-1 h-4 bg-white/[0.03] rounded overflow-hidden">
                    <div className={`h-full rounded ${s.color}`} style={{ width: `${s.pct * 3}%` }} />
                  </div>
                  <span className="text-[11px] text-slate-500 w-8 tabular-nums">{s.pct}%</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-600 mt-3">The gray zone 65-72% is the "borderline" — Ethics can make the difference.</p>
          </Section>
        </div>
      )}

      {tab === 'curriculum' && (
        <div className="space-y-4">
          <Section title="Exam Weight by Topic">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3 px-2 text-slate-500">Code</th>
                    <th className="text-left py-3 px-2 text-slate-500">Topic</th>
                    <th className="text-right py-3 px-2 text-slate-500">Weight</th>
                    <th className="text-right py-3 px-2 text-slate-500">Modules</th>
                    <th className="text-right py-3 px-2 text-slate-500">LOS</th>
                    <th className="text-right py-3 px-2 text-slate-500">Q/180</th>
                  </tr>
                </thead>
                <tbody>
                  {TOPIC_WEIGHTS.map(t => {
                    const avgWeight = parseInt(t.weight) + (parseInt(t.weight.split('-')[1] || '0') - parseInt(t.weight)) / 2
                    const approxQ = Math.round((avgWeight / 100) * 180)
                    return (
                      <tr key={t.code} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-3 px-2 font-mono font-bold text-blue-400">{t.code}</td>
                        <td className="py-3 px-2 text-slate-300">{t.name}</td>
                        <td className="py-3 px-2 text-right font-medium text-white">{t.weight}</td>
                        <td className="py-3 px-2 text-right tabular-nums text-slate-400">{t.lm}</td>
                        <td className="py-3 px-2 text-right tabular-nums text-slate-400">{t.los}</td>
                        <td className="py-3 px-2 text-right tabular-nums text-amber-400">~{approxQ}</td>
                      </tr>
                    )
                  })}
                  <tr className="border-t border-white/[0.08]">
                    <td className="py-3 px-2 font-bold text-white" colSpan={3}>TOTAL</td>
                    <td className="py-3 px-2 text-right font-bold text-white">90</td>
                    <td className="py-3 px-2 text-right font-bold text-white">360</td>
                    <td className="py-3 px-2 text-right font-bold text-amber-400">180</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Content Matrix — Material by Topic">
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Intensity (0–5) of each content type per topic. The Planning Skill uses this matrix
              to pick the right material given days remaining and topic priority.
            </p>
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-1.5 text-slate-600 font-semibold sticky left-0 bg-white/[0.03] z-10 min-w-[140px]">Topic</th>
                    <th className="py-3 px-1.5 text-center text-slate-500 font-medium min-w-[110px]">Group</th>
                    {CONTENT_MATRIX_COLS.map(c => (
                      <th key={c} className="py-3 px-1.5 text-center text-slate-500 font-medium min-w-[56px]">
                        <span className="text-[10px] whitespace-nowrap">{c}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CONTENT_MATRIX_TOPICS.map((topic, rowIdx) => {
                    const grp = GROUP_STYLE[topic.group]
                    return (
                      <tr key={topic.code} className="border-t border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-1.5 sticky left-0 bg-surface-900/80 z-10">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                              style={{ background: TOPIC_COLORS[topic.code] || '#6366f1' }}>
                              {topic.code}
                            </span>
                            <span className="text-[11px] text-slate-300 font-medium">{topic.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-1.5 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded"
                            style={{ background: grp.color + '20', color: grp.color }}>
                            <span>{grp.icon}</span>
                            <span>{topic.group}</span>
                          </span>
                        </td>
                        {CONTENT_MATRIX[rowIdx].map((val, colIdx) => {
                          const bg =
                            val === 5 ? 'rgba(239,68,68,0.22)' :
                            val === 4 ? 'rgba(249,115,22,0.16)' :
                            val === 3 ? 'rgba(245,158,11,0.12)' :
                            val === 2 ? 'rgba(100,116,139,0.10)' :
                            val === 1 ? 'rgba(100,116,139,0.05)' :
                            'transparent'
                          const textColor =
                            val === 5 ? '#F87171' :
                            val === 4 ? '#FB923C' :
                            val === 3 ? '#FBBF24' :
                            val === 2 ? '#94A3B8' :
                            val === 1 ? '#64748B' :
                            '#334155'
                          return (
                            <td key={colIdx} className="py-3 px-1.5 text-center font-bold tabular-nums"
                              style={{ background: bg, color: textColor }}>
                              {val === 0 ? '—' : val}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded text-center text-[11px] font-bold leading-4" style={{ background: 'rgba(239,68,68,0.22)', color: '#F87171' }}>5</span>
                <span className="text-[11px] text-slate-500">Mandatory</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded text-center text-[11px] font-bold leading-4" style={{ background: 'rgba(249,115,22,0.16)', color: '#FB923C' }}>4</span>
                <span className="text-[11px] text-slate-500">Emphasized</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded text-center text-[11px] font-bold leading-4" style={{ background: 'rgba(245,158,11,0.12)', color: '#FBBF24' }}>3</span>
                <span className="text-[11px] text-slate-500">Standard</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded text-center text-[11px] font-bold leading-4" style={{ background: 'rgba(100,116,139,0.10)', color: '#94A3B8' }}>2</span>
                <span className="text-[11px] text-slate-500">Light</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded text-center text-[11px] font-bold leading-4" style={{ background: 'rgba(100,116,139,0.05)', color: '#64748B' }}>1</span>
                <span className="text-[11px] text-slate-500">Optional</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded text-center text-[11px] font-bold leading-4 text-slate-700">—</span>
                <span className="text-[11px] text-slate-500">Skip</span>
              </div>
            </div>
          </Section>

          <Section title="Most Frequently Tested">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                { topic: 'FSA', items: ['Financial ratios', 'Revenue recognition', 'FIFO/LIFO Inventory', 'Depreciation/Amortization', 'Deferred taxes'] },
                { topic: 'FI', items: ['Duration & Convexity', 'Bond pricing', 'Yield measures', 'Credit analysis', 'ABS/MBS'] },
                { topic: 'ETH', items: ['Standard I-VII scenarios', 'GIPS', 'Duty to clients', 'Material nonpublic info', 'Conflicts of interest'] },
                { topic: 'EQU', items: ['DDM / Gordon model', 'P/E, P/B multiples', 'Market efficiency', 'Industry analysis', 'FCFE/FCFF'] },
              ].map(g => (
                <div key={g.topic} className="p-3 bg-white/[0.02] rounded-lg">
                  <p className="text-xs font-bold text-blue-400 mb-2">{g.topic}</p>
                  <ul className="space-y-1">
                    {g.items.map(i => (
                      <li key={i} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-600" />{i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === 'tracker' && (
        <div className="space-y-4">

          {/* ── Topic Priority × Difficulty Matrix ── */}
          <Section title="Priority x Difficulty by Topic (363 LOS analyzed)">
            <p className="text-[11px] text-slate-400 mb-4">
              Average Priority and Difficulty scores by topic, calculated across all 363 LOS in the CFA Level I curriculum.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3 px-2 text-slate-500">Topic</th>
                    <th className="text-right py-3 px-2 text-slate-500">LOS</th>
                    <th className="text-right py-3 px-2 text-slate-500">Modules</th>
                    <th className="text-right py-3 px-2 text-slate-500">Weight</th>
                    <th className="text-right py-3 px-2 text-slate-500">Priority</th>
                    <th className="text-center py-3 px-2 text-slate-500" colSpan={1}>Priority Bar</th>
                    <th className="text-right py-3 px-2 text-slate-500">Difficulty</th>
                    <th className="text-center py-3 px-2 text-slate-500" colSpan={1}>Diff. Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {[...TRACKER_DASHBOARD]
                    .sort((a, b) => b.avgPrio - a.avgPrio)
                    .map(t => {
                      const prioPct = (t.avgPrio / 5) * 100
                      const diffPct = (t.avgDiff / 5) * 100
                      const prioColor = t.avgPrio >= 3.5 ? '#EF4444' : t.avgPrio >= 3.0 ? '#F59E0B' : '#3B82F6'
                      const diffColor = t.avgDiff >= 3.0 ? '#EF4444' : t.avgDiff >= 2.0 ? '#F59E0B' : '#22C55E'
                      return (
                        <tr key={t.code} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: t.color }}>{t.code}</span>
                              <span className="text-slate-300 text-[11px]">{t.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right tabular-nums text-slate-400">{t.los}</td>
                          <td className="py-3 px-2 text-right tabular-nums text-slate-400">{t.modules}</td>
                          <td className="py-3 px-2 text-right font-medium text-white">{t.weight}</td>
                          <td className="py-3 px-2 text-right font-bold tabular-nums" style={{ color: prioColor }}>{t.avgPrio.toFixed(1)}</td>
                          <td className="py-3 px-2">
                            <div className="w-20 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${prioPct}%`, background: prioColor }} />
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right font-bold tabular-nums" style={{ color: diffColor }}>{t.avgDiff.toFixed(1)}</td>
                          <td className="py-3 px-2">
                            <div className="w-20 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${diffPct}%`, background: diffColor }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  <tr className="border-t border-white/[0.08]">
                    <td className="py-3 px-2 font-bold text-white">TOTAL</td>
                    <td className="py-3 px-2 text-right font-bold text-white">363</td>
                    <td className="py-3 px-2 text-right font-bold text-white">90</td>
                    <td className="py-3 px-2 text-right font-bold text-white">100%</td>
                    <td className="py-3 px-2 text-right font-bold text-slate-400">3.16</td>
                    <td />
                    <td className="py-3 px-2 text-right font-bold text-slate-400">2.01</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── Difficulty Distribution ── */}
          <Section title="Difficulty Distribution — 363 LOS">
            <div className="grid grid-cols-4 gap-4 mb-4">
              {DIFFICULTY_DISTRIBUTION.map(d => (
                <div key={d.level} className="text-center p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="text-2xl font-extrabold tabular-nums" style={{ color: d.color }}>{d.count}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{d.level}</div>
                  <div className="text-[11px] text-slate-600">{d.pct}%</div>
                </div>
              ))}
            </div>
            <div className="flex h-6 rounded-lg overflow-hidden">
              {DIFFICULTY_DISTRIBUTION.map(d => (
                <div
                  key={d.level}
                  className="h-full flex items-center justify-center text-[11px] font-bold text-white/80"
                  style={{ width: `${d.pct}%`, background: d.color + '80' }}
                >
                  {d.pct > 15 ? `${d.pct}%` : ''}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-slate-600">← Easier</span>
              <span className="text-[11px] text-slate-600">Harder →</span>
            </div>
          </Section>

          {/* ── Priority vs Difficulty Scatter ── */}
          <Section title="Priority x Difficulty Map by Topic">
            <p className="text-[11px] text-slate-400 mb-4">
              Circle size = number of LOS. Upper-right quadrant = most demanding topics.
            </p>
            <div className="relative h-64 bg-white/[0.01] rounded-lg border border-white/[0.04] overflow-hidden">
              {/* Grid lines */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.04]" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.04]" />

              {/* Axis labels */}
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-slate-700">Priority →</span>
              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-700 -rotate-90">Difficulty →</span>

              {/* Quadrant labels */}
              <span className="absolute top-2 left-2 text-[8px] text-slate-700">Easy + Low-prio</span>
              <span className="absolute top-2 right-2 text-[8px] text-slate-700">Easy + High-prio</span>
              <span className="absolute bottom-2 left-2 text-[8px] text-slate-700">Hard + Low-prio</span>
              <span className="absolute bottom-6 right-2 text-[8px] text-red-400/60 font-bold">DANGER ZONE</span>

              {/* Plot topics */}
              {TRACKER_DASHBOARD.map(t => {
                // Map priority (1-5) to x (5%-95%), difficulty (1-5) to y (95%-5%) inverted
                const x = ((t.avgPrio - 1) / 4) * 85 + 7.5
                const y = 92.5 - ((t.avgDiff - 1) / 4) * 85
                const size = Math.max(24, Math.min(48, t.los * 0.7))
                return (
                  <div
                    key={t.code}
                    className="absolute flex items-center justify-center rounded-full border-2 transition-all hover:scale-110"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: size,
                      height: size,
                      transform: 'translate(-50%, -50%)',
                      background: t.color + '30',
                      borderColor: t.color + '60',
                    }}
                    title={`${t.code}: Prio=${t.avgPrio.toFixed(1)}, Diff=${t.avgDiff.toFixed(1)}, ${t.los} LOS`}
                  >
                    <span className="text-[11px] font-bold text-white">{t.code}</span>
                  </div>
                )
              })}
            </div>
          </Section>

          {/* ── Top 30 Kill List ── */}
          <Section title="Top 30 LOS — Kill List (maximum priority)">
            <p className="text-[11px] text-slate-400 mb-4">
              The 30 most critical LOS by composite priority score. All require calculations.
              Mastering these 30 LOS covers ~40% of exam points.
            </p>
            <div className="space-y-1.5">
              {TOP_PRIORITY_LOS.map(los => {
                const color = TRACKER_COLORS[los.cur] || '#6366f1'
                const diffColor = los.diff === 'Very Hard' ? '#EF4444' : '#F59E0B'
                return (
                  <div key={`${los.id}-${los.rank}`} className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    {/* Rank */}
                    <span className="w-6 text-[11px] font-bold text-slate-600 text-right tabular-nums">#{los.rank}</span>

                    {/* Topic badge */}
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded text-white shrink-0" style={{ background: color }}>
                      {los.cur}
                    </span>

                    {/* Module */}
                    <span className="text-[11px] font-mono text-slate-500 w-10 shrink-0">{los.mod}</span>

                    {/* Description */}
                    <span className="text-[11px] text-slate-300 flex-1 min-w-0 truncate">{los.desc}</span>

                    {/* Priority score */}
                    <span className="text-[11px] font-bold tabular-nums text-red-400 shrink-0">{los.score}</span>

                    {/* Difficulty badge */}
                    <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded shrink-0" style={{ background: diffColor + '20', color: diffColor }}>
                      {los.diff === 'Very Hard' ? 'V.HARD' : 'HARD'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Summary strip */}
            <div className="mt-4 pt-3 border-t border-white/[0.04] grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-extrabold text-red-400">15</div>
                <div className="text-[11px] text-slate-500">Very Hard</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-extrabold text-amber-400">15</div>
                <div className="text-[11px] text-slate-500">Hard</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-extrabold text-purple-400">10</div>
                <div className="text-[11px] text-slate-500">QM LOS</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-extrabold text-indigo-400">12</div>
                <div className="text-[11px] text-slate-500">FI LOS</div>
              </div>
            </div>
          </Section>

          {/* ── Key Takeaways ── */}
          <Section title="Tracker Conclusions">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-3.5 bg-white/[0.02] rounded-lg border-l-2 border-red-500/40">
                <p className="text-[12px] font-bold text-red-400 mb-1">Fixed Income = final boss</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Priority 4.12 + Difficulty 2.79 = the most demanding topic in the curriculum.
                  19 modules, 51 LOS, including 12 in the Top 30. Plan 25% of your time here.
                </p>
              </div>
              <div className="p-3.5 bg-white/[0.02] rounded-lg border-l-2 border-purple-500/40">
                <p className="text-[12px] font-bold text-purple-400 mb-1">QM + DER: high technical difficulty</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Quant (diff 3.36) and Derivatives (diff 3.37) are the most technically difficult,
                  even though their exam weight is moderate. Calculations are the main trap.
                </p>
              </div>
              <div className="p-3.5 bg-white/[0.02] rounded-lg border-l-2 border-emerald-500/40">
                <p className="text-[12px] font-bold text-emerald-400 mb-1">ECO + CORP + ALT: quick ROI</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Priority &lt; 2.6 and difficulty &lt; 1.7 — these topics are the most accessible.
                  Ideal for accumulating points quickly before tackling the harder topics.
                </p>
              </div>
              <div className="p-3.5 bg-white/[0.02] rounded-lg border-l-2 border-amber-500/40">
                <p className="text-[12px] font-bold text-amber-400 mb-1">37% of LOS are easy</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  134 out of 363 LOS are rated &quot;Easy&quot;. Mastering these 37% first builds a solid foundation
                  and frees up time for the 47 &quot;Very Hard&quot; LOS.
                </p>
              </div>
            </div>
          </Section>
        </div>
      )}

      {tab === 'method' && (
        <div className="space-y-4">
          {/* ── Priority Matrix Table ── */}
          <Section title="Priority Matrix — 11 Steps by Topic">
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Each step of the method has a different priority level depending on the topic.
              The Navigator uses this matrix to assign you the optimal activity.
            </p>
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-1.5 text-slate-600 font-semibold sticky left-0 bg-white/[0.03] z-10 min-w-[120px]">Step</th>
                    {MATRIX_TOPICS.map(t => (
                      <th key={t} className="py-3 px-1.5 text-center font-bold min-w-[44px]" style={{ color: TOPIC_COLORS[t] || '#94a3b8' }}>
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ETAPE_LABELS.map((etape, rowIdx) => {
                    const catStyle = CATEGORY_COLORS[etape.category]
                    return (
                      <tr key={etape.id} className="border-t border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-1.5 sticky left-0 bg-surface-900/80 z-10">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-600 w-4">S{etape.id}</span>
                            <span className="text-[11px] text-slate-300 font-medium">{etape.label}</span>
                            <span
                              className="text-[7px] font-bold px-1 py-0.5 rounded ml-auto shrink-0"
                              style={{ background: catStyle.bg, color: catStyle.text }}
                            >
                              {catStyle.label}
                            </span>
                          </div>
                        </td>
                        {PRIORITY_MATRIX[rowIdx].map((val, colIdx) => {
                          const topicCode = MATRIX_TOPICS[colIdx]
                          const bg =
                            val === 3 ? 'rgba(239,68,68,0.20)' :
                            val === 2 ? 'rgba(245,158,11,0.12)' :
                            val === 1 ? 'rgba(100,116,139,0.08)' :
                            'transparent'
                          const textColor =
                            val === 3 ? '#F87171' :
                            val === 2 ? '#FBBF24' :
                            val === 1 ? '#64748B' :
                            '#334155'
                          return (
                            <td
                              key={topicCode}
                              className="py-3 px-1.5 text-center font-bold tabular-nums"
                              style={{ background: bg, color: textColor }}
                            >
                              {val === 0 ? '—' : val}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded text-center text-[11px] font-bold leading-4" style={{ background: 'rgba(239,68,68,0.20)', color: '#F87171' }}>3</span>
                <span className="text-[11px] text-slate-500">High priority</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded text-center text-[11px] font-bold leading-4" style={{ background: 'rgba(245,158,11,0.12)', color: '#FBBF24' }}>2</span>
                <span className="text-[11px] text-slate-500">Standard</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded text-center text-[11px] font-bold leading-4" style={{ background: 'rgba(100,116,139,0.08)', color: '#64748B' }}>1</span>
                <span className="text-[11px] text-slate-500">Low</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded text-center text-[11px] font-bold leading-4 text-slate-700">—</span>
                <span className="text-[11px] text-slate-500">Not applicable</span>
              </div>
            </div>
          </Section>

          {/* ── Étape Details ── */}
          <Section title="11 Steps Detail">
            <div className="space-y-2">
              {ETAPE_LABELS.map(etape => {
                const catStyle = CATEGORY_COLORS[etape.category]
                // Count P3 topics for this étape
                const row = PRIORITY_MATRIX[etape.id - 1]
                const p3Topics = row.map((v, i) => v === 3 ? MATRIX_TOPICS[i] : null).filter(Boolean)
                const p0Topics = row.map((v, i) => v === 0 ? MATRIX_TOPICS[i] : null).filter(Boolean)

                return (
                  <div key={etape.id} className="flex items-start gap-4 p-4 bg-white/[0.02] rounded-lg hover:bg-white/[0.03] transition-colors">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: catStyle.text + '30', color: catStyle.text }}>
                      {etape.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="text-[12px] font-bold text-white">{etape.label}</span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded ml-auto" style={{ background: catStyle.bg, color: catStyle.text }}>
                          {catStyle.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        {p3Topics.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] font-bold text-red-400">P3:</span>
                            {p3Topics.map(t => (
                              <span key={t} className="text-[11px] font-bold px-1 py-0.5 rounded text-white"
                                style={{ background: TOPIC_COLORS[t!] || '#6366f1' }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {p0Topics.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] text-slate-600">Skip:</span>
                            {p0Topics.map(t => (
                              <span key={t} className="text-[11px] text-slate-600">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>

          {/* ── Key Insights from the Matrix ── */}
          <Section title="Matrix Insights">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-3.5 bg-white/[0.02] rounded-lg border-l-2 border-red-500/40">
                <p className="text-[12px] font-bold text-red-400 mb-1">FSA dominates the matrix</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  FSA is priority 3 on 7 of the 11 steps (LOS, Concept Check, QBank, Error Analysis, Traps, Reinforcement, Repetition).
                  It is the topic that requires the most structured effort.
                </p>
              </div>
              <div className="p-3.5 bg-white/[0.02] rounded-lg border-l-2 border-red-500/40">
                <p className="text-[12px] font-bold text-red-400 mb-1">ETH: QBank + Traps = key</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ethics is P3 on steps 5-8 and 11 but P0 on Essential Sheet and Concept Check.
                  It is a practice topic, not a flashcard topic — the method is different.
                </p>
              </div>
              <div className="p-3.5 bg-white/[0.02] rounded-lg border-l-2 border-amber-500/40">
                <p className="text-[12px] font-bold text-amber-400 mb-1">Calculator: FI, QM, DER</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Only 3 topics are P3 for calculator. Focus your TVM, duration and pricing drills
                  on Fixed Income, Quant Methods and Derivatives.
                </p>
              </div>
              <div className="p-3.5 bg-white/[0.02] rounded-lg border-l-2 border-blue-500/40">
                <p className="text-[12px] font-bold text-blue-400 mb-1">ALT is the lightest</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Alternative Investments has no P3 in the matrix. Priority 1-2 everywhere.
                  At 6.5% weight, it is a topic to cover without investing too much time.
                </p>
              </div>
            </div>
          </Section>
        </div>
      )}

      {tab === 'strategies' && (
        <div className="space-y-4">
          <Section title="Strategies of Successful Candidates">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {STRATEGIES.map(s => (
                <div key={s.title} className="p-3 bg-white/[0.02] rounded-lg border-l-2 border-blue-500/40">
                  <p className="text-[13px] font-medium text-white mb-1">{s.title}</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Most Common Mistakes">
            <div className="space-y-2">
              {COMMON_MISTAKES.map(m => (
                <div key={m.mistake} className="flex items-start gap-4 p-4 bg-white/[0.02] rounded-lg">
                  <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                    m.impact === 'critical' ? 'bg-red-500/20 text-red-400' :
                    m.impact === 'high' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>{m.impact}</span>
                  <div>
                    <p className="text-[13px] font-medium text-white">{m.mistake}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{m.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === 'data' && (
        <div className="space-y-4">
          <Section title="Study Hours vs Pass Rate">
            <div className="space-y-2">
              {STUDY_HOURS.map(s => (
                <div key={s.range} className="flex items-center gap-4">
                  <span className="text-[11px] text-slate-400 w-16 text-right">{s.range}</span>
                  <div className="flex-1 h-5 bg-white/[0.03] rounded overflow-hidden relative">
                    <div
                      className={`h-full rounded transition-all ${s.pass ? 'bg-emerald-500/50' : 'bg-red-500/40'}`}
                      style={{ width: `${s.pct}%` }}
                    />
                    <div className="absolute left-[70%] top-0 bottom-0 w-px bg-amber-500/40" />
                  </div>
                  <span className={`text-[11px] w-10 text-right tabular-nums font-medium ${s.pass ? 'text-emerald-400' : 'text-red-400'}`}>
                    {s.pct}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-600 mt-3">Source: CFA Institute Candidate Survey. Yellow line = MPS zone (~70%)</p>
          </Section>

          <Section title="Most Useful Materials (candidate survey)">
            <div className="space-y-2">
              {[
                { material: 'QBank / Practice Questions', pct: 92 },
                { material: 'Mock Exams (CFA Institute)', pct: 88 },
                { material: 'Review sheets', pct: 76 },
                { material: 'Videos (Kaplan / Mark Meldrum)', pct: 71 },
                { material: 'Official CFA Curriculum', pct: 54 },
                { material: 'Flashcards', pct: 48 },
                { material: 'Study groups', pct: 32 },
              ].map(m => (
                <div key={m.material} className="flex items-center gap-4">
                  <span className="text-[11px] text-slate-300 flex-1">{m.material}</span>
                  <div className="w-32 h-3 bg-white/[0.03] rounded overflow-hidden">
                    <div className="h-full rounded bg-purple-500/50" style={{ width: `${m.pct}%` }} />
                  </div>
                  <span className="text-[11px] text-purple-400 w-10 text-right tabular-nums">{m.pct}%</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Common Exam Day Traps">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                { trap: '"LEAST likely" questions', tip: 'Read the prompt twice. 20% of questions use negations.' },
                { trap: 'Wrong calculator format', tip: 'Check P/Y=1 and END mode before every TVM calculation.' },
                { trap: 'Poor time management', tip: '90 sec/question max. At 60 sec with no answer, flag and move on.' },
                { trap: 'Fatigue after the break', tip: 'The 2nd session tests the heavy topics (FI, DER). Stay alert.' },
                { trap: 'Ethics last', tip: 'If done last, fatigue increases errors. Some do it first.' },
                { trap: 'Changing your answers', tip: 'Statistically, your first instinct is often correct. Only change if certain.' },
              ].map(t => (
                <div key={t.trap} className="p-3 bg-white/[0.02] rounded-lg">
                  <p className="text-[12px] font-medium text-amber-400 mb-1">{t.trap}</p>
                  <p className="text-[11px] text-slate-400">{t.tip}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === 'calculator' && (
        <div className="space-y-4">
          <Section title="BA II Plus Mastery — Essential Shortcuts">
            <div className="space-y-1">
              {CALCULATOR_SHORTCUTS.map(s => (
                <div key={s.key} className="flex items-center gap-4 p-2.5 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] transition-colors">
                  <code className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded min-w-[160px]">{s.key}</code>
                  <span className="text-[12px] text-slate-300">{s.action}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Mandatory Initial Setup">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 bg-white/[0.02] rounded-lg border border-amber-500/20">
                <p className="text-xs font-bold text-amber-400 mb-2">BEFORE EVERY EXAM</p>
                <ol className="space-y-1.5 text-[11px] text-slate-300 list-decimal list-inside">
                  <li>2ND + CLR TVM (reset)</li>
                  <li>2ND + P/Y → 1 → ENTER</li>
                  <li>2ND + FORMAT → 4 (decimals) → ENTER</li>
                  <li>Verify END mode (not BGN)</li>
                  <li>Quick test: N=10, I/Y=5, PV=-1000, PMT=0, CPT FV = 1628.89</li>
                </ol>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-lg border border-blue-500/20">
                <p className="text-xs font-bold text-blue-400 mb-2">KEY TVM FORMULAS</p>
                <div className="space-y-2 text-[11px] text-slate-300 font-mono">
                  <p>FV = PV × (1+r)^n</p>
                  <p>PV = FV / (1+r)^n</p>
                  <p>Annuity: PV = PMT × [1-(1+r)^-n] / r</p>
                  <p>EAR = (1 + r/m)^m - 1</p>
                  <p>HPR = (P1 - P0 + D) / P0</p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Quick Practice Exercises">
            <div className="space-y-4">
              {[
                { q: 'PV of $10,000 in 5 years at 6%', setup: 'N=5, I/Y=6, FV=10000, PMT=0, CPT PV', answer: '-$7,472.58' },
                { q: 'PMT of a $200k loan, 30 years, 4.5%', setup: 'N=360, I/Y=4.5/12, PV=200000, FV=0, CPT PMT', answer: '-$1,013.37' },
                { q: 'IRR: -$1000, +$300, +$400, +$500, +$200', setup: 'CF0=-1000, C01=300, C02=400, C03=500, C04=200, IRR CPT', answer: '14.49%' },
              ].map(e => (
                <div key={e.q} className="p-3 bg-white/[0.02] rounded-lg">
                  <p className="text-[12px] text-white font-medium mb-1">{e.q}</p>
                  <code className="text-[11px] text-slate-500 block mb-1">{e.setup}</code>
                  <p className="text-[12px] text-emerald-400 font-mono font-bold">{e.answer}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === 'eisenhower' && <EisenhowerPlanner />}
    </div>
  )
}
