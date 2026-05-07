'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TOPICS, TOPIC_ORDER, TOPIC_COLORS, EXAM_WEIGHT_RANGES } from '@/lib/lm-data'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── Types ───────────────────────────────────────────────────

interface AdminModule {
  id: number
  code: string
  title: string
  topic_code: string
  topic_name: string
  question_count: number
  flashcard_count: number
  outcome_count: number
}

interface ModuleMastery {
  module_id: number
  mastery_level: number
}

type ModeKey = 'focus_lm' | 'full_topic' | 'weaknesses' | 'traps' | 'calculation'

interface Mode {
  key: ModeKey
  label: string
  tagline: string
  description: string
  color: string
  ready: boolean
}

const MODES: Mode[] = [
  {
    key: 'focus_lm',
    label: 'Focus: one LM',
    tagline: 'Deep-dive a single learning module',
    description: 'Pick a topic, pick one LM, drill questions on that exact reading. Adaptive difficulty by default.',
    color: '#6c8cff',
    ready: true,
  },
  {
    key: 'full_topic',
    label: 'Full topic',
    tagline: 'Broad practice across one topic',
    description: 'Draw questions from every LM under the selected topic — good for end-of-topic review.',
    color: '#00e0b8',
    ready: true,
  },
  {
    key: 'weaknesses',
    label: 'Weaknesses',
    tagline: 'Target your weakest LM',
    description: 'Automatically picks the LM with the lowest mastery score and runs an adaptive set tuned to rebuild.',
    color: '#f59e0b',
    ready: true,
  },
  {
    key: 'traps',
    label: 'Trap questions',
    tagline: 'Hard / commonly-missed',
    description: 'High-difficulty (≥3) questions from the LM of your choice. Built to expose subtle errors.',
    color: '#ef4444',
    ready: true,
  },
  {
    key: 'calculation',
    label: 'Calculation',
    tagline: 'Quant / formula-heavy',
    description: 'Number-crunching questions only. Requires per-question category tagging (coming soon).',
    color: '#a78bfa',
    ready: false,
  },
]

const COUNTS = [5, 10, 15, 20, 30]

// ── Helpers ─────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

function getUserId(): string {
  try {
    const raw = localStorage.getItem('wingman_user')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.user_id) return parsed.user_id
    }
  } catch { /* ignore */ }
  return '00000000-0000-0000-0000-000000000001'
}

// ── Main page ───────────────────────────────────────────────

export default function SessionsBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [modules, setModules] = useState<AdminModule[]>([])
  const [mastery, setMastery] = useState<ModuleMastery[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Builder state
  const [selectedMode, setSelectedMode] = useState<ModeKey>('focus_lm')
  const [topicCode, setTopicCode] = useState<string>('')
  const [moduleId, setModuleId] = useState<number | null>(null)
  const [count, setCount] = useState(10)
  const [timed, setTimed] = useState(true)
  const [difficulty, setDifficulty] = useState<'adaptive' | 'easy' | 'medium' | 'hard' | 'mixed'>('adaptive')
  const [revealMode, setRevealMode] = useState<'after_each' | 'end_only'>('after_each')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load modules + mastery
  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/admin/modules`, { credentials: 'include' }).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/kpis/los-mastery`, { credentials: 'include' }).then(r => r.json()).catch(() => ({})),
    ]).then(([mods]) => {
      setModules(Array.isArray(mods) ? mods : [])
      // Mastery: pull from /api/kpis path — fallback to empty
      fetch(`${API}/api/kpis/topic-mastery`, { credentials: 'include' })
        .then(r => r.json())
        .then(() => { /* topic mastery is aggregated; LM-level comes via progress */ })
        .catch(() => {})

      // Fetch per-LM mastery via progress endpoint
      fetch(`${API}/api/progress/summary`, { credentials: 'include' })
        .then(r => r.json())
        .then((data) => {
          if (data && Array.isArray(data.lm_mastery)) {
            setMastery(data.lm_mastery.map((m: { module_id: number; mastery_level: number }) => ({
              module_id: m.module_id,
              mastery_level: Number(m.mastery_level) || 0,
            })))
          }
        })
        .catch(() => {})
        .finally(() => setLoadingData(false))
    })
  }, [])

  // Topics derived from modules returned by API
  const topics = useMemo(() => {
    const seen = new Set<string>()
    const list: { code: string; name: string }[] = []
    // Prefer TOPIC_ORDER ordering when possible
    const codeToName: Record<string, string> = {}
    for (const m of modules) {
      if (!seen.has(m.topic_code)) {
        seen.add(m.topic_code)
        codeToName[m.topic_code] = m.topic_name
      }
    }
    for (const code of TOPIC_ORDER) {
      if (codeToName[code]) list.push({ code, name: codeToName[code] })
    }
    // Append any topics not in TOPIC_ORDER (defensive)
    for (const code of seen) {
      if (!TOPIC_ORDER.includes(code)) list.push({ code, name: codeToName[code] })
    }
    return list
  }, [modules])

  const topicModules = useMemo(
    () => (topicCode ? modules.filter(m => m.topic_code === topicCode) : []),
    [topicCode, modules],
  )

  // Reset dependent fields when mode or topic changes
  useEffect(() => {
    setTopicCode('')
    setModuleId(null)
    setError(null)
    // Sensible defaults per mode
    if (selectedMode === 'traps') setDifficulty('hard')
    else if (selectedMode === 'weaknesses') setDifficulty('adaptive')
    else setDifficulty('adaptive')
    setCount(selectedMode === 'full_topic' ? 20 : 10)
  }, [selectedMode])

  // URL deeplinks from Coach action plan: ?mode=focus_lm&topic=FSA[&lm=22]
  useEffect(() => {
    const urlMode = searchParams.get('mode') as ModeKey | null
    if (urlMode && ['focus_lm', 'full_topic', 'weaknesses', 'traps', 'calculation'].includes(urlMode)) {
      setSelectedMode(urlMode)
    }
    const urlTopic = searchParams.get('topic')
    if (urlTopic) {
      // Topic gets applied after selectedMode reset effect runs — defer one tick.
      setTimeout(() => setTopicCode(urlTopic), 0)
    }
    const urlLm = searchParams.get('lm')
    if (urlLm) {
      const id = Number(urlLm)
      if (Number.isFinite(id) && id > 0) setTimeout(() => setModuleId(id), 0)
    }
  }, [searchParams])

  useEffect(() => {
    setModuleId(null)
  }, [topicCode])

  // Resolve the actual lm_id to send based on the selected mode
  function resolveLmId(): { lm_id: number; label: string } | { error: string } {
    if (selectedMode === 'focus_lm' || selectedMode === 'traps') {
      if (!moduleId) return { error: 'Pick an LM first.' }
      const m = modules.find(x => x.id === moduleId)
      return { lm_id: moduleId, label: m ? `${m.code} — ${m.title}` : `LM ${moduleId}` }
    }
    if (selectedMode === 'full_topic') {
      if (!topicCode) return { error: 'Pick a topic first.' }
      const candidates = modules.filter(m => m.topic_code === topicCode && m.question_count > 0)
      const picked = pickRandom(candidates) || pickRandom(modules.filter(m => m.topic_code === topicCode))
      if (!picked) return { error: 'No modules available for this topic yet.' }
      return { lm_id: picked.id, label: `${topicCode} — ${picked.code} (full-topic draw)` }
    }
    if (selectedMode === 'weaknesses') {
      // Lowest mastery among modules with at least one question available
      const available = modules.filter(m => m.question_count > 0)
      if (available.length === 0) return { error: 'No questions available yet. Add some in the Backoffice first.' }
      const masteryMap = new Map(mastery.map(m => [m.module_id, m.mastery_level]))
      // Sort by mastery ASC (unknown treated as 0 = weakest)
      const sorted = [...available].sort((a, b) => {
        const am = masteryMap.get(a.id) ?? 0
        const bm = masteryMap.get(b.id) ?? 0
        return am - bm
      })
      const weakest = sorted[0]
      const pct = masteryMap.get(weakest.id) ?? 0
      return { lm_id: weakest.id, label: `${weakest.code} — ${weakest.title} (mastery ${Math.round(pct)}%)` }
    }
    return { error: 'Unsupported mode.' }
  }

  async function startSession() {
    setError(null)
    const resolved = resolveLmId()
    if ('error' in resolved) { setError(resolved.error); return }

    setStarting(true)
    try {
      const res = await fetch(`${API}/api/qcm/start`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lm_id: resolved.lm_id,
          question_count: count,
          time_limit_min: timed ? Math.max(5, count * 1.5) : 9999,
          mode: difficulty,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || data.detail || 'Failed to start session.')
        setStarting(false)
        return
      }
      // Hand off to the session runner
      try {
        localStorage.setItem('wingman_prebuilt_session', JSON.stringify({
          qcm: data,
          mode: selectedMode,
          label: resolved.label,
          activeTab: 'qbank',
          revealMode,
        }))
      } catch { /* ignore */ }
      router.push('/session')
    } catch {
      setError('Server connection error.')
      setStarting(false)
    }
  }

  const activeMode = MODES.find(m => m.key === selectedMode)!
  const needsLmPicker = selectedMode === 'focus_lm' || selectedMode === 'traps'
  const needsTopicPicker = needsLmPicker || selectedMode === 'full_topic'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <h1 className="text-xl font-bold text-white mb-1">Sessions</h1>
        <p className="text-sm text-slate-400">
          Build a custom practice set. Pick a mode, configure the details, and go.
        </p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {MODES.map(mode => {
          const active = selectedMode === mode.key
          return (
            <button
              key={mode.key}
              onClick={() => mode.ready && setSelectedMode(mode.key)}
              disabled={!mode.ready}
              className={`text-left rounded-xl p-4 border transition-all ${
                active ? 'ring-2 ring-offset-2 ring-offset-[#0a1020]' : ''
              } ${mode.ready ? 'hover:bg-white/[0.04]' : 'opacity-50 cursor-not-allowed'}`}
              style={{
                background: active ? `${mode.color}18` : 'rgba(255,255,255,.02)',
                borderColor: active ? mode.color : 'rgba(255,255,255,.08)',
                // @ts-expect-error CSS custom prop for Tailwind ring
                '--tw-ring-color': mode.color,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[11px] font-bold"
                  style={{ background: mode.color }}
                >
                  {mode.label.slice(0, 1)}
                </span>
                <h3 className="text-sm font-bold text-white">{mode.label}</h3>
                {!mode.ready && (
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    soon
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug mb-2">{mode.tagline}</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">{mode.description}</p>
            </button>
          )
        })}
      </div>

      {/* Config form */}
      <div className="card space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">{activeMode.label}</h2>
            <p className="text-[11px] text-slate-500">{activeMode.tagline}</p>
          </div>
          {!activeMode.ready && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded">
              Coming soon
            </span>
          )}
        </div>

        {!activeMode.ready ? (
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-6 text-center">
            <p className="text-sm text-slate-400 mb-1">This mode needs per-question category tagging.</p>
            <p className="text-[11px] text-slate-600">
              Add a <code className="text-slate-400">question_type</code> column to the questions table and tag existing quant items to enable this.
            </p>
          </div>
        ) : (
          <>
            {/* Topic + LM pickers (conditional) */}
            {needsTopicPicker && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Topic *</label>
                  <select
                    value={topicCode}
                    onChange={e => setTopicCode(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50"
                    disabled={loadingData}
                  >
                    <option value="" className="bg-[#111827]">
                      {loadingData ? 'Loading…' : '-- Select a topic --'}
                    </option>
                    {topics.map(t => (
                      <option key={t.code} value={t.code} className="bg-[#111827]">
                        {t.code} — {t.name} ({EXAM_WEIGHT_RANGES[t.code] || '—'})
                      </option>
                    ))}
                  </select>
                </div>
                {needsLmPicker && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Learning Module *</label>
                    <select
                      value={moduleId ?? ''}
                      onChange={e => setModuleId(e.target.value ? Number(e.target.value) : null)}
                      disabled={!topicCode}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
                    >
                      <option value="" className="bg-[#111827]">
                        {topicCode ? '-- Select a module --' : '-- Pick a topic first --'}
                      </option>
                      {topicModules.map(m => (
                        <option key={m.id} value={m.id} className="bg-[#111827]">
                          {m.code} — {m.title} ({m.question_count}q)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Weakness auto-pick preview */}
            {selectedMode === 'weaknesses' && (() => {
              const preview = resolveLmId()
              if ('error' in preview) {
                return (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-300">
                    {preview.error}
                  </div>
                )
              }
              return (
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Auto-selected target</p>
                  <p className="text-[13px] text-slate-200 font-medium">{preview.label}</p>
                </div>
              )
            })()}

            {/* Count */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Number of questions</label>
              <div className="flex flex-wrap gap-1.5">
                {COUNTS.map(n => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${
                      n === count ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-white/[0.08]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Difficulty</label>
              <div className="flex flex-wrap gap-1.5">
                {(['adaptive', 'easy', 'medium', 'hard', 'mixed'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all capitalize ${
                      d === difficulty ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-white/[0.08]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5">
                Adaptive = tuned to your mastery. Mixed = 20% easy / 50% medium / 30% hard.
              </p>
            </div>

            {/* Timer */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Timer</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setTimed(true)}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                    timed ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-white/[0.08]'
                  }`}
                >
                  Timed (~{Math.round(Math.max(5, count * 1.5))} min)
                </button>
                <button
                  onClick={() => setTimed(false)}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                    !timed ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-white/[0.08]'
                  }`}
                >
                  Untimed
                </button>
              </div>
            </div>

            {/* Answer reveal */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Answer reveal</label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setRevealMode('after_each')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                    revealMode === 'after_each' ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-white/[0.08]'
                  }`}
                >
                  After each (learn)
                </button>
                <button
                  onClick={() => setRevealMode('end_only')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                    revealMode === 'end_only' ? 'bg-red-600 text-white border-red-500' : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-white/[0.08]'
                  }`}
                >
                  At end (exam mode)
                </button>
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5">
                Exam mode hides the correct answer + explanation until the score recap, so you cannot self-correct mid-session.
              </p>
            </div>

            {/* Errors */}
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[12px] text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/[0.04]">
              <div className="text-[11px] text-slate-500">
                {topicCode && (
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                    style={{ background: TOPIC_COLORS[topicCode] || '#6366f1' }}
                  />
                )}
                {selectedMode === 'focus_lm' && moduleId && 'Ready to start.'}
                {selectedMode === 'full_topic' && topicCode && `Random draw from ${topicCode}.`}
                {selectedMode === 'weaknesses' && 'Weakest LM auto-picked.'}
                {selectedMode === 'traps' && moduleId && 'Hard-difficulty picks only.'}
              </div>
              <button
                onClick={startSession}
                disabled={starting}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {starting ? 'Starting…' : 'Start session →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
