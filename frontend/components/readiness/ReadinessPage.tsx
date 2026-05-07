'use client'

import type { ReadinessSnapshot } from '@/lib/readiness/types'
import QuestionCard from './QuestionCard'
import CrossKpiPanel from './CrossKpiPanel'
import NextBestActionBar from './NextBestActionBar'
import ProgressBar from './viz/ProgressBar'
import UntouchedList from './viz/UntouchedList'
import ForgettingChart from './viz/ForgettingChart'
import CalibrationBar from './viz/CalibrationBar'
import TimeBar from './viz/TimeBar'
import EffortVsWeight from './viz/EffortVsWeight'

interface Props {
  snapshot: ReadinessSnapshot
}

export default function ReadinessPage({ snapshot }: Props) {
  const { q1, q2, q3, q4, q5, q6, diagnoses, nextBestAction, examDateLabel } = snapshot

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#0B1220] -m-4 md:-m-6 p-4 md:p-6">
      <div className="container max-w-3xl mx-auto px-6 py-8 flex flex-col gap-3">
        <header className="mb-2">
          <span className="text-[10px] tracking-[0.08em] uppercase text-slate-500">Readiness</span>
          <h1 className="text-xl font-medium text-slate-100 mt-1">
            Six questions to answer this morning
          </h1>
        </header>

        <QuestionCard
          number={1}
          question={`Will I pass on ${examDateLabel}?`}
          state={
            <p>
              <span className="text-5xl font-medium text-slate-100 tabular-nums">{q1.current}</span>
              <span className="text-2xl text-slate-400 tabular-nums">%</span>
              <span className="ml-3 text-sm text-slate-400">
                Readiness · below {q1.passThreshold}% pass threshold ·{' '}
                <span className={q1.pace.delta >= 0 ? 'text-teal-300' : 'text-red-300'}>
                  {q1.pace.delta >= 0 ? '+' : ''}
                  {q1.pace.delta} pts in {q1.pace.horizonDays}d
                </span>
              </span>
            </p>
          }
          viz={<ProgressBar data={q1} />}
          guidance={q1.guidance}
          actionLabel="Adjust plan"
          actionPrompt="Adjust my study plan to reach 80% readiness by August 18"
        />

        <QuestionCard
          number={2}
          question="What have I never opened?"
          state={
            <p>
              <span className="text-5xl font-medium text-slate-100 tabular-nums">{q2.count}</span>
              <span className="ml-3 text-sm text-slate-400">
                LM untouched ·{' '}
                <span className="text-amber-300 tabular-nums">
                  {q2.totalWeightPct}%
                </span>{' '}
                of total CFA weight
              </span>
            </p>
          }
          viz={<UntouchedList data={q2} />}
          guidance={q2.guidance}
          actionLabel="Schedule discovery"
          actionPrompt="Schedule discovery sessions for the 7 untouched LMs, top 2 first by CFA weight"
        />

        <QuestionCard
          number={3}
          question="What am I forgetting?"
          state={
            <p>
              <span className="text-5xl font-medium text-slate-100 tabular-nums">
                {q3.overdueCount}
              </span>
              <span className="ml-3 text-sm text-slate-400">
                cards overdue · oldest{' '}
                <span className="text-red-300 tabular-nums">{q3.oldestDaysLate} days</span> late
              </span>
            </p>
          }
          viz={<ForgettingChart data={q3} />}
          guidance={q3.guidance}
          actionLabel={`Clear · ${q3.clearMinutes} min`}
          actionPrompt="Run my SRS review queue until the overdue debt is cleared, then stop"
        />

        <QuestionCard
          number={4}
          question="Where am I confidently wrong?"
          state={
            <p>
              <span className="text-5xl font-medium text-slate-100 tabular-nums">
                {q4.sureWrongRate}
              </span>
              <span className="text-2xl text-slate-400 tabular-nums">%</span>
              <span className="ml-3 text-sm text-slate-400">
                &quot;sure &amp; wrong&quot; rate ·{' '}
                <span className="text-red-300 tabular-nums">{q4.sureWrongCount} questions</span>{' '}
                yesterday
              </span>
            </p>
          }
          viz={<CalibrationBar data={q4} />}
          guidance={q4.guidance}
          actionLabel={`Debrief ${q4.sureWrongCount}`}
          actionPrompt="Show me the 7 questions I was confident about but answered wrong yesterday with full debrief"
        />

        <QuestionCard
          number={5}
          question="Will I finish in time?"
          state={
            <p>
              <span className="text-5xl font-medium text-slate-100 tabular-nums">
                {q5.avgSeconds}
              </span>
              <span className="text-2xl text-slate-400 tabular-nums">s</span>
              <span className="ml-3 text-sm text-slate-400">
                avg per question ·{' '}
                <span className="text-amber-300 tabular-nums">
                  {q5.overshootPct}% over
                </span>{' '}
                the {q5.targetSeconds}s target
              </span>
            </p>
          }
          viz={<TimeBar data={q5} />}
          guidance={q5.guidance}
          actionLabel="Run 60Q timed"
          actionPrompt="Start a 60Q timed mock block, no pause, no review until the end"
        />

        <QuestionCard
          number={6}
          question="Where is my time poorly invested?"
          state={
            <p>
              <span className="text-5xl font-medium text-slate-100 tabular-nums">
                {q6.misalignedCount}
              </span>
              <span className="ml-3 text-sm text-slate-400">
                topics misaligned · effort vs CFA weight ratio out of balance
              </span>
            </p>
          }
          viz={<EffortVsWeight data={q6} />}
          guidance={q6.guidance}
          actionLabel="Rebalance"
          actionPrompt="Rebalance my study plan: shift 6h/week from Ethics and Alternatives to Fixed Income for the next 14 days"
        />

        <CrossKpiPanel diagnoses={diagnoses} />

        <NextBestActionBar data={nextBestAction} />
      </div>
    </div>
  )
}
