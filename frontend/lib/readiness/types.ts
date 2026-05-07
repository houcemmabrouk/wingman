export interface ReadinessSnapshot {
  examDateLabel: string
  q1: ReadinessProjection
  q2: UntouchedSummary
  q3: ForgettingDebt
  q4: CalibrationBreakdown
  q5: TimePerQuestion
  q6: EffortAlignment
  diagnoses: CrossKpiDiagnosis[]
  nextBestAction: NextBestAction
}

export interface ReadinessProjection {
  current: number
  passThreshold: number
  pace: { delta: number; horizonDays: number }
  projectedAtExam: number
  targetClear: number
  guidance: string
}

export interface UntouchedSummary {
  count: number
  totalWeightPct: number
  top: UntouchedLM[]
  others: { lmCount: number; topicsLabel: string; weightPct: number }
  guidance: string
}

export interface UntouchedLM {
  topic: string
  lmCode: string
  title: string
  weightPct: number
}

export interface ForgettingDebt {
  overdueCount: number
  oldestDaysLate: number
  buckets: ForgettingDayBucket[]
  guidance: string
  clearMinutes: number
}

export interface ForgettingDayBucket {
  label: string
  height: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface CalibrationBreakdown {
  sureWrongRate: number
  sureWrongCount: number
  segments: CalibrationSegment[]
  guidance: string
}

export interface CalibrationSegment {
  key: 'sure-right' | 'sure-wrong' | 'unsure'
  label: string
  pct: number
  tone: 'success' | 'danger' | 'tertiary'
}

export interface TimePerQuestion {
  avgSeconds: number
  targetSeconds: number
  overshootPct: number
  expectedFinishedOutOf: { finished: number; total: number }
  guidance: string
}

export interface EffortAlignment {
  misalignedCount: number
  topics: EffortVsWeightTopic[]
  guidance: string
}

export interface EffortVsWeightTopic {
  topic: string
  effortPct: number
  weightPct: number
  status: 'over' | 'under'
  severity: 'warning' | 'danger'
}

export interface CrossKpiDiagnosis {
  tone: 'warning' | 'danger'
  title: string
  body: string
}

export interface NextBestAction {
  body: string
  prompt: string
}
