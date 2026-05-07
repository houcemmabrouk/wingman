// ── Wingman Dashboard Types ─────────────────────────────────

export interface DashboardData {
  user: { name: string; examDate: string; daysToExam: number }
  kpis: {
    globalScore: number
    passRate: number
    projectedScore: number
    atRiskTopics: string[]
    coverage: number
    streak: number
    totalHours: number
    srsAdherence: number
  }
  topicScores: Array<{
    code: string
    name: string
    score: number
    weight: number
    status: 'strong' | 'adequate' | 'weak'
  }>
  alerts: Array<{
    id: string
    type: 'weakness' | 'regression' | 'delay' | 'srs' | 'info'
    severity: 'critical' | 'warning' | 'info'
    title: string
    body: string
  }>
  sessions: Array<{ session: number; score: number }>
  mockScores: Array<{ mock: number; score: number; passRate: number }>
  dailyPlan: Array<{
    id: string
    title: string
    lm: string
    minutes: number
    type: string
    completed: boolean
    active: boolean
  }>
  streakDays: boolean[]
  lmMastery: Array<{ code: string; topic: string; score: number }>
  fatigueCurve: number[]
  consistency: Array<{ topic: string; sigma: number }>
  projection: Array<{ label: string; score: number | null }>
  repeatErrors: Array<{ topic: string; rate: number }>
  srsWeeks: Array<{ week: string; adherence: number }>
}
