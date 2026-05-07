import type { ReadinessSnapshot } from './types'

export const READINESS_MOCK: ReadinessSnapshot = {
  examDateLabel: 'August 18',
  q1: {
    current: 62,
    passThreshold: 70,
    pace: { delta: 8, horizonDays: 14 },
    projectedAtExam: 78,
    targetClear: 80,
    guidance:
      'At current pace you reach 78% by Aug 18. To clear 80%: +30% QBank on Fixed Income and Equity over 14 days.',
  },
  q2: {
    count: 7,
    totalWeightPct: 25,
    top: [
      { topic: 'FRA', lmCode: 'LM07', title: 'Inventories', weightPct: 5.1 },
      { topic: 'Derivatives', lmCode: 'LM03', title: 'Forward markets', weightPct: 4.8 },
    ],
    others: { lmCount: 5, topicsLabel: 'Equity, Alternative, PM', weightPct: 15.1 },
    guidance:
      'A LM left untouched is a guaranteed 0% on its share of the exam. Open the top 2 first — they alone weigh 9.9%.',
  },
  q3: {
    overdueCount: 22,
    oldestDaysLate: 4,
    buckets: [
      { label: '-7d', height: 30, severity: 'low' },
      { label: '-6d', height: 45, severity: 'low' },
      { label: '-5d', height: 55, severity: 'medium' },
      { label: '-4d', height: 50, severity: 'medium' },
      { label: '-3d', height: 70, severity: 'high' },
      { label: '-2d', height: 85, severity: 'high' },
      { label: 'today', height: 100, severity: 'critical' },
    ],
    guidance:
      "Every overdue day, retention drops ~10%. Don't open new content until the queue is back to zero.",
    clearMinutes: 18,
  },
  q4: {
    sureWrongRate: 17,
    sureWrongCount: 7,
    segments: [
      { key: 'sure-right', label: 'sure & right', pct: 64, tone: 'success' },
      { key: 'sure-wrong', label: 'sure & wrong', pct: 17, tone: 'danger' },
      { key: 'unsure', label: 'unsure', pct: 19, tone: 'tertiary' },
    ],
    guidance:
      "This is your hidden risk. You won't fix what you don't know is broken. Debrief now while the reasoning is fresh.",
  },
  q5: {
    avgSeconds: 132,
    targetSeconds: 90,
    overshootPct: 47,
    expectedFinishedOutOf: { finished: 132, total: 180 },
    guidance:
      'At this pace you finish 132 of 180 questions. Train under exam conditions: timed, no pause, no review.',
  },
  q6: {
    misalignedCount: 3,
    topics: [
      { topic: 'Ethics', effortPct: 22, weightPct: 15, status: 'over', severity: 'warning' },
      { topic: 'Fixed Income', effortPct: 8, weightPct: 11, status: 'under', severity: 'danger' },
      { topic: 'Alternatives', effortPct: 12, weightPct: 7, status: 'over', severity: 'warning' },
    ],
    guidance:
      'You are over-investing in Ethics and Alternatives. Reallocate 6h/week from these to Fixed Income for the next 14 days.',
  },
  diagnoses: [
    {
      tone: 'warning',
      title: 'Coverage low + Mastery rising → perfectionist drift',
      body:
        'You polish what you know instead of opening what you don\'t. Increase reading speed, accept lower first-pass scores.',
    },
    {
      tone: 'danger',
      title: 'Forgetting debt rising + new content advancing → leaky bucket',
      body:
        "You're filling a sieve. Block 3 days, only review. No new LM until the queue is empty.",
    },
    {
      tone: 'warning',
      title: 'Time per Q over 120s + accuracy ok → automation gap',
      body:
        "Even with 100% accuracy you don't finish. Drill calculator reflexes, train fast-reading on vignettes.",
    },
  ],
  nextBestAction: {
    body: 'Clear SRS queue (18 min) → debrief 7 sure-&-wrong (12 min) → 60Q timed block',
    prompt:
      'Operate the next best action sequence: clear SRS queue, then debrief sure-and-wrong questions, then run 60Q timed block',
  },
}
