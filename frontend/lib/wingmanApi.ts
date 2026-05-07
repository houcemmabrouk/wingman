/**
 * Centralized API client for the Wingman backend.
 *
 * Identity is now carried by the auth cookie / Bearer token (resolved by
 * `AuthMiddleware` into `request.state.user_id` on the backend per AUDIT C1).
 * This client no longer injects `?user_id=` — every endpoint reads the user
 * from the session itself.
 *
 * Conventions:
 *   - Every wrapper returns the parsed JSON shape, or `null` / a sane default
 *     on failure (so callers don't need try/catch for cosmetic UI fetches).
 *   - For mutations or anything where the caller MUST know it failed, use
 *     `apiFetch` directly — it throws on non-2xx.
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Demo/fallback UUID — what the backend's `AuthMiddleware` injects when
// `AUTH_DISABLED=true`. Kept here for the rare bit of UI that wants to render
// the user's UUID directly before /auth/session has resolved.
const DEMO_UID = '00000000-0000-0000-0000-000000000001'

// ── User identity ──────────────────────────────────────────────

let _uidCache: string | null = null

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

export function getUserId(): string {
  if (typeof window === 'undefined') return DEMO_UID
  if (_uidCache && isValidUuid(_uidCache)) return _uidCache
  try {
    const raw = localStorage.getItem('wingman_user')
    if (raw) {
      const p = JSON.parse(raw)
      if (isValidUuid(p?.user_id)) {
        _uidCache = p.user_id as string
        return _uidCache!
      }
    }
  } catch { /* localStorage may throw in private mode */ }
  return DEMO_UID
}

/** Reset the cached uid — call from logout flows so the next call re-reads. */
export function resetUserIdCache() { _uidCache = null }

// ── Core fetch helper ──────────────────────────────────────────

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  /** JSON body — auto-stringified, sets Content-Type. */
  json?: unknown
  /** Extra query params. */
  query?: Record<string, string | number | boolean | undefined>
}

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body?: unknown) {
    super(message); this.status = status; this.body = body
  }
}

export async function apiFetch<T = unknown>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const { json, query, headers, ...rest } = opts
  let url = `${API}${path}`
  if (query) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) params.set(k, String(v))
    }
    const queryStr = params.toString()
    if (queryStr) url += (path.includes('?') ? '&' : '?') + queryStr
  }

  const finalHeaders: Record<string, string> = { ...(headers as Record<string, string> || {}) }
  let body: BodyInit | undefined
  if (json !== undefined) {
    body = JSON.stringify(json)
    finalHeaders['Content-Type'] = 'application/json'
  }

  const res = await fetch(url, {
    credentials: 'include',
    headers: finalHeaders,
    body,
    ...rest,
  })
  if (!res.ok) {
    let parsed: unknown = null
    try { parsed = await res.json() } catch { /* body may be empty */ }
    throw new ApiError(res.status, `HTTP ${res.status} on ${path}`, parsed)
  }
  // 204 No Content
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

/** Same as apiFetch but swallows errors and returns the fallback. Use for
 *  cosmetic UI fetches where a failure should not break the page. */
export async function apiSafe<T>(path: string, fallback: T, opts: ApiFetchOptions = {}): Promise<T> {
  try { return await apiFetch<T>(path, opts) } catch { return fallback }
}

// ── KPI endpoints ──────────────────────────────────────────────

export interface TopicMasteryRow { code: string; mastery: number; modules_studied?: number; total_modules?: number }
export interface TopicMasteryResp { topics: TopicMasteryRow[] }

export async function fetchTopicMastery(): Promise<Record<string, number>> {
  const d = await apiSafe<TopicMasteryResp>('/api/kpis/topic-mastery', { topics: [] })
  const result: Record<string, number> = {}
  for (const t of d.topics) result[t.code] = t.mastery
  return result
}

export interface TodayStats {
  total_minutes: number
  daily_goal_minutes?: number
  total_sessions?: number
  quiz_sessions?: number
  study_sessions?: number
  quiz_min?: number
  study_min?: number
}

export async function fetchTodayStats(): Promise<TodayStats> {
  return apiSafe<TodayStats>('/api/kpis/today-stats', { total_minutes: 0 })
}

export interface StreakDay { date: string; active: boolean; dow: string }
export interface StreakResp { streak: number; days: StreakDay[] }

export async function fetchStreak(): Promise<StreakResp> {
  return apiSafe<StreakResp>('/api/kpis/streak', { streak: 0, days: [] })
}

export async function fetchKPIs(): Promise<Record<string, unknown> | null> {
  return apiSafe<Record<string, unknown>>('/api/kpis', null as unknown as Record<string, unknown>)
}

export interface PeerStatsResp { source: string; peers: Record<string, number> }
export async function fetchPeerStats(): Promise<Record<string, number>> {
  const d = await apiSafe<PeerStatsResp>('/api/kpis/peer-stats', { source: '', peers: {} })
  return d.peers
}

// ── Modules / LOS ──────────────────────────────────────────────

export interface ModuleRow {
  id: number; code: string; title: string
  question_count: number; flashcard_count: number
  mastery_level?: number | null; last_studied?: string | null
}
export interface TopicRow {
  id: number; code: string; name: string; weight_pct: number
  modules: ModuleRow[]
}
export interface ModulesResp { topics: TopicRow[] }

export async function fetchModules(): Promise<TopicRow[]> {
  const d = await apiSafe<ModulesResp>('/api/modules', { topics: [] })
  return d.topics
}

export interface LosOutcome {
  code: string; description: string; bloom_level: number
  mastery: number; attempts_total: number; attempts_correct: number
}
export interface LosMasteryResp { outcomes: LosOutcome[]; module_id: number }

export async function fetchLosMastery(moduleId: number): Promise<LosOutcome[]> {
  const d = await apiSafe<LosMasteryResp>('/api/kpis/los-mastery', { outcomes: [], module_id: moduleId }, {
    query: { module_id: moduleId },
  })
  return d.outcomes
}

// ── Sessions ────────────────────────────────────────────────────

export interface SessionHistoryRow {
  session_id: number; session_type: string; started_at: string
  duration_sec: number; score_pct: number
  questions_total: number; questions_correct: number
  module_code: string; module_title: string; topic_code: string
  has_ai_analysis: boolean
}
export interface SessionHistoryResp { sessions: SessionHistoryRow[]; total: number }

export async function fetchSessionsHistory(limit = 30, offset = 0): Promise<SessionHistoryResp> {
  return apiSafe<SessionHistoryResp>('/api/sessions/history', { sessions: [], total: 0 }, {
    query: { limit, offset },
  })
}

export async function deleteSession(sessionId: number): Promise<void> {
  await apiFetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
}

export async function deleteChecklist(checklistId: number): Promise<void> {
  await apiFetch(`/api/sessions/checklist/${checklistId}`, { method: 'DELETE' })
}

// ── Alerts ──────────────────────────────────────────────────────

export interface AlertRow { id: number; severity?: string; is_read?: boolean }
export async function fetchAlerts(): Promise<AlertRow[]> {
  return apiSafe<AlertRow[]>('/api/alerts', [])
}

// ── Memory ──────────────────────────────────────────────────────

export interface MemoryRetentionGlobal {
  fading?: number; at_risk?: number; unseen?: number
}
export interface MemoryRetentionResp { global: MemoryRetentionGlobal }

export async function fetchMemoryRetention(includeUnseen = false): Promise<MemoryRetentionGlobal> {
  const d = await apiSafe<MemoryRetentionResp>('/api/v1/memory/retention', { global: {} }, {
    query: { include_unseen: includeUnseen },
  })
  return d.global
}

// ── User profile ────────────────────────────────────────────────

export interface UserProfile { exam_date?: string; daily_minutes_goal?: number }

export async function fetchUserProfile(): Promise<UserProfile> {
  return apiSafe<UserProfile>('/api/user/profile', {})
}

// ── NBA Hero + Inbox ────────────────────────────────────────────

export interface NbaHero {
  topic: string
  lm: string
  los?: string
  action_text: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  deadline: string
  mastery_pct: number
  exam_weight_pct: number
  urgency_score: number
  module_title: string
  topic_name: string
  los_description?: string
  days_until_exam: number
  attempts?: number
  recent_errors_count?: number
}

export async function fetchNbaHero(): Promise<NbaHero | null> {
  return apiSafe<NbaHero | null>('/api/v1/nba/hero', null)
}

export type InboxCategory = 'action' | 'alert' | 'dispute' | 'coach' | 'plan' | 'srs'

export interface InboxItemDTO {
  item_key: string
  category: InboxCategory
  icon: string
  from: string
  title: string
  preview: string
  meta: string[]
  cta_url: string
  time: string
  unread: boolean
  urgent: boolean
  entry_at_iso: string | null
}

export interface InboxResp {
  items: InboxItemDTO[]
  total: number
  unread_count: number
}

export async function fetchInbox(): Promise<InboxResp> {
  return apiSafe<InboxResp>('/api/v1/inbox', { items: [], total: 0, unread_count: 0 })
}

export async function fetchInboxUnreadCount(): Promise<number> {
  const d = await apiSafe<{ unread_count: number }>('/api/v1/inbox/unread-count', { unread_count: 0 })
  return d.unread_count
}

export async function markInboxRead(itemKey: string): Promise<void> {
  await apiFetch('/api/v1/inbox/mark-read', { method: 'POST', json: { item_key: itemKey } })
}

export async function dismissInbox(itemKey: string): Promise<void> {
  await apiFetch('/api/v1/inbox/dismiss', { method: 'POST', json: { item_key: itemKey } })
}

// LOS failure history (for SystemDiagnostic block)
export interface LosFailure {
  attempt_id: number
  question_id: number
  created_at: string
  stem: string
  user_answer: string | null
  correct_answer: string | null
  explanation: string | null
  module_code: string
  los_code: string
  los_description: string
}

export interface LosFailuresResp { los_code: string; count: number; failures: LosFailure[] }

export async function fetchLosFailures(losCode: string, limit = 5): Promise<LosFailuresResp> {
  return apiSafe<LosFailuresResp>(`/api/v1/nba/failures/${encodeURIComponent(losCode)}`,
    { los_code: losCode, count: 0, failures: [] }, { query: { limit } })
}

// ── Auth ────────────────────────────────────────────────────────

export interface AuthConfig { auth_disabled: boolean; google_enabled: boolean }

export async function fetchAuthConfig(): Promise<AuthConfig> {
  return apiSafe<AuthConfig>('/api/auth/config', { auth_disabled: false, google_enabled: false })
}
