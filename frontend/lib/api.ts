/**
 * Legacy `api.foo()` namespace wrapper. Forwards every call through `apiFetch`
 * from wingmanApi so we have a single fetch funnel. Identity now travels in
 * the auth cookie (per AUDIT C1), so no caller passes `user_id` anymore.
 */
import { apiFetch } from './wingmanApi'

function request<T>(path: string, options?: RequestInit): Promise<T> {
  return apiFetch<T>(path, options as object)
}

// ── Types ────────────────────────────────────────────────────

export interface DailyBriefData {
  user_id: string
  display_name: string
  streak_current: number
  xp_total: number
  daily_minutes_goal: number
  today_minutes: number
  today_sessions: number
  cards_due: number
  unread_alerts: number
  exam_date: string | null
  days_until_exam: number | null
}

export interface SessionData {
  session_id: number
  started_at: string
  session_type: string
}

export interface Alert {
  id: number
  alert_type: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string
}

export interface PlanTask {
  id: number
  module_code: string
  module_title: string
  scheduled_date: string
  status: string
  topic_code: string
}

// ── API Client ───────────────────────────────────────────────

export const api = {
  // Daily Monitor
  getDailyBrief: () =>
    request<DailyBriefData>('/api/v1/daily-brief'),

  startSession: (sessionType: string = 'study', moduleCode?: string) =>
    request<SessionData>('/api/v1/session/start', {
      method: 'POST',
      body: JSON.stringify({ session_type: sessionType, module_code: moduleCode }),
      headers: { 'Content-Type': 'application/json' },
    }),

  stopSession: (sessionId: number) =>
    request<{ duration_sec: number }>('/api/v1/session/stop', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
      headers: { 'Content-Type': 'application/json' },
    }),

  getAlerts: () =>
    request<Alert[]>('/api/v1/alerts'),

  getTodayPlan: () =>
    request<PlanTask[]>('/api/v1/plan/today'),

  // Planning
  generatePlan: (examDate: string, dailyHours: number) =>
    request<{ plan_id: number; total_entries: number; exam_date: string; entries: unknown[] }>(
      '/api/plan/generate', {
        method: 'POST',
        body: JSON.stringify({ exam_date: examDate, daily_hours: dailyHours }),
        headers: { 'Content-Type': 'application/json' },
      }),

  recalibratePlan: (lmId: number, scorePct: number) =>
    request<{ action: string; lm_code?: string; injected_date?: string; message?: string }>(
      '/api/plan/recalibrate', {
        method: 'POST',
        body: JSON.stringify({ lm_id: lmId, score_pct: scorePct }),
        headers: { 'Content-Type': 'application/json' },
      }),

  // Flashcards
  reviewFlashcard: (flashcardId: number, lmId: number, score: number) =>
    request<{ status: string }>('/api/flashcards/review', {
      method: 'POST',
      body: JSON.stringify({ flashcard_id: flashcardId, lm_id: lmId, score }),
      headers: { 'Content-Type': 'application/json' },
    }),

  // AI Chat
  aiChat: (message: string, history: { role: string; content: string }[], moduleContext?: string) =>
    request<{ reply: string; usage: Record<string, number> }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, module_context: moduleContext || null }),
      headers: { 'Content-Type': 'application/json' },
    }),
}
