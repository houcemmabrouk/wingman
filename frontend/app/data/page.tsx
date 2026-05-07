'use client'

import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { ConfirmModal, useToast } from '@/components/ui/Modal'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── TYPES ──────────────────────────────────────────────────

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

interface Outcome {
  id: number
  code: string
  description: string
  bloom_level: string
}

interface Question {
  id: number
  module_id: number
  outcome_id: number | null
  stem: string
  choice_a: string
  choice_b: string
  choice_c: string
  correct_answer: string
  explanation: string
  difficulty: number
  // joined fields from API
  module_code?: string
  topic_code?: string
  outcome_code?: string
}

interface Flashcard {
  id: number
  module_id: number
  outcome_id: number | null
  front: string
  back: string
  tags: string
  module_code?: string
  topic_code?: string
  outcome_code?: string
}

interface TopicRow {
  code: string
  name: string
  modules: number
  outcomes: number
  questions: number
  flashcards: number
}

interface DataStatus {
  counts: Record<string, number>
  topic_breakdown: TopicRow[]
}

interface PaginatedResponse<T> {
  questions?: T[]
  flashcards?: T[]
  total: number
  page: number
  limit: number
  difficulty_breakdown?: Record<string, number>
}

// ── CONSTANTS ──────────────────────────────────────────────

const TOPICS: Record<string, string> = {
  ETH: 'Ethical & Professional Standards',
  QM: 'Quantitative Methods',
  ECO: 'Economics',
  FSA: 'Financial Statement Analysis',
  CORP: 'Corporate Issuers',
  EQU: 'Equity Investments',
  FI: 'Fixed Income',
  DER: 'Derivatives',
  ALT: 'Alternative Investments',
  PM: 'Portfolio Management',
}

const TOPIC_COLORS: Record<string, string> = {
  ETH: '#DC2626', QM: '#7C3AED', ECO: '#2563EB', FSA: '#059669',
  CORP: '#D97706', EQU: '#0891B2', FI: '#4F46E5', DER: '#BE185D',
  ALT: '#7C2D12', PM: '#4338CA',
}

const DIFFICULTY_COLORS: Record<number, string> = {
  1: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  2: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  3: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  4: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  5: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Very Easy', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Very Hard',
}

type TabKey = 'qbank' | 'mock' | 'flashcards' | 'content'

// ── HELPER HOOKS ───────────────────────────────────────────

function useModules() {
  const [modules, setModules] = useState<AdminModule[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/modules`, { credentials: 'include' })
      if (res.ok) setModules(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { modules, loading, refresh }
}

function useOutcomes(moduleId: number | null) {
  const [outcomes, setOutcomes] = useState<Outcome[]>([])

  useEffect(() => {
    if (!moduleId) { setOutcomes([]); return }
    let cancelled = false
    fetch(`${API}/api/admin/outcomes/${moduleId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (!cancelled) setOutcomes(data) })
      .catch(() => { if (!cancelled) setOutcomes([]) })
    return () => { cancelled = true }
  }, [moduleId])

  return outcomes
}

// ── SHARED COMPONENTS ──────────────────────────────────────

function DifficultyBadge({ level }: { level: number }) {
  const cls = DIFFICULTY_COLORS[level] || DIFFICULTY_COLORS[3]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cls}`}>
      {level}
    </span>
  )
}

function TopicBadge({ code }: { code: string }) {
  const color = TOPIC_COLORS[code] || '#6B7280'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border"
      style={{ background: `${color}20`, color, borderColor: `${color}40` }}
    >
      {code}
    </span>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <svg className="w-12 h-12 mx-auto text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-[#111827]">{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function Pagination({
  page, total, limit, onPageChange,
}: {
  page: number; total: number; limit: number; onPageChange: (p: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
      <p className="text-xs text-slate-500">
        Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] text-slate-400 hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span className="text-xs text-slate-400 tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] text-slate-400 hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}

// ── WIDE MODAL (for forms) ─────────────────────────────────

function WideModal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-[10vh] overflow-y-auto"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-2xl mb-8">
        <div className="bg-[#1a1a2e] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── QUESTION FORM MODAL ────────────────────────────────────

interface QuestionFormData {
  module_id: number | null
  outcome_id: number | null
  stem: string
  choice_a: string
  choice_b: string
  choice_c: string
  correct_answer: string
  explanation: string
  difficulty: number
}

const emptyQuestionForm: QuestionFormData = {
  module_id: null, outcome_id: null, stem: '', choice_a: '', choice_b: '', choice_c: '',
  correct_answer: 'A', explanation: '', difficulty: 3,
}

function QuestionFormModal({
  open, onClose, onSave, initial, modules,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: QuestionFormData) => Promise<void>
  initial: QuestionFormData
  modules: AdminModule[]
}) {
  const [form, setForm] = useState<QuestionFormData>(initial)
  const [saving, setSaving] = useState(false)
  const outcomes = useOutcomes(form.module_id)
  const isEdit = initial.stem !== ''

  useEffect(() => { if (open) setForm(initial) }, [open, initial])

  const set = (key: keyof QuestionFormData, val: unknown) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!form.module_id || !form.stem.trim()) return
    setSaving(true)
    try { await onSave(form); onClose() }
    catch { /* toast handled by caller */ }
    finally { setSaving(false) }
  }

  // Group modules by topic
  const topicGroups: Record<string, AdminModule[]> = {}
  for (const m of modules) {
    if (!topicGroups[m.topic_code]) topicGroups[m.topic_code] = []
    topicGroups[m.topic_code].push(m)
  }

  return (
    <WideModal open={open} onClose={onClose}>
        <div className="p-6">
          <h3 className="text-base font-bold text-white mb-5">
            {isEdit ? 'Edit Question' : 'New Question'}
          </h3>

          <div className="space-y-4">
            {/* Module + Outcome row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Module *</label>
                <select
                  value={form.module_id ?? ''}
                  onChange={e => { set('module_id', e.target.value ? Number(e.target.value) : null); set('outcome_id', null) }}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="" className="bg-[#111827]">Select module...</option>
                  {Object.entries(topicGroups).map(([topic, mods]) => (
                    <optgroup key={topic} label={`${topic} - ${TOPICS[topic] || topic}`}>
                      {mods.map(m => (
                        <option key={m.id} value={m.id} className="bg-[#111827]">
                          {m.code} - {m.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Learning Outcome</label>
                <select
                  value={form.outcome_id ?? ''}
                  onChange={e => set('outcome_id', e.target.value ? Number(e.target.value) : null)}
                  disabled={!form.module_id}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 disabled:opacity-40"
                >
                  <option value="" className="bg-[#111827]">None</option>
                  {outcomes.map(o => (
                    <option key={o.id} value={o.id} className="bg-[#111827]">
                      {o.code} - {o.description.slice(0, 80)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stem */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Question Stem *</label>
              <textarea
                value={form.stem}
                onChange={e => set('stem', e.target.value)}
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 resize-none"
                placeholder="Enter the question stem..."
              />
            </div>

            {/* Choices */}
            <div className="space-y-2">
              <label className="block text-[11px] text-slate-400">Choices</label>
              {(['A', 'B', 'C'] as const).map(letter => {
                const key = `choice_${letter.toLowerCase()}` as keyof QuestionFormData
                return (
                  <div key={letter} className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="correct_answer"
                        checked={form.correct_answer === letter}
                        onChange={() => set('correct_answer', letter)}
                        className="accent-emerald-500"
                      />
                      <span className={`text-xs font-bold w-4 ${form.correct_answer === letter ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {letter}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={form[key] as string}
                      onChange={e => set(key, e.target.value)}
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
                      placeholder={`Choice ${letter}`}
                    />
                  </div>
                )
              })}
              <p className="text-[10px] text-slate-600">Select the radio button for the correct answer</p>
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Explanation</label>
              <textarea
                value={form.explanation}
                onChange={e => set('explanation', e.target.value)}
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 resize-none"
                placeholder="Explain the correct answer..."
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Difficulty: <span className="text-white font-semibold">{form.difficulty}</span>
                <span className="text-slate-500 ml-1">({DIFFICULTY_LABELS[form.difficulty]})</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={form.difficulty}
                  onChange={e => set('difficulty', Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(d => (
                    <button
                      key={d}
                      onClick={() => set('difficulty', d)}
                      className={`w-7 h-7 rounded-md text-[11px] font-bold border transition-all ${
                        d === form.difficulty ? DIFFICULTY_COLORS[d] : 'bg-white/[0.02] border-white/[0.06] text-slate-600'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-300 bg-white/[0.06] hover:bg-white/[0.1] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.module_id || !form.stem.trim()}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
    </WideModal>
  )
}

// ── FLASHCARD FORM MODAL ───────────────────────────────────

interface FlashcardFormData {
  module_id: number | null
  outcome_id: number | null
  front: string
  back: string
  tags: string
}

const emptyFlashcardForm: FlashcardFormData = {
  module_id: null, outcome_id: null, front: '', back: '', tags: '',
}

function FlashcardFormModal({
  open, onClose, onSave, initial, modules,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: FlashcardFormData) => Promise<void>
  initial: FlashcardFormData
  modules: AdminModule[]
}) {
  const [form, setForm] = useState<FlashcardFormData>(initial)
  const [saving, setSaving] = useState(false)
  const outcomes = useOutcomes(form.module_id)
  const isEdit = initial.front !== ''

  useEffect(() => { if (open) setForm(initial) }, [open, initial])

  const set = (key: keyof FlashcardFormData, val: unknown) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!form.module_id || !form.front.trim() || !form.back.trim()) return
    setSaving(true)
    try { await onSave(form); onClose() }
    catch { /* toast handled by caller */ }
    finally { setSaving(false) }
  }

  const topicGroups: Record<string, AdminModule[]> = {}
  for (const m of modules) {
    if (!topicGroups[m.topic_code]) topicGroups[m.topic_code] = []
    topicGroups[m.topic_code].push(m)
  }

  return (
    <WideModal open={open} onClose={onClose}>
        <div className="p-6">
          <h3 className="text-base font-bold text-white mb-5">
            {isEdit ? 'Edit Flashcard' : 'New Flashcard'}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Module *</label>
                <select
                  value={form.module_id ?? ''}
                  onChange={e => { set('module_id', e.target.value ? Number(e.target.value) : null); set('outcome_id', null) }}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="" className="bg-[#111827]">Select module...</option>
                  {Object.entries(topicGroups).map(([topic, mods]) => (
                    <optgroup key={topic} label={`${topic} - ${TOPICS[topic] || topic}`}>
                      {mods.map(m => (
                        <option key={m.id} value={m.id} className="bg-[#111827]">
                          {m.code} - {m.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Learning Outcome</label>
                <select
                  value={form.outcome_id ?? ''}
                  onChange={e => set('outcome_id', e.target.value ? Number(e.target.value) : null)}
                  disabled={!form.module_id}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 disabled:opacity-40"
                >
                  <option value="" className="bg-[#111827]">None</option>
                  {outcomes.map(o => (
                    <option key={o.id} value={o.id} className="bg-[#111827]">
                      {o.code} - {o.description.slice(0, 80)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Front *</label>
              <textarea
                value={form.front}
                onChange={e => set('front', e.target.value)}
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 resize-none"
                placeholder="Question / prompt side..."
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Back *</label>
              <textarea
                value={form.back}
                onChange={e => set('back', e.target.value)}
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 resize-none"
                placeholder="Answer side..."
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={e => set('tags', e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50"
                placeholder="Comma-separated tags (e.g. formula, key-concept)"
              />
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-300 bg-white/[0.06] hover:bg-white/[0.1] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.module_id || !form.front.trim() || !form.back.trim()}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
    </WideModal>
  )
}

// ── GENERATE WITH AI MODAL ────────────────────────────────

function GenerateModal({
  open, onClose, modules, defaultType, onGenerated,
}: {
  open: boolean
  onClose: () => void
  modules: AdminModule[]
  defaultType: 'qbank' | 'mock'
  onGenerated: () => void
}) {
  const toast = useToast()
  const [topicCode, setTopicCode] = useState<string>('')
  const [moduleId, setModuleId] = useState<number | null>(null)
  const [count, setCount] = useState(5)
  const [difficulty, setDifficulty] = useState(3)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)  // 0..100
  const [done, setDone] = useState<{ count: number; module: string } | null>(null)

  useEffect(() => {
    if (open) {
      setCount(5)
      setDifficulty(3)
      setTopicCode('')
      setModuleId(null)
      setGenerating(false)
      setProgress(0)
      setDone(null)
    }
  }, [open])

  // Time-based progress bar. We can't get real progress from a single Claude
  // roundtrip, so we ease smoothly up to 95% over the expected duration, then
  // the response itself snaps it to 100%.
  useEffect(() => {
    if (!generating) return
    // Rough: ~5s baseline + ~2.5s per question. Cap at 60s for planning.
    const estMs = Math.min(60000, 5000 + count * 2500)
    const startedAt = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt
      const pct = Math.min(95, (elapsed / estMs) * 95)
      setProgress(pct)
    }, 200)
    return () => clearInterval(interval)
  }, [generating, count])

  // Unique topics derived from modules list (keeps ordering stable by first occurrence)
  const topics = (() => {
    const seen = new Set<string>()
    const list: { code: string; name: string }[] = []
    for (const m of modules) {
      if (!seen.has(m.topic_code)) {
        seen.add(m.topic_code)
        list.push({ code: m.topic_code, name: m.topic_name })
      }
    }
    return list
  })()

  const topicModules = topicCode ? modules.filter(m => m.topic_code === topicCode) : []

  const handleGenerate = async () => {
    if (!moduleId) return
    setGenerating(true)
    setProgress(0)
    setDone(null)
    try {
      const res = await fetch(`${API}/api/admin/generate-questions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: moduleId,
          count,
          difficulty,
          question_type: defaultType,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.detail || err?.error || `Generation failed (HTTP ${res.status})`)
      }
      const data = await res.json()
      setProgress(100)
      setDone({ count: data.count ?? count, module: data.module ?? '' })
      toast.success(`Generated ${data.count ?? count} questions for ${data.module}!`)
      onGenerated()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Generation failed'
      toast.error(msg)
      setDone(null)
    } finally {
      setGenerating(false)
    }
  }

  const diffColors: Record<number, string> = {
    1: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500',
    2: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500',
    3: 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500',
    4: 'bg-orange-600 hover:bg-orange-500 text-white border-orange-500',
    5: 'bg-red-600 hover:bg-red-500 text-white border-red-500',
  }
  const diffInactive = 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 border-white/[0.1]'

  return (
    <WideModal open={open} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <span className="text-lg">&#10024;</span>
          Generate with AI
        </h3>
        <p className="text-xs text-slate-500 mb-5">Select a learning module, choose how many questions and difficulty level</p>

        {done ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
              <span className="text-emerald-400 text-3xl leading-none">✓</span>
            </div>
            <p className="text-lg font-bold text-white">
              {done.count} question{done.count > 1 ? 's' : ''} generated
            </p>
            <p className="text-xs text-slate-400">
              Module <span className="font-mono text-slate-200">{done.module}</span> · difficulty {difficulty} · ready to use in sessions.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setDone(null); setProgress(0) }}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-200 bg-white/[0.06] hover:bg-white/[0.1] transition-all"
              >
                Generate more
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : generating ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-sm text-slate-300">
              Generating {count} question{count > 1 ? 's' : ''} with Claude AI…
            </p>
            {/* Progress bar */}
            <div className="w-full max-w-sm">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 tabular-nums">
                <span>{Math.round(progress)}%</span>
                <span>est. {Math.round((5 + count * 2.5))}s</span>
              </div>
            </div>
            <p className="text-xs text-slate-600">Don&apos;t close this window — Claude is writing questions.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Topic + Module — two-step picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Topic *</label>
                <select
                  value={topicCode}
                  onChange={e => { setTopicCode(e.target.value); setModuleId(null) }}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-purple-500/50"
                >
                  <option value="" className="bg-[#111827]">-- Select a topic --</option>
                  {topics.map(t => (
                    <option key={t.code} value={t.code} className="bg-[#111827]">
                      {t.code} — {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Learning Module *</label>
                <select
                  value={moduleId ?? ''}
                  onChange={e => setModuleId(e.target.value ? Number(e.target.value) : null)}
                  disabled={!topicCode}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>

            {/* Count */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">
                Number of questions
              </label>
              <div className="flex items-center gap-3">
                {[3, 5, 10, 15, 20].map(n => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${
                      n === count ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/[0.04] text-slate-400 border-white/[0.1] hover:bg-white/[0.08]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">
                Difficulty
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-all ${
                      d === difficulty ? diffColors[d] : diffInactive
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5">
                1 = Recall &nbsp; 2 = Basic &nbsp; 3 = Analysis &nbsp; 4 = Multi-step &nbsp; 5 = Expert
              </p>
            </div>
          </div>
        )}
      </div>

      {!generating && !done && (
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-300 bg-white/[0.06] hover:bg-white/[0.1] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!moduleId}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <span>&#10024;</span>
            Generate
          </button>
        </div>
      )}
    </WideModal>
  )
}

// ── QBANK TAB ──────────────────────────────────────────────

// ── COVERAGE WIDGET ───────────────────────────────────────
// Progress bar per module showing questions vs target (10 per LOS).
// Groups by topic, collapsible.

// Flat target per LM (independent of LOS count) — used while LOS seeding is
// incomplete on some modules. Switch back to a per-LOS multiplier once every
// module has its LOS rows in place.
const TARGET_Q_PER_LM: number = 50

function moduleCoverage(m: AdminModule): { actual: number; target: number; pct: number } {
  const target = TARGET_Q_PER_LM
  const actual = Math.max(0, m.question_count)
  const pct = target === 0 ? 0 : Math.round((actual / target) * 100)
  return { actual, target, pct }
}

function coverageColor(pct: number, target: number): string {
  if (target === 0) return '#64748b'
  if (pct >= 100) return '#10b981'
  if (pct >= 75)  return '#22c55e'
  if (pct >= 25)  return '#f59e0b'
  return '#ef4444'
}

function CoverageByModule({ modules }: { modules: AdminModule[] }) {
  const [expanded, setExpanded] = useState(true)
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set())

  // Group by topic, preserve first-seen ordering
  const byTopic = (() => {
    const order: string[] = []
    const map: Record<string, { name: string; modules: AdminModule[] }> = {}
    for (const m of modules) {
      if (!map[m.topic_code]) {
        order.push(m.topic_code)
        map[m.topic_code] = { name: m.topic_name, modules: [] }
      }
      map[m.topic_code].modules.push(m)
    }
    return order.map(code => ({ code, name: map[code].name, modules: map[code].modules }))
  })()

  // Aggregate totals across all modules
  const totals = modules.reduce(
    (acc, m) => {
      const { actual, target } = moduleCoverage(m)
      acc.actual += actual
      acc.target += target
      return acc
    },
    { actual: 0, target: 0 },
  )
  const totalPct = totals.target === 0 ? 0 : Math.round((totals.actual / totals.target) * 100)

  const toggleTopic = (code: string) => {
    setOpenTopics(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(108,140,255,.10)', border: '1px solid rgba(108,140,255,.55)', color: '#a0b4ff' }}>
            ● Coverage by Module
          </span>
          <span className="text-[11px] text-slate-500">
            {modules.length} modules · target {TARGET_Q_PER_LM}q/LM
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-40 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: `${totalPct}%`, background: coverageColor(totalPct, totals.target) }} />
          </div>
          <span className="text-[13px] font-bold text-white tabular-nums w-14 text-right">
            {totals.actual}<span className="text-slate-600 font-normal">/{totals.target}</span>
          </span>
          <span className="text-[11px] text-slate-500 w-10 text-right tabular-nums">{totalPct}%</span>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
               fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
          {byTopic.map(group => {
            const isOpen = openTopics.has(group.code)
            const groupTotals = group.modules.reduce(
              (acc, m) => {
                const { actual, target } = moduleCoverage(m)
                return { actual: acc.actual + actual, target: acc.target + target }
              },
              { actual: 0, target: 0 },
            )
            const groupPct = groupTotals.target === 0 ? 0 : Math.round((groupTotals.actual / groupTotals.target) * 100)
            const topicColor = TOPIC_COLORS[group.code] || '#6366f1'

            return (
              <div key={group.code}>
                {/* Topic row */}
                <button
                  onClick={() => toggleTopic(group.code)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <svg className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                       fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
                        style={{ background: topicColor }}>{group.code}</span>
                  <span className="text-[12px] text-slate-200 font-medium flex-1 truncate">{group.name}</span>
                  <span className="text-[10px] text-slate-500 tabular-nums">{group.modules.length} LMs</span>
                  <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                         style={{ width: `${groupPct}%`, background: coverageColor(groupPct, groupTotals.target) }} />
                  </div>
                  <span className="text-[11px] text-slate-300 font-semibold tabular-nums w-14 text-right">
                    {groupTotals.actual}<span className="text-slate-600 font-normal">/{groupTotals.target}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 tabular-nums w-10 text-right">{groupPct}%</span>
                </button>

                {/* Modules */}
                {isOpen && (
                  <div className="bg-black/20">
                    {group.modules.map(m => {
                      const { actual, target, pct } = moduleCoverage(m)
                      const color = coverageColor(pct, target)
                      return (
                        <div key={m.id} className="flex items-center gap-3 px-4 py-1.5 pl-10 hover:bg-white/[0.01]">
                          <span className="text-[10px] font-mono text-slate-500 w-16 shrink-0">{m.code}</span>
                          <span className="text-[11px] text-slate-300 flex-1 min-w-0 truncate">{m.title}</span>
                          <span className="text-[9px] text-slate-600 tabular-nums shrink-0"
                                title={`${m.outcome_count} LOS`}>
                            {m.outcome_count} LOS
                          </span>
                          <div className="w-32 h-1 rounded-full overflow-hidden shrink-0"
                               style={{ background: 'rgba(255,255,255,.04)' }}>
                            <div className="h-full rounded-full transition-all duration-500"
                                 style={{ width: `${pct}%`, background: color }} />
                          </div>
                          <span className="text-[10px] text-slate-400 tabular-nums w-14 text-right shrink-0">
                            {actual}<span className="text-slate-600">/{target}</span>
                          </span>
                          <span className="text-[10px] tabular-nums w-10 text-right shrink-0" style={{ color }}>
                            {target === 0 ? '—' : `${pct}%`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


function QBankTab({ modules }: { modules: AdminModule[] }) {
  const toast = useToast()
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [diffBreakdown, setDiffBreakdown] = useState<number[]>([0, 0, 0, 0, 0])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 50

  // Filters
  const [filterTopic, setFilterTopic] = useState('')
  const [filterModule, setFilterModule] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')

  // Modal
  const [formOpen, setFormOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)
  const [generateOpen, setGenerateOpen] = useState(false)

  const filteredModules = filterTopic
    ? modules.filter(m => m.topic_code === filterTopic)
    : modules

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (filterModule) params.set('module_id', filterModule)
      else if (filterTopic) params.set('topic_code', filterTopic)
      if (filterDifficulty) params.set('difficulty', filterDifficulty)
      const res = await fetch(`${API}/api/admin/questions?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data: PaginatedResponse<Question> = await res.json()
        setQuestions(data.questions || [])
        setTotal(data.total)
        const br = data.difficulty_breakdown || {}
        setDiffBreakdown([1, 2, 3, 4, 5].map(d => Number(br[String(d)] ?? 0)))
      }
    } catch {
      toast.error('Failed to load questions')
    } finally { setLoading(false) }
  }, [page, filterTopic, filterModule, filterDifficulty, toast])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])
  useEffect(() => { setPage(1) }, [filterTopic, filterModule, filterDifficulty])
  useEffect(() => { if (filterTopic) setFilterModule('') }, [filterTopic])

  const handleSave = async (data: QuestionFormData) => {
    const body = {
      module_id: data.module_id,
      outcome_id: data.outcome_id,
      stem: data.stem,
      choice_a: data.choice_a,
      choice_b: data.choice_b,
      choice_c: data.choice_c,
      correct_answer: data.correct_answer,
      explanation: data.explanation,
      difficulty: data.difficulty,
    }
    if (editingQuestion) {
      const res = await fetch(`${API}/api/admin/questions/${editingQuestion.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { toast.error('Failed to update question'); throw new Error() }
      toast.success('Question updated')
    } else {
      const res = await fetch(`${API}/api/admin/questions`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { toast.error('Failed to create question'); throw new Error() }
      toast.success('Question created')
    }
    fetchQuestions()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`${API}/api/admin/questions/${deleteTarget.id}`, {
        method: 'DELETE', credentials: 'include',
      })
      if (!res.ok) throw new Error()
      toast.success('Question deleted')
      fetchQuestions()
    } catch {
      toast.error('Failed to delete question')
    }
  }

  const openEdit = (q: Question) => {
    setEditingQuestion(q)
    setFormOpen(true)
  }

  const openCreate = () => {
    setEditingQuestion(null)
    setFormOpen(true)
  }

  // Stats — coverage uses the flat per-LM target (see moduleCoverage) so the
  // card matches the per-module progress bar.
  const coverageTotals = modules.reduce(
    (acc, m) => {
      const actual = Math.max(0, m.question_count)
      return { actual: acc.actual + actual, target: acc.target + TARGET_Q_PER_LM }
    },
    { actual: 0, target: 0 },
  )
  const coverage = coverageTotals.target > 0
    ? Math.round((coverageTotals.actual / coverageTotals.target) * 100)
    : 0

  const formInitial: QuestionFormData = editingQuestion
    ? {
        module_id: editingQuestion.module_id,
        outcome_id: editingQuestion.outcome_id,
        stem: editingQuestion.stem,
        choice_a: editingQuestion.choice_a,
        choice_b: editingQuestion.choice_b,
        choice_c: editingQuestion.choice_c,
        correct_answer: editingQuestion.correct_answer,
        explanation: editingQuestion.explanation,
        difficulty: editingQuestion.difficulty,
      }
    : emptyQuestionForm

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Total</p>
          <p className="text-2xl font-bold text-white tabular-nums">{total}</p>
        </div>
        {[1, 2, 3, 4, 5].map(d => (
          <div key={d} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Diff {d}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: d === 1 ? '#10B981' : d === 2 ? '#3B82F6' : d === 3 ? '#F59E0B' : d === 4 ? '#F97316' : '#EF4444' }}>
              {diffBreakdown[d - 1]}
            </p>
          </div>
        ))}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Coverage</p>
          <p className="text-2xl font-bold text-cyan-400 tabular-nums">{coverage}%</p>
        </div>
      </div>

      {/* Coverage by Module widget — collapsible per-topic breakdown */}
      <CoverageByModule modules={modules} />

      {/* Filters + New button */}
      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect
          label="Topic"
          value={filterTopic}
          onChange={setFilterTopic}
          options={[
            { value: '', label: 'All Topics' },
            ...Object.entries(TOPICS).map(([k, v]) => ({ value: k, label: `${k} - ${v}` })),
          ]}
        />
        <FilterSelect
          label="Module"
          value={filterModule}
          onChange={setFilterModule}
          options={[
            { value: '', label: 'All Modules' },
            ...filteredModules.map(m => ({ value: String(m.id), label: `${m.code} - ${m.title.slice(0, 40)}` })),
          ]}
        />
        <FilterSelect
          label="Difficulty"
          value={filterDifficulty}
          onChange={setFilterDifficulty}
          options={[
            { value: '', label: 'All Levels' },
            ...[1, 2, 3, 4, 5].map(d => ({ value: String(d), label: `${d} - ${DIFFICULTY_LABELS[d]}` })),
          ]}
        />
        <div className="flex-1" />
        <button
          onClick={() => setGenerateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all"
        >
          <span className="text-sm">&#10024;</span>
          Generate with AI
        </button>
      </div>

      {/* Table */}
      {loading ? <Spinner /> : questions.length === 0 ? (
        <EmptyState message="No questions found. Generate some with AI using the button above." />
      ) : (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left py-3 px-3 text-slate-500 font-medium w-14">ID</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium w-20">Module</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium w-16">LOS</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Stem</th>
                  <th className="text-center py-3 px-3 text-slate-500 font-medium w-14">Diff</th>
                  <th className="text-center py-3 px-3 text-slate-500 font-medium w-14">Ans</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <tr key={q.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 font-mono tabular-nums">{q.id}</td>
                    <td className="py-2.5 px-3">
                      {q.topic_code && <TopicBadge code={q.topic_code} />}
                      {q.module_code && <span className="ml-1 text-slate-400 text-[10px]">{q.module_code}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">{q.outcome_code || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs">
                      <span className="block truncate" title={q.stem}>
                        {q.stem.length > 80 ? q.stem.slice(0, 80) + '...' : q.stem}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <DifficultyBadge level={q.difficulty} />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-400 text-[11px] font-bold">
                        {q.correct_answer}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(q)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(q)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3">
            <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* Form modal */}
      <QuestionFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingQuestion(null) }}
        onSave={handleSave}
        initial={formInitial}
        modules={modules}
      />

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        type="danger"
        title="Delete Question"
        message={`Delete question #${deleteTarget?.id}? This action cannot be undone.`}
        confirmLabel="Delete"
      />

      {/* Generate modal */}
      <GenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        modules={modules}
        defaultType="qbank"
        onGenerated={fetchQuestions}
      />
    </div>
  )
}

// ── FLASHCARDS TAB ─────────────────────────────────────────

function FlashcardsTab({ modules }: { modules: AdminModule[] }) {
  const toast = useToast()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 50

  const [filterTopic, setFilterTopic] = useState('')
  const [filterModule, setFilterModule] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Flashcard | null>(null)

  const filteredModules = filterTopic
    ? modules.filter(m => m.topic_code === filterTopic)
    : modules

  const fetchFlashcards = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (filterModule) params.set('module_id', filterModule)
      else if (filterTopic) params.set('topic_code', filterTopic)
      const res = await fetch(`${API}/api/admin/flashcards?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data: PaginatedResponse<Flashcard> = await res.json()
        setFlashcards(data.flashcards || [])
        setTotal(data.total)
      }
    } catch {
      toast.error('Failed to load flashcards')
    } finally { setLoading(false) }
  }, [page, filterTopic, filterModule, toast])

  useEffect(() => { fetchFlashcards() }, [fetchFlashcards])
  useEffect(() => { setPage(1) }, [filterTopic, filterModule])
  useEffect(() => { if (filterTopic) setFilterModule('') }, [filterTopic])

  const handleSave = async (data: FlashcardFormData) => {
    const body = {
      module_id: data.module_id,
      outcome_id: data.outcome_id,
      front: data.front,
      back: data.back,
      tags: data.tags,
    }
    if (editingCard) {
      const res = await fetch(`${API}/api/admin/flashcards/${editingCard.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { toast.error('Failed to update flashcard'); throw new Error() }
      toast.success('Flashcard updated')
    } else {
      const res = await fetch(`${API}/api/admin/flashcards`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { toast.error('Failed to create flashcard'); throw new Error() }
      toast.success('Flashcard created')
    }
    fetchFlashcards()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`${API}/api/admin/flashcards/${deleteTarget.id}`, {
        method: 'DELETE', credentials: 'include',
      })
      if (!res.ok) throw new Error()
      toast.success('Flashcard deleted')
      fetchFlashcards()
    } catch {
      toast.error('Failed to delete flashcard')
    }
  }

  const openEdit = (fc: Flashcard) => {
    setEditingCard(fc)
    setFormOpen(true)
  }

  const openCreate = () => {
    setEditingCard(null)
    setFormOpen(true)
  }

  const modulesWithFc = new Set(modules.filter(m => m.flashcard_count > 0).map(m => m.id)).size
  const coverage = modules.length > 0 ? Math.round((modulesWithFc / modules.length) * 100) : 0

  const formInitial: FlashcardFormData = editingCard
    ? {
        module_id: editingCard.module_id,
        outcome_id: editingCard.outcome_id,
        front: editingCard.front,
        back: editingCard.back,
        tags: editingCard.tags || '',
      }
    : emptyFlashcardForm

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Total Cards</p>
          <p className="text-2xl font-bold text-white tabular-nums">{total}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Modules with Cards</p>
          <p className="text-2xl font-bold text-purple-400 tabular-nums">{modulesWithFc}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Coverage</p>
          <p className="text-2xl font-bold text-cyan-400 tabular-nums">{coverage}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect
          label="Topic"
          value={filterTopic}
          onChange={setFilterTopic}
          options={[
            { value: '', label: 'All Topics' },
            ...Object.entries(TOPICS).map(([k, v]) => ({ value: k, label: `${k} - ${v}` })),
          ]}
        />
        <FilterSelect
          label="Module"
          value={filterModule}
          onChange={setFilterModule}
          options={[
            { value: '', label: 'All Modules' },
            ...filteredModules.map(m => ({ value: String(m.id), label: `${m.code} - ${m.title.slice(0, 40)}` })),
          ]}
        />
        <div className="flex-1" />
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Flashcard
        </button>
      </div>

      {/* Table */}
      {loading ? <Spinner /> : flashcards.length === 0 ? (
        <EmptyState message="No flashcards found. Create one or adjust filters." />
      ) : (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left py-3 px-3 text-slate-500 font-medium w-14">ID</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium w-20">Module</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium w-16">LOS</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Front</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Back</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium w-28">Tags</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flashcards.map(fc => (
                  <tr key={fc.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 font-mono tabular-nums">{fc.id}</td>
                    <td className="py-2.5 px-3">
                      {fc.topic_code && <TopicBadge code={fc.topic_code} />}
                      {fc.module_code && <span className="ml-1 text-slate-400 text-[10px]">{fc.module_code}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">{fc.outcome_code || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-[200px]">
                      <span className="block truncate" title={fc.front}>
                        {fc.front.length > 60 ? fc.front.slice(0, 60) + '...' : fc.front}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-[200px]">
                      <span className="block truncate" title={fc.back}>
                        {fc.back.length > 60 ? fc.back.slice(0, 60) + '...' : fc.back}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {fc.tags ? (
                        <div className="flex flex-wrap gap-1">
                          {(typeof fc.tags === 'string' ? fc.tags : '').split(',').filter(Boolean).slice(0, 3).map((tag, i) => (
                            <span key={i} className="inline-block px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] text-slate-400">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(fc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(fc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3">
            <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
          </div>
        </div>
      )}

      <FlashcardFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingCard(null) }}
        onSave={handleSave}
        initial={formInitial}
        modules={modules}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        type="danger"
        title="Delete Flashcard"
        message={`Delete flashcard #${deleteTarget?.id}? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}

// ── MOCK TAB (same as QBank, with mock default type) ──────

function MockTab({ modules }: { modules: AdminModule[] }) {
  const toast = useToast()
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [diffBreakdown, setDiffBreakdown] = useState<number[]>([0, 0, 0, 0, 0])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 50

  const [filterTopic, setFilterTopic] = useState('')
  const [filterModule, setFilterModule] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)
  const [generateOpen, setGenerateOpen] = useState(false)

  const filteredModules = filterTopic
    ? modules.filter(m => m.topic_code === filterTopic)
    : modules

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (filterModule) params.set('module_id', filterModule)
      else if (filterTopic) params.set('topic_code', filterTopic)
      if (filterDifficulty) params.set('difficulty', filterDifficulty)
      const res = await fetch(`${API}/api/admin/questions?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data: PaginatedResponse<Question> = await res.json()
        setQuestions(data.questions || [])
        setTotal(data.total)
        const br = data.difficulty_breakdown || {}
        setDiffBreakdown([1, 2, 3, 4, 5].map(d => Number(br[String(d)] ?? 0)))
      }
    } catch {
      toast.error('Failed to load questions')
    } finally { setLoading(false) }
  }, [page, filterTopic, filterModule, filterDifficulty, toast])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])
  useEffect(() => { setPage(1) }, [filterTopic, filterModule, filterDifficulty])
  useEffect(() => { if (filterTopic) setFilterModule('') }, [filterTopic])

  const handleSave = async (data: QuestionFormData) => {
    const body = {
      module_id: data.module_id,
      outcome_id: data.outcome_id,
      stem: data.stem,
      choice_a: data.choice_a,
      choice_b: data.choice_b,
      choice_c: data.choice_c,
      correct_answer: data.correct_answer,
      explanation: data.explanation,
      difficulty: data.difficulty,
    }
    if (editingQuestion) {
      const res = await fetch(`${API}/api/admin/questions/${editingQuestion.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { toast.error('Failed to update question'); throw new Error() }
      toast.success('Question updated')
    } else {
      const res = await fetch(`${API}/api/admin/questions`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { toast.error('Failed to create question'); throw new Error() }
      toast.success('Question created')
    }
    fetchQuestions()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`${API}/api/admin/questions/${deleteTarget.id}`, {
        method: 'DELETE', credentials: 'include',
      })
      if (!res.ok) throw new Error()
      toast.success('Question deleted')
      fetchQuestions()
    } catch {
      toast.error('Failed to delete question')
    }
  }

  const openEdit = (q: Question) => {
    setEditingQuestion(q)
    setFormOpen(true)
  }

  const openCreate = () => {
    setEditingQuestion(null)
    setFormOpen(true)
  }

  const coverageTotals = modules.reduce(
    (acc, m) => {
      const actual = Math.max(0, m.question_count)
      return { actual: acc.actual + actual, target: acc.target + TARGET_Q_PER_LM }
    },
    { actual: 0, target: 0 },
  )
  const coverage = coverageTotals.target > 0
    ? Math.round((coverageTotals.actual / coverageTotals.target) * 100)
    : 0

  const formInitial: QuestionFormData = editingQuestion
    ? {
        module_id: editingQuestion.module_id,
        outcome_id: editingQuestion.outcome_id,
        stem: editingQuestion.stem,
        choice_a: editingQuestion.choice_a,
        choice_b: editingQuestion.choice_b,
        choice_c: editingQuestion.choice_c,
        correct_answer: editingQuestion.correct_answer,
        explanation: editingQuestion.explanation,
        difficulty: editingQuestion.difficulty,
      }
    : emptyQuestionForm

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Total</p>
          <p className="text-2xl font-bold text-white tabular-nums">{total}</p>
        </div>
        {[1, 2, 3, 4, 5].map(d => (
          <div key={d} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Diff {d}</p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: d === 1 ? '#10B981' : d === 2 ? '#3B82F6' : d === 3 ? '#F59E0B' : d === 4 ? '#F97316' : '#EF4444' }}>
              {diffBreakdown[d - 1]}
            </p>
          </div>
        ))}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Coverage</p>
          <p className="text-2xl font-bold text-cyan-400 tabular-nums">{coverage}%</p>
        </div>
      </div>

      {/* Filters + buttons */}
      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect
          label="Topic"
          value={filterTopic}
          onChange={setFilterTopic}
          options={[
            { value: '', label: 'All Topics' },
            ...Object.entries(TOPICS).map(([k, v]) => ({ value: k, label: `${k} - ${v}` })),
          ]}
        />
        <FilterSelect
          label="Module"
          value={filterModule}
          onChange={setFilterModule}
          options={[
            { value: '', label: 'All Modules' },
            ...filteredModules.map(m => ({ value: String(m.id), label: `${m.code} - ${m.title.slice(0, 40)}` })),
          ]}
        />
        <FilterSelect
          label="Difficulty"
          value={filterDifficulty}
          onChange={setFilterDifficulty}
          options={[
            { value: '', label: 'All Levels' },
            ...[1, 2, 3, 4, 5].map(d => ({ value: String(d), label: `${d} - ${DIFFICULTY_LABELS[d]}` })),
          ]}
        />
        <div className="flex-1" />
        <button
          onClick={() => setGenerateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all"
        >
          <span className="text-sm">&#10024;</span>
          Generate with AI
        </button>
      </div>

      {/* Table */}
      {loading ? <Spinner /> : questions.length === 0 ? (
        <EmptyState message="No mock questions found. Generate some with AI using the button above." />
      ) : (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left py-3 px-3 text-slate-500 font-medium w-14">ID</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium w-20">Module</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium w-16">LOS</th>
                  <th className="text-left py-3 px-3 text-slate-500 font-medium">Stem</th>
                  <th className="text-center py-3 px-3 text-slate-500 font-medium w-14">Diff</th>
                  <th className="text-center py-3 px-3 text-slate-500 font-medium w-14">Ans</th>
                  <th className="text-right py-3 px-3 text-slate-500 font-medium w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <tr key={q.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 font-mono tabular-nums">{q.id}</td>
                    <td className="py-2.5 px-3">
                      {q.topic_code && <TopicBadge code={q.topic_code} />}
                      {q.module_code && <span className="ml-1 text-slate-400 text-[10px]">{q.module_code}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">{q.outcome_code || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs">
                      <span className="block truncate" title={q.stem}>
                        {q.stem.length > 80 ? q.stem.slice(0, 80) + '...' : q.stem}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <DifficultyBadge level={q.difficulty} />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-400 text-[11px] font-bold">
                        {q.correct_answer}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(q)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(q)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3">
            <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
          </div>
        </div>
      )}

      <QuestionFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingQuestion(null) }}
        onSave={handleSave}
        initial={formInitial}
        modules={modules}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        type="danger"
        title="Delete Question"
        message={`Delete question #${deleteTarget?.id}? This action cannot be undone.`}
        confirmLabel="Delete"
      />

      <GenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        modules={modules}
        defaultType="mock"
        onGenerated={fetchQuestions}
      />
    </div>
  )
}

// ── CONTENT TAB ────────────────────────────────────────────

function ContentTab({ modules }: { modules: AdminModule[] }) {
  const [data, setData] = useState<DataStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/data-status`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!data) return <EmptyState message="Cannot reach API" />

  // Group modules by topic
  const topicModules: Record<string, AdminModule[]> = {}
  for (const m of modules) {
    if (!topicModules[m.topic_code]) topicModules[m.topic_code] = []
    topicModules[m.topic_code].push(m)
  }

  const TABLE_GROUPS = [
    { label: 'Curriculum', keys: ['topics', 'learning_modules', 'learning_outcomes', 'questions', 'flashcards'] },
    { label: 'Users & Plans', keys: ['users', 'user_profiles', 'study_plans', 'plan_entries'] },
    { label: 'Sessions & Performance', keys: ['sessions', 'performance_records', 'question_attempts', 'srs_queue', 'lm_mastery'] },
    { label: 'Monitoring', keys: ['alerts', 'weakness_log', 'progress_snapshots'] },
    { label: 'Content', keys: ['content_assets', 'content_vectors'] },
  ]

  return (
    <div className="space-y-6">
      {/* Summary counts */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Topics', value: data.counts.topics, color: 'text-blue-400' },
          { label: 'Modules', value: data.counts.learning_modules, color: 'text-purple-400' },
          { label: 'Outcomes', value: data.counts.learning_outcomes, color: 'text-cyan-400' },
          { label: 'Questions', value: data.counts.questions, color: 'text-amber-400' },
          { label: 'Flashcards', value: data.counts.flashcards, color: 'text-emerald-400' },
        ].map(item => (
          <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{item.label}</p>
            <p className={`text-3xl font-bold tabular-nums ${item.color}`}>{item.value ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Table counts by group */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {TABLE_GROUPS.map(group => (
          <div key={group.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">{group.label}</h3>
            <div className="space-y-2">
              {group.keys.map(key => {
                const val = data.counts[key]
                return (
                  <div key={key} className="flex items-center justify-between py-1 px-2 rounded bg-white/[0.02]">
                    <span className="text-xs text-slate-400 font-mono">{key}</span>
                    {val == null || val < 0 ? (
                      <span className="text-red-400 font-mono text-sm">ERR</span>
                    ) : val === 0 ? (
                      <span className="text-slate-600 font-mono text-sm">0</span>
                    ) : (
                      <span className="text-emerald-400 font-mono text-sm font-bold">{val.toLocaleString()}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Per-topic module grid */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-4">Module Coverage by Topic</h3>
        <div className="space-y-5">
          {Object.entries(TOPICS).map(([topicCode, topicName]) => {
            const mods = topicModules[topicCode] || []
            if (mods.length === 0) return null
            const topicColor = TOPIC_COLORS[topicCode] || '#6B7280'
            return (
              <div key={topicCode}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: topicColor }}
                  />
                  <span className="text-xs font-semibold text-white">{topicCode}</span>
                  <span className="text-[11px] text-slate-500">{topicName}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                  {mods.map(m => {
                    const hasContent = m.question_count > 0 || m.flashcard_count > 0
                    return (
                      <div
                        key={m.id}
                        className={`rounded-lg p-2.5 border transition-colors ${
                          hasContent
                            ? 'bg-emerald-500/[0.06] border-emerald-500/20'
                            : 'bg-white/[0.02] border-white/[0.04]'
                        }`}
                      >
                        <p className="text-[10px] font-mono font-bold text-slate-400">{m.code}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5" title={m.title}>{m.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] tabular-nums ${m.question_count > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                            Q:{m.question_count}
                          </span>
                          <span className={`text-[10px] tabular-nums ${m.flashcard_count > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                            FC:{m.flashcard_count}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Topic breakdown table */}
      {data.topic_breakdown.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3">Breakdown by Topic</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Code</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-medium">Topic</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">LMs</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">LOs</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Qs</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">FCs</th>
                  <th className="text-right py-2 px-2 text-slate-500 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.topic_breakdown.map(row => {
                  const total = row.modules + row.outcomes + row.questions + row.flashcards
                  return (
                    <tr key={row.code} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="py-2 px-2"><TopicBadge code={row.code} /></td>
                      <td className="py-2 px-2 text-slate-300 truncate max-w-[180px]">{row.name}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-slate-300">{row.modules}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-slate-300">{row.outcomes}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-slate-300">{row.questions}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-slate-300">{row.flashcards}</td>
                      <td className="py-2 px-2 text-right tabular-nums font-bold text-white">{total}</td>
                    </tr>
                  )
                })}
                <tr className="border-t border-white/[0.08]">
                  <td className="py-2 px-2 font-bold text-white" colSpan={2}>TOTAL</td>
                  <td className="py-2 px-2 text-right tabular-nums font-bold text-white">{data.topic_breakdown.reduce((s, r) => s + r.modules, 0)}</td>
                  <td className="py-2 px-2 text-right tabular-nums font-bold text-white">{data.topic_breakdown.reduce((s, r) => s + r.outcomes, 0)}</td>
                  <td className="py-2 px-2 text-right tabular-nums font-bold text-white">{data.topic_breakdown.reduce((s, r) => s + r.questions, 0)}</td>
                  <td className="py-2 px-2 text-right tabular-nums font-bold text-white">{data.topic_breakdown.reduce((s, r) => s + r.flashcards, 0)}</td>
                  <td className="py-2 px-2 text-right tabular-nums font-bold text-emerald-400">
                    {data.topic_breakdown.reduce((s, r) => s + r.modules + r.outcomes + r.questions + r.flashcards, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: 'qbank',
    label: 'QBank',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    key: 'mock',
    label: 'Mock',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
      </svg>
    ),
  },
  {
    key: 'content',
    label: 'Content',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
]

export default function DataPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('qbank')
  const { modules, loading: modulesLoading } = useModules()

  return (
    <div className="min-h-screen bg-[#0a0d14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Data Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage questions, flashcards, and content</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {modules.length} modules loaded
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] w-fit">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {modulesLoading ? <Spinner /> : (
          <>
            {activeTab === 'qbank' && <QBankTab modules={modules} />}
            {activeTab === 'mock' && <MockTab modules={modules} />}
            {activeTab === 'flashcards' && <FlashcardsTab modules={modules} />}
            {activeTab === 'content' && <ContentTab modules={modules} />}
          </>
        )}
      </div>
    </div>
  )
}
