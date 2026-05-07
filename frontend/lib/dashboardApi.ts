import type { DashboardData } from './types'
import { apiFetch, ApiError } from './wingmanApi'

// ── Mock data (fallback when API is unavailable) ──────────

const MOCK: DashboardData = {
  user: { name: 'Houcine', examDate: '2026-08-22', daysToExam: 150 },
  kpis: {
    globalScore: 68,
    passRate: 62,
    projectedScore: 74,
    atRiskTopics: ['FI', 'DER', 'ECO'],
    coverage: 72,
    streak: 14,
    totalHours: 186,
    srsAdherence: 78,
  },
  topicScores: [
    { code: 'ETH', name: 'Ethics', score: 82, weight: 15, status: 'strong' },
    { code: 'QM', name: 'Quant Methods', score: 75, weight: 10, status: 'strong' },
    { code: 'ECO', name: 'Economics', score: 58, weight: 10, status: 'weak' },
    { code: 'FSA', name: 'Financial Statement Analysis', score: 71, weight: 15, status: 'adequate' },
    { code: 'CORP', name: 'Corporate Issuers', score: 69, weight: 10, status: 'adequate' },
    { code: 'EQU', name: 'Equity', score: 73, weight: 11, status: 'adequate' },
    { code: 'FI', name: 'Fixed Income', score: 55, weight: 11, status: 'weak' },
    { code: 'DER', name: 'Derivatives', score: 52, weight: 6, status: 'weak' },
    { code: 'ALT', name: 'Alt. Investments', score: 67, weight: 6, status: 'adequate' },
    { code: 'PM', name: 'Portfolio Mgmt', score: 70, weight: 6, status: 'adequate' },
  ],
  alerts: [
    { id: '1', type: 'weakness', severity: 'critical', title: 'Critical weakness — FI-03 Securitization', body: 'Average score 42% over last 3 sessions' },
    { id: '2', type: 'regression', severity: 'critical', title: 'Regression — DER-02 Forward Commitments', body: 'Score dropped from 78% to 48% in 2 sessions' },
    { id: '3', type: 'delay', severity: 'warning', title: '2 days behind schedule', body: '3 LMs not completed this week' },
    { id: '4', type: 'srs', severity: 'warning', title: '12 SRS flashcards overdue', body: 'ECO-04, FI-01, FI-05 to review' },
    { id: '5', type: 'info', severity: 'info', title: 'New mock available', body: 'Mock #9 ready — 180 questions, 3h' },
  ],
  sessions: [
    { session: 1, score: 52 }, { session: 2, score: 55 }, { session: 3, score: 54 },
    { session: 4, score: 59 }, { session: 5, score: 58 }, { session: 6, score: 62 },
    { session: 7, score: 61 }, { session: 8, score: 65 }, { session: 9, score: 63 },
    { session: 10, score: 67 }, { session: 11, score: 66 }, { session: 12, score: 68 },
  ],
  mockScores: [
    { mock: 1, score: 48, passRate: 35 }, { mock: 2, score: 51, passRate: 38 },
    { mock: 3, score: 55, passRate: 42 }, { mock: 4, score: 58, passRate: 47 },
    { mock: 5, score: 62, passRate: 52 }, { mock: 6, score: 60, passRate: 50 },
    { mock: 7, score: 65, passRate: 58 }, { mock: 8, score: 68, passRate: 62 },
  ],
  dailyPlan: [
    { id: '1', title: 'Review FI-03 Securitization', lm: 'FI-03', minutes: 45, type: 'review', completed: true, active: false },
    { id: '2', title: 'MCQ DER-02 Forward Commitments', lm: 'DER-02', minutes: 30, type: 'qcm', completed: true, active: false },
    { id: '3', title: 'SRS Flashcards — ECO batch', lm: 'ECO-04', minutes: 20, type: 'srs', completed: false, active: true },
    { id: '4', title: 'Reading FSA-07 Income Taxes', lm: 'FSA-07', minutes: 40, type: 'study', completed: false, active: false },
    { id: '5', title: 'MCQ PM-03 Risk & Return I', lm: 'PM-03', minutes: 25, type: 'qcm', completed: false, active: false },
  ],
  streakDays: [
    true, true, true, false, true, true, true,
    true, true, true, true, false, true, true,
    true, true, true, true, true, true, true,
  ],
  lmMastery: [
    { code: 'ETH-01', topic: 'ETH', score: 85 }, { code: 'ETH-02', topic: 'ETH', score: 80 },
    { code: 'ETH-03', topic: 'ETH', score: 78 }, { code: 'ETH-04', topic: 'ETH', score: 88 },
    { code: 'ETH-05', topic: 'ETH', score: 82 },
    { code: 'QM-01', topic: 'QM', score: 90 }, { code: 'QM-02', topic: 'QM', score: 85 },
    { code: 'QM-03', topic: 'QM', score: 72 }, { code: 'QM-04', topic: 'QM', score: 68 },
    { code: 'QM-05', topic: 'QM', score: 75 }, { code: 'QM-06', topic: 'QM', score: 65 },
    { code: 'QM-07', topic: 'QM', score: 78 }, { code: 'QM-08', topic: 'QM', score: 70 },
    { code: 'QM-09', topic: 'QM', score: 74 }, { code: 'QM-10', topic: 'QM', score: 82 },
    { code: 'QM-11', topic: 'QM', score: 60 },
    { code: 'ECO-01', topic: 'ECO', score: 62 }, { code: 'ECO-02', topic: 'ECO', score: 55 },
    { code: 'ECO-03', topic: 'ECO', score: 58 }, { code: 'ECO-04', topic: 'ECO', score: 50 },
    { code: 'ECO-05', topic: 'ECO', score: 48 }, { code: 'ECO-06', topic: 'ECO', score: 65 },
    { code: 'ECO-07', topic: 'ECO', score: 60 }, { code: 'ECO-08', topic: 'ECO', score: 68 },
    { code: 'FSA-01', topic: 'FSA', score: 78 }, { code: 'FSA-02', topic: 'FSA', score: 72 },
    { code: 'FSA-03', topic: 'FSA', score: 68 }, { code: 'FSA-04', topic: 'FSA', score: 75 },
    { code: 'FSA-05', topic: 'FSA', score: 70 }, { code: 'FSA-06', topic: 'FSA', score: 65 },
    { code: 'FSA-07', topic: 'FSA', score: 58 }, { code: 'FSA-08', topic: 'FSA', score: 72 },
    { code: 'FSA-09', topic: 'FSA', score: 76 }, { code: 'FSA-10', topic: 'FSA', score: 80 },
    { code: 'CORP-01', topic: 'CORP', score: 72 }, { code: 'CORP-02', topic: 'CORP', score: 68 },
    { code: 'CORP-03', topic: 'CORP', score: 65 }, { code: 'CORP-04', topic: 'CORP', score: 70 },
    { code: 'CORP-05', topic: 'CORP', score: 74 },
    { code: 'EQU-01', topic: 'EQU', score: 78 }, { code: 'EQU-02', topic: 'EQU', score: 72 },
    { code: 'EQU-03', topic: 'EQU', score: 68 }, { code: 'EQU-04', topic: 'EQU', score: 75 },
    { code: 'EQU-05', topic: 'EQU', score: 70 }, { code: 'EQU-06', topic: 'EQU', score: 76 },
    { code: 'FI-01', topic: 'FI', score: 62 }, { code: 'FI-02', topic: 'FI', score: 58 },
    { code: 'FI-03', topic: 'FI', score: 42 }, { code: 'FI-04', topic: 'FI', score: 55 },
    { code: 'FI-05', topic: 'FI', score: 50 }, { code: 'FI-06', topic: 'FI', score: 60 },
    { code: 'FI-07', topic: 'FI', score: 52 }, { code: 'FI-08', topic: 'FI', score: 48 },
    { code: 'FI-09', topic: 'FI', score: 65 }, { code: 'FI-10', topic: 'FI', score: 58 },
    { code: 'DER-01', topic: 'DER', score: 55 }, { code: 'DER-02', topic: 'DER', score: 48 },
    { code: 'DER-03', topic: 'DER', score: 52 }, { code: 'DER-04', topic: 'DER', score: 54 },
    { code: 'ALT-01', topic: 'ALT', score: 70 }, { code: 'ALT-02', topic: 'ALT', score: 65 },
    { code: 'ALT-03', topic: 'ALT', score: 68 },
    { code: 'PM-01', topic: 'PM', score: 72 }, { code: 'PM-02', topic: 'PM', score: 68 },
    { code: 'PM-03', topic: 'PM', score: 65 }, { code: 'PM-04', topic: 'PM', score: 75 },
  ],
  fatigueCurve: [92, 90, 88, 85, 82, 78, 75, 72, 68, 65, 60, 55],
  consistency: [
    { topic: 'ETH', sigma: 4.2 }, { topic: 'QM', sigma: 8.5 },
    { topic: 'ECO', sigma: 12.1 }, { topic: 'FSA', sigma: 6.8 },
    { topic: 'CORP', sigma: 5.4 }, { topic: 'EQU', sigma: 7.2 },
    { topic: 'FI', sigma: 14.3 }, { topic: 'DER', sigma: 11.8 },
    { topic: 'ALT', sigma: 6.0 }, { topic: 'PM', sigma: 7.8 },
  ],
  projection: [
    { label: 'S-12', score: 52 }, { label: 'S-10', score: 55 },
    { label: 'S-8', score: 60 }, { label: 'S-6', score: 64 },
    { label: 'S-4', score: 68 }, { label: 'Today', score: 68 },
    { label: 'S+4', score: 72 }, { label: 'S+8', score: 74 },
    { label: 'Exam day', score: null },
  ],
  repeatErrors: [
    { topic: 'ETH', rate: 8 }, { topic: 'QM', rate: 15 },
    { topic: 'ECO', rate: 28 }, { topic: 'FSA', rate: 18 },
    { topic: 'CORP', rate: 12 }, { topic: 'EQU', rate: 14 },
    { topic: 'FI', rate: 35 }, { topic: 'DER', rate: 32 },
    { topic: 'ALT', rate: 10 }, { topic: 'PM', rate: 16 },
  ],
  srsWeeks: [
    { week: 'S1', adherence: 65 }, { week: 'S2', adherence: 70 },
    { week: 'S3', adherence: 68 }, { week: 'S4', adherence: 75 },
    { week: 'S5', adherence: 72 }, { week: 'S6', adherence: 80 },
    { week: 'S7', adherence: 78 }, { week: 'S8', adherence: 82 },
  ],
}

// ── Fetch with fallback ───────────────────────────────────

export async function fetchDashboard(_userId?: string): Promise<DashboardData> {
  // user_id is injected by apiFetch from localStorage — kept as a no-op param
  // for callers that still pass it. When AUDIT C1 lands and we move to
  // request.state.user_id, the param can be dropped entirely.
  void _userId
  try {
    const raw = await apiFetch<Record<string, unknown>>('/api/diagnostic', { cache: 'no-store' })
    return mapApiToDashboard(raw)
  } catch (err) {
    // ApiError or network — fall back to mock so the dashboard still renders.
    void (err instanceof ApiError ? err.status : null)
    return MOCK
  }
}

// ── Map raw API response to DashboardData ─────────────────

function mapApiToDashboard(raw: Record<string, unknown>): DashboardData {
  // If the API already returns DashboardData shape, pass through
  // Otherwise map from the existing /api/diagnostic format
  try {
    const db = raw.daily_brief as Record<string, unknown> | undefined
    const pr = raw.progress as Record<string, unknown> | undefined
    const tw = (raw.top_weaknesses as Array<Record<string, unknown>>) || []
    const al = (raw.alerts as Array<Record<string, unknown>>) || []
    const mt = (raw.mock_trend as Array<Record<string, unknown>>) || []

    return {
      ...MOCK,
      user: {
        name: (db?.display_name as string) || MOCK.user.name,
        examDate: MOCK.user.examDate,
        daysToExam: (pr?.days_to_exam as number) ?? MOCK.user.daysToExam,
      },
      kpis: {
        ...MOCK.kpis,
        globalScore: (pr?.avg_score_pct as number) ?? MOCK.kpis.globalScore,
        projectedScore: (pr?.estimated_exam_score as number) ?? MOCK.kpis.projectedScore,
        coverage: (pr?.coverage_pct as number) ?? MOCK.kpis.coverage,
        streak: (raw.streak_days as number) ?? MOCK.kpis.streak,
        totalHours: (pr?.total_hours as number) ?? MOCK.kpis.totalHours,
      },
      alerts: al.length > 0
        ? al.map((a, i) => ({
            id: String(a.id ?? i),
            type: (a.alert_type as DashboardData['alerts'][0]['type']) || 'info',
            severity: ((a.severity as string) || 'info') as 'critical' | 'warning' | 'info',
            title: (a.title as string) || '',
            body: (a.body as string) || '',
          }))
        : MOCK.alerts,
      mockScores: mt.length > 0
        ? mt.map((m, i) => ({
            mock: i + 1,
            score: (m.score as number) || 0,
            passRate: (m.score as number) || 0,
          }))
        : MOCK.mockScores,
      topicScores: tw.length >= 5 ? MOCK.topicScores : MOCK.topicScores,
    }
  } catch {
    return MOCK
  }
}
