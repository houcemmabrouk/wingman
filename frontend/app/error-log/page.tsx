'use client'

import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/lib/auth'
import {
  CachedSystemError,
  clearCachedSystemErrors,
  getCachedSystemErrors,
} from '@/lib/error-logger'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface StudyEntry {
  id: string
  ts: string
  source?: string
  context?: { topic?: string; lm?: string }
  task?: string
  notes: string
  block_order?: number
}

interface SystemRow {
  id: string
  user_id: string | null
  source: 'frontend' | 'backend'
  kind: string
  message: string
  stack: string | null
  context: Record<string, unknown> | null
  created_at: string
}

interface QuizFailure {
  attempt_id: number
  session_id: number
  question_id: number
  created_at: string | null
  topic_code: string | null
  topic_name: string | null
  module_code: string | null
  module_title: string | null
  los_code: string | null
  los_description: string | null
  stem: string
  user_answer: 'A' | 'B' | 'C' | null
  user_choice: string | null
  correct_answer: 'A' | 'B' | 'C' | null
  correct_choice: string | null
  explanation: string | null
  difficulty: number | null
  time_spent_sec: number | null
  confidence: number | null
}

type EntryType = 'quiz' | 'study' | 'system'

interface UnifiedEntry {
  type: EntryType
  id: string
  ts: string
  title: string
  detail?: string
  // study
  topic?: string
  lm?: string
  task?: string
  // system
  source?: string
  kind?: string
  context?: Record<string, unknown> | null
  // quiz
  quiz?: QuizFailure
}

const TOPIC_COLORS: Record<string, string> = {
  ETH: '#f87171', QM: '#a78bfa', ECO: '#34d399', FSA: '#60a5fa',
  CORP: '#fbbf24', EQU: '#22d3ee', FI: '#f472b6', DER: '#fb923c',
  ALT: '#94a3b8', PM: '#c084fc',
}

const TYPE_BADGE: Record<EntryType, { bg: string; text: string; label: string }> = {
  quiz:   { bg: 'bg-rose-500/15',    text: 'text-rose-300',    label: 'QUIZ' },
  study:  { bg: 'bg-emerald-500/15', text: 'text-emerald-300', label: 'STUDY' },
  system: { bg: 'bg-amber-500/15',   text: 'text-amber-300',   label: 'SYSTEM' },
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

function studyToUnified(e: StudyEntry): UnifiedEntry {
  return { type: 'study', id: `study:${e.id}`, ts: e.ts, title: e.notes,
    topic: e.context?.topic, lm: e.context?.lm, task: e.task }
}

function systemRowToUnified(r: SystemRow): UnifiedEntry {
  return { type: 'system', id: `sys:${r.id}`, ts: r.created_at, title: r.message,
    detail: r.stack || undefined, source: r.source, kind: r.kind, context: r.context }
}

function cachedSysToUnified(c: CachedSystemError): UnifiedEntry {
  return { type: 'system', id: `sys-cache:${c.id}`, ts: c.ts, title: c.message,
    detail: c.stack, source: c.source, kind: c.kind, context: c.context }
}

function quizToUnified(f: QuizFailure): UnifiedEntry {
  return {
    type: 'quiz',
    id: `quiz:${f.attempt_id}`,
    ts: f.created_at || new Date().toISOString(),
    title: f.stem,
    topic: f.topic_code || undefined,
    lm: f.module_code || undefined,
    quiz: f,
  }
}

export default function ErrorLogPage() {
  const { user } = useAuth()
  const [studyEntries, setStudyEntries] = useState<StudyEntry[]>([])
  const [serverSystem, setServerSystem] = useState<SystemRow[]>([])
  const [cachedSystem, setCachedSystem] = useState<CachedSystemError[]>([])
  const [quizFailures, setQuizFailures] = useState<QuizFailure[]>([])
  const [filterType, setFilterType] = useState<'all' | EntryType>('quiz')
  const [filterTopic, setFilterTopic] = useState<string>('all')
  const [loadingQuiz, setLoadingQuiz] = useState(true)
  const [loadingSystem, setLoadingSystem] = useState(true)
  const [systemError, setSystemError] = useState<string | null>(null)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const userId = user?.user_id || '00000000-0000-0000-0000-000000000001'

  useEffect(() => {
    try {
      const raw = localStorage.getItem('wingman_error_log')
      if (raw) setStudyEntries(JSON.parse(raw))
    } catch {
      /* ignore */
    }
    setCachedSystem(getCachedSystemErrors())
    fetchServerSystem()
    fetchQuiz()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchServerSystem = async () => {
    setLoadingSystem(true)
    setSystemError(null)
    try {
      const res = await fetch(`${API}/api/errors?limit=500`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setServerSystem(Array.isArray(data?.errors) ? data.errors : [])
    } catch (e) {
      setSystemError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoadingSystem(false)
    }
  }

  const fetchQuiz = async () => {
    setLoadingQuiz(true)
    setQuizError(null)
    try {
      const res = await fetch(`${API}/api/v1/nba/failures?limit=500`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setQuizFailures(Array.isArray(data?.failures) ? data.failures : [])
    } catch (e) {
      setQuizError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoadingQuiz(false)
    }
  }

  const refreshAll = () => {
    fetchServerSystem()
    fetchQuiz()
  }

  const all: UnifiedEntry[] = useMemo(() => {
    const merged: UnifiedEntry[] = [
      ...quizFailures.map(quizToUnified),
      ...studyEntries.map(studyToUnified),
      ...serverSystem.map(systemRowToUnified),
      ...cachedSystem.map(cachedSysToUnified),
    ]
    const seen = new Set<string>()
    const out: UnifiedEntry[] = []
    for (const e of merged.sort((a, b) => (a.ts < b.ts ? 1 : -1))) {
      if (seen.has(e.id)) continue
      // Dedupe system server vs system local cache by content
      const dedupKey = e.type === 'system'
        ? `sys|${e.title.slice(0, 80)}|${e.ts.slice(0, 19)}`
        : e.id
      if (seen.has(dedupKey)) continue
      seen.add(e.id)
      seen.add(dedupKey)
      out.push(e)
    }
    return out
  }, [quizFailures, studyEntries, serverSystem, cachedSystem])

  const topics = useMemo(
    () => Array.from(new Set(all.filter(e => e.topic).map(e => e.topic as string))),
    [all],
  )

  const filtered = useMemo(() => {
    return all.filter(e => {
      if (filterType !== 'all' && e.type !== filterType) return false
      if (filterTopic !== 'all' && e.topic !== filterTopic) return false
      return true
    })
  }, [all, filterType, filterTopic])

  const counts = useMemo(() => ({
    all: all.length,
    quiz: all.filter(e => e.type === 'quiz').length,
    study: all.filter(e => e.type === 'study').length,
    system: all.filter(e => e.type === 'system').length,
  }), [all])

  const removeStudy = (idSuffix: string) => {
    const realId = idSuffix.replace(/^study:/, '')
    const next = studyEntries.filter(e => e.id !== realId)
    setStudyEntries(next)
    try { localStorage.setItem('wingman_error_log', JSON.stringify(next)) } catch { /* ignore */ }
  }

  const removeSystem = async (entry: UnifiedEntry) => {
    if (entry.id.startsWith('sys-cache:')) {
      const newCache = cachedSystem.filter(c => `sys-cache:${c.id}` !== entry.id)
      setCachedSystem(newCache)
      try { localStorage.setItem('wingman_system_errors', JSON.stringify(newCache)) } catch { /* ignore */ }
      return
    }
    const realId = entry.id.replace(/^sys:/, '')
    try {
      await fetch(`${API}/api/errors/${realId}`, { method: 'DELETE', credentials: 'include' })
      setServerSystem(prev => prev.filter(r => r.id !== realId))
    } catch { /* ignore */ }
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white">Error Log</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {all.length} entrée{all.length > 1 ? 's' : ''}
            {' · '}
            <span className="text-rose-300">{counts.quiz} quiz</span>
            {' · '}
            <span className="text-emerald-300">{counts.study} study</span>
            {' · '}
            <span className="text-amber-300">{counts.system} system</span>
            {(loadingQuiz || loadingSystem) && ' · chargement…'}
            {quizError && <span className="text-red-400"> · quiz API: {quizError}</span>}
            {systemError && <span className="text-red-400"> · system API: {systemError}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={refreshAll}
            disabled={loadingQuiz || loadingSystem}
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors disabled:opacity-50"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(['all', 'quiz', 'study', 'system'] as const).map(t => {
          const active = filterType === t
          const n = t === 'all' ? counts.all : counts[t]
          return (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                active ? 'bg-white/[0.10] text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              {t === 'all' ? 'Tous' : t.charAt(0).toUpperCase() + t.slice(1)} ({n})
            </button>
          )
        })}
      </div>

      {/* Topic filter */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setFilterTopic('all')}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
              filterTopic === 'all' ? 'bg-white/[0.06] text-white' : 'text-slate-600 hover:text-slate-400 hover:bg-white/[0.03]'
            }`}
          >
            Tout topic
          </button>
          {topics.map(t => {
            const active = filterTopic === t
            return (
              <button
                key={t}
                onClick={() => setFilterTopic(t)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                  active ? 'text-white' : 'text-slate-600 hover:text-slate-400 hover:bg-white/[0.03]'
                }`}
                style={active ? { background: `${TOPIC_COLORS[t] || '#64748b'}33`, border: `1px solid ${TOPIC_COLORS[t] || '#64748b'}66` } : undefined}
              >
                {t}
              </button>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/[0.08] p-10 text-center">
          <div className="text-[13px] text-slate-400 mb-1.5">
            {all.length === 0 ? 'Aucune erreur enregistrée.' : 'Aucune entrée pour ce filtre.'}
          </div>
          <div className="text-[11px] text-slate-600">
            <span className="text-rose-300">Quiz</span> : capté auto à chaque réponse incorrecte ·
            <span className="text-emerald-300"> Study</span> : entrée manuelle Error Debrief ·
            <span className="text-amber-300"> System</span> : exceptions JS / backend
          </div>
        </div>
      )}

      {/* Entries */}
      <div className="space-y-2">
        {filtered.map(e => {
          const badge = TYPE_BADGE[e.type]
          const isExpanded = expanded.has(e.id)

          return (
            <div
              key={e.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors group"
            >
              {/* Top metadata strip */}
              <div className="flex items-center gap-2 text-[11px] flex-wrap mb-1.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
                <span className="text-slate-500 tabular-nums">{formatDate(e.ts)}</span>

                {e.topic && (
                  <>
                    <span className="text-slate-700">·</span>
                    <span className="text-slate-400">
                      <span className="font-mono font-semibold" style={{ color: TOPIC_COLORS[e.topic] || '#cbd5e1' }}>
                        {e.topic}{e.lm ? ` · ${e.lm}` : ''}
                      </span>
                    </span>
                  </>
                )}

                {/* Quiz-specific: LOS */}
                {e.type === 'quiz' && e.quiz?.los_code && (
                  <>
                    <span className="text-slate-700">·</span>
                    <span className="font-mono text-[10px] text-slate-500">{e.quiz.los_code}</span>
                  </>
                )}

                {/* Study-specific: task */}
                {e.type === 'study' && e.task && (
                  <>
                    <span className="text-slate-700">·</span>
                    <span className="text-slate-400">Task: <span className="font-semibold text-slate-300">{e.task}</span></span>
                  </>
                )}

                {/* System-specific: source/kind */}
                {e.type === 'system' && (
                  <>
                    <span className="text-slate-700">·</span>
                    <span className="font-mono text-[10px] text-slate-400">{e.source}</span>
                    {e.kind && (
                      <>
                        <span className="text-slate-700">·</span>
                        <span className="font-mono text-[10px] text-slate-400">{e.kind}</span>
                      </>
                    )}
                  </>
                )}

                {/* Delete button (study + system only — quiz is read-only DB) */}
                {(e.type === 'study' || e.type === 'system') && (
                  <button
                    onClick={() => (e.type === 'study' ? removeStudy(e.id) : removeSystem(e))}
                    className="ml-auto opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                    title="Supprimer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Title — question stem for quiz, otherwise raw message */}
              <div className="text-[13px] text-white whitespace-pre-wrap leading-relaxed break-words">
                {e.title}
              </div>

              {/* Quiz: picked vs correct */}
              {e.type === 'quiz' && e.quiz && (
                <div className="mt-2 flex items-start gap-3 text-[12px]">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Tu as choisi</div>
                    <div className="text-rose-300">
                      <span className="font-mono font-bold mr-1.5">{e.quiz.user_answer || '—'}</span>
                      {e.quiz.user_choice ? (
                        <span className="text-slate-300">{e.quiz.user_choice}</span>
                      ) : (
                        <span className="text-slate-500 italic">non répondu</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Bonne réponse</div>
                    <div className="text-emerald-300">
                      <span className="font-mono font-bold mr-1.5">{e.quiz.correct_answer || '—'}</span>
                      <span className="text-slate-300">{e.quiz.correct_choice}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz: explanation toggle */}
              {e.type === 'quiz' && e.quiz?.explanation && (
                <>
                  <button
                    onClick={() => toggleExpand(e.id)}
                    className="mt-2 text-[10px] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {isExpanded ? '▾ Masquer l\'explication' : '▸ Voir l\'explication'}
                  </button>
                  {isExpanded && (
                    <div className="mt-1.5 p-2 rounded bg-black/20 text-[12px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {e.quiz.explanation}
                    </div>
                  )}
                </>
              )}

              {/* System: stack toggle */}
              {e.type === 'system' && e.detail && (
                <>
                  <button
                    onClick={() => toggleExpand(e.id)}
                    className="mt-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {isExpanded ? '▾ hide stack' : '▸ show stack'}
                  </button>
                  {isExpanded && (
                    <pre className="mt-1.5 p-2 rounded bg-black/30 text-[10px] font-mono text-slate-400 overflow-x-auto whitespace-pre">
                      {e.detail}
                    </pre>
                  )}
                </>
              )}

              {/* System context */}
              {e.type === 'system' && e.context && Object.keys(e.context).length > 0 && (
                <div className="mt-1.5 text-[10px] text-slate-500 font-mono break-all">
                  {Object.entries(e.context)
                    .filter(([, v]) => v != null && v !== '')
                    .slice(0, 5)
                    .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
                    .join(' · ')}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
