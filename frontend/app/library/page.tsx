'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { getAuthHeaders } from '@/lib/auth'
import { useToast } from '@/components/ui/Modal'
import { TOPICS as SHARED_TOPICS, TOPIC_COLORS, TOPIC_ORDER, LM_DATA, EXAM_WEIGHT_RANGES } from '@/lib/lm-data'
import ContentManager from '@/components/ContentManager'
import FormulaNavigator from '@/components/Library/FormulaNavigator'

// ── TYPES ──────────────────────────────────────────────────
interface Asset {
  title: string; type: string; category: string; format: string
  size: string; status: 'available' | 'missing' | 'outdated'
  download_url: string; updated_at: string
  filename?: string
}
interface ManifestAsset {
  title: string; filename: string; size_kb: number; status: string
}
interface ManifestModule {
  topic: string; code: string; title: string; los_count: number
  exam_weight: string; volume: number; learning_outcomes: string[]
}
interface Manifest {
  module: ManifestModule; generated_at: string; total_time_sec: number
  assets: ManifestAsset[]
}

// Filename → asset type mapping
const FILENAME_TO_TYPE: Record<string, string> = {
  '01_summary_notes.pdf': 'summary', '01_summary_notes.md': 'summary',
  '02_synthesis.pdf': 'synthesis', '02_synthesis.md': 'synthesis',
  '03_los_sheet.pdf': 'los', '03_los_sheet.md': 'los',
  '04_exam_traps.pdf': 'traps', '04_exam_traps.md': 'traps',
  '05_concept_on_concept.pdf': 'concept', '05_concept_on_concept.md': 'concept',
  '06_decision_tree.pdf': 'decision_tree', '06_decision_tree.md': 'decision_tree',
  '07_essential_sheet.pdf': 'essential', '07_essential_sheet.md': 'essential',
  '08_formula_sheet.pdf': 'formula', '08_formula_sheet.md': 'formula',
  '09_reading_summary.pdf': 'reading', '09_reading_summary.md': 'reading',
  '10_tds_sheet.pdf': 'tds', '10_tds_sheet.md': 'tds',
  '11_blank_recall.pdf': 'blank_recall', '11_blank_recall.md': 'blank_recall',
  '12_flashcards.json': 'flashcards',
  '13_mock_pack.pdf': 'mock', '13_mock_pack.md': 'mock',
  '14_audio_script.pdf': 'audio', '14_audio_script.md': 'audio',
  '00_full_course.mp3': 'audio_mp3',
  '00_full_course.pdf': 'full_course_script', '00_full_course.md': 'full_course_script',
  '15_knowledge_audit.pdf': 'audit', '15_knowledge_audit.md': 'audit',
  '16_weakness_pool.pdf': 'weakness', '16_weakness_pool.md': 'weakness',
  '17_learning_map.svg': 'learning_map', '17_learning_map.dot': 'learning_map',
}

const TYPE_TO_ASSET_KEY: Record<string, string> = {
  summary: '01_summary_notes', synthesis: '02_synthesis', los: '03_los_sheet',
  traps: '04_exam_traps', concept: '05_concept_on_concept', decision_tree: '06_decision_tree',
  essential: '07_essential_sheet', formula: '08_formula_sheet', reading: '09_reading_summary',
  tds: '10_tds_sheet', blank_recall: '11_blank_recall', flashcards: '12_flashcards',
  mock: '13_mock_pack', audio: '14_audio_script', audio_mp3: '00_full_course',
  full_course_script: '00_full_course_script',
  audit: '15_knowledge_audit', weakness: '16_weakness_pool',
  learning_map: '17_learning_map',
}

// Pipeline step (1..19) for each asset type. Used to highlight the currently
// in-flight asset card during a generate-all run. Step 18 is the course .md
// (intermediate, no card). Step 19 is the full-course .mp3.
const TYPE_TO_PIPELINE_STEP: Record<string, number> = {
  summary: 1, synthesis: 2, los: 3, traps: 4, concept: 5, decision_tree: 6,
  essential: 7, formula: 8, reading: 9, tds: 10, blank_recall: 11,
  flashcards: 12, mock: 13, audio: 14, audit: 15, weakness: 16, learning_map: 17,
  full_course_script: 18, audio_mp3: 19,
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// localStorage key for the currently-running Generate All job. Persists across
// page navigation so the bar resumes when the user comes back to /library.
const ACTIVE_JOB_KEY = 'wingman_generate_all_job'

// ── TOPIC INFO ────────────────────────────────────────────
const TOPIC_WEIGHTS = EXAM_WEIGHT_RANGES

const ASSET_CATEGORIES: Record<string, { label: string; icon: string; color: string }> = {
  'Core Learning':    { label: 'Core Learning', icon: '📖', color: '#3B82F6' },
  'Exam Prep':        { label: 'Exam Prep', icon: '🎯', color: '#EF4444' },
  'Active Recall':    { label: 'Active Recall', icon: '🧠', color: '#8B5CF6' },
  'Audio & Passive':  { label: 'Audio & Passive', icon: '🎧', color: '#059669' },
  'Diagnostics':      { label: 'Diagnostics', icon: '🔬', color: '#F59E0B' },
}

const ASSET_TEMPLATES: { title: string; type: string; category: string; format: string }[] = [
  { title: 'Summary Notes',       type: 'summary',        category: 'Core Learning',   format: 'PDF' },
  { title: 'Synthesis',           type: 'synthesis',       category: 'Core Learning',   format: 'PDF' },
  { title: 'Reading Summary',     type: 'reading',         category: 'Core Learning',   format: 'PDF' },
  { title: 'LOS Sheet',           type: 'los',             category: 'Core Learning',   format: 'PDF' },
  { title: 'Formula Sheet',       type: 'formula',         category: 'Core Learning',   format: 'PDF' },
  { title: 'Essential Sheet',     type: 'essential',       category: 'Exam Prep',       format: 'PDF' },
  { title: 'Exam Traps',          type: 'traps',           category: 'Exam Prep',       format: 'PDF' },
  { title: 'Decision Tree Sheet', type: 'decision_tree',   category: 'Exam Prep',       format: 'PDF' },
  { title: 'TDS Sheet',           type: 'tds',             category: 'Exam Prep',       format: 'PDF' },
  { title: 'Concept on Concept',  type: 'concept',         category: 'Exam Prep',       format: 'PDF' },
  { title: 'Blank Recall Sheet',  type: 'blank_recall',    category: 'Active Recall',   format: 'PDF' },
  { title: 'Flashcards',          type: 'flashcards',      category: 'Active Recall',   format: 'JSON' },
  { title: 'Mock Pack',           type: 'mock',            category: 'Active Recall',   format: 'PDF' },
  { title: 'Audio Script',         type: 'audio',           category: 'Audio & Passive', format: 'PDF' },
  { title: 'Audio Synthesis',      type: 'audio_mp3',       category: 'Audio & Passive', format: 'MP3' },
  { title: 'Full Course',          type: 'full_course_script', category: 'Audio & Passive', format: 'PDF' },
  { title: 'Knowledge Audit',     type: 'audit',           category: 'Diagnostics',     format: 'PDF' },
  { title: 'Weakness Pool',       type: 'weakness',        category: 'Diagnostics',     format: 'PDF' },
  { title: 'Learning Map',        type: 'learning_map',    category: 'Core Learning',   format: 'SVG' },
]

// ── LM DATA ──────────────────────────────────────────────
interface LMInfo {
  topic: string; lmCode: string; title: string; volume: number
  losCount: number; priority: 'Critical' | 'High' | 'Medium' | 'Low'
  studyStatus: 'Not Started' | 'In Progress' | 'To Review' | 'Mastered'
  assets: Asset[]
}

// Editorial metadata per LM (volume, LOS count, priority, study status).
// The module list (topic/code/title) itself is derived from LM_DATA so it stays
// in sync with the DB after `npm run sync-lms`. Add new entries here for new
// modules; missing entries fall through to DEFAULT_LM_META.
const LM_META: Record<string, { volume: number; losCount: number; priority: string; studyStatus: string }> = {
  'ETH/LM01': { volume: 1, losCount: 7, priority: 'High', studyStatus: 'In Progress' },
  'ETH/LM02': { volume: 1, losCount: 6, priority: 'High', studyStatus: 'Not Started' },
  'ETH/LM03': { volume: 1, losCount: 8, priority: 'High', studyStatus: 'Not Started' },
  'ETH/LM04': { volume: 1, losCount: 6, priority: 'High', studyStatus: 'Not Started' },
  'ETH/LM05': { volume: 1, losCount: 2, priority: 'Critical', studyStatus: 'Not Started' },
  'QM/LM01': { volume: 1, losCount: 6, priority: 'Critical', studyStatus: 'In Progress' },
  'QM/LM02': { volume: 1, losCount: 3, priority: 'Critical', studyStatus: 'In Progress' },
  'QM/LM03': { volume: 1, losCount: 4, priority: 'High', studyStatus: 'Not Started' },
  'QM/LM04': { volume: 1, losCount: 3, priority: 'High', studyStatus: 'Not Started' },
  'QM/LM05': { volume: 1, losCount: 3, priority: 'High', studyStatus: 'Not Started' },
  'QM/LM06': { volume: 1, losCount: 3, priority: 'Medium', studyStatus: 'Not Started' },
  'QM/LM07': { volume: 1, losCount: 3, priority: 'Medium', studyStatus: 'Not Started' },
  'QM/LM08': { volume: 1, losCount: 4, priority: 'Medium', studyStatus: 'Not Started' },
  'QM/LM09': { volume: 1, losCount: 2, priority: 'Medium', studyStatus: 'Not Started' },
  'QM/LM10': { volume: 2, losCount: 7, priority: 'High', studyStatus: 'Not Started' },
  'QM/LM11': { volume: 2, losCount: 3, priority: 'Low', studyStatus: 'Not Started' },
  'ECO/LM01': { volume: 2, losCount: 5, priority: 'Medium', studyStatus: 'Not Started' },
  'ECO/LM02': { volume: 2, losCount: 3, priority: 'Low', studyStatus: 'Not Started' },
  'ECO/LM03': { volume: 2, losCount: 4, priority: 'Medium', studyStatus: 'Not Started' },
  'ECO/LM04': { volume: 2, losCount: 4, priority: 'Medium', studyStatus: 'Not Started' },
  'ECO/LM05': { volume: 2, losCount: 6, priority: 'Medium', studyStatus: 'Not Started' },
  'ECO/LM06': { volume: 2, losCount: 3, priority: 'Medium', studyStatus: 'Not Started' },
  'ECO/LM07': { volume: 2, losCount: 3, priority: 'Low', studyStatus: 'Not Started' },
  'ECO/LM08': { volume: 2, losCount: 2, priority: 'Medium', studyStatus: 'Not Started' },
  'CORP/LM01': { volume: 3, losCount: 3, priority: 'Medium', studyStatus: 'Not Started' },
  'CORP/LM02': { volume: 3, losCount: 3, priority: 'Low', studyStatus: 'Not Started' },
  'CORP/LM03': { volume: 3, losCount: 3, priority: 'Medium', studyStatus: 'Not Started' },
  'CORP/LM04': { volume: 3, losCount: 3, priority: 'Medium', studyStatus: 'Not Started' },
  'CORP/LM05': { volume: 3, losCount: 4, priority: 'Medium', studyStatus: 'Not Started' },
  'CORP/LM06': { volume: 3, losCount: 4, priority: 'Medium', studyStatus: 'Not Started' },
  'CORP/LM07': { volume: 3, losCount: 2, priority: 'Low', studyStatus: 'Not Started' },
  'FSA/LM01': { volume: 3, losCount: 5, priority: 'High', studyStatus: 'In Progress' },
  'FSA/LM02': { volume: 3, losCount: 7, priority: 'High', studyStatus: 'In Progress' },
  'FSA/LM03': { volume: 3, losCount: 5, priority: 'High', studyStatus: 'Not Started' },
  'FSA/LM04': { volume: 3, losCount: 7, priority: 'High', studyStatus: 'Not Started' },
  'FSA/LM05': { volume: 3, losCount: 2, priority: 'High', studyStatus: 'Not Started' },
  'FSA/LM06': { volume: 3, losCount: 3, priority: 'High', studyStatus: 'Not Started' },
  'FSA/LM07': { volume: 3, losCount: 4, priority: 'High', studyStatus: 'Not Started' },
  'FSA/LM08': { volume: 3, losCount: 3, priority: 'Medium', studyStatus: 'Not Started' },
  'FSA/LM09': { volume: 3, losCount: 4, priority: 'High', studyStatus: 'Not Started' },
  'FSA/LM10': { volume: 4, losCount: 9, priority: 'High', studyStatus: 'Not Started' },
  'FSA/LM11': { volume: 4, losCount: 6, priority: 'High', studyStatus: 'Not Started' },
  'FSA/LM12': { volume: 4, losCount: 6, priority: 'High', studyStatus: 'Not Started' },
  'EQU/LM01': { volume: 4, losCount: 12, priority: 'High', studyStatus: 'Not Started' },
  'EQU/LM02': { volume: 4, losCount: 11, priority: 'High', studyStatus: 'Not Started' },
  'EQU/LM03': { volume: 4, losCount: 7, priority: 'Medium', studyStatus: 'Not Started' },
  'EQU/LM05': { volume: 4, losCount: 5, priority: 'High', studyStatus: 'Not Started' },
  'EQU/LM06': { volume: 4, losCount: 5, priority: 'Medium', studyStatus: 'Not Started' },
  'EQU/LM07': { volume: 4, losCount: 5, priority: 'Medium', studyStatus: 'Not Started' },
  'EQU/LM08': { volume: 5, losCount: 13, priority: 'Critical', studyStatus: 'Not Started' },
  'FI/LM01': { volume: 5, losCount: 2, priority: 'High', studyStatus: 'To Review' },
  'FI/LM02': { volume: 5, losCount: 2, priority: 'High', studyStatus: 'Not Started' },
  'FI/LM03': { volume: 5, losCount: 3, priority: 'High', studyStatus: 'Not Started' },
  'FI/LM04': { volume: 5, losCount: 3, priority: 'Critical', studyStatus: 'Not Started' },
  'FI/LM05': { volume: 5, losCount: 2, priority: 'Critical', studyStatus: 'Not Started' },
  'FI/LM06': { volume: 5, losCount: 3, priority: 'Critical', studyStatus: 'Not Started' },
  'FI/LM07': { volume: 5, losCount: 2, priority: 'Critical', studyStatus: 'Not Started' },
  'FI/LM08': { volume: 5, losCount: 2, priority: 'Critical', studyStatus: 'Not Started' },
  'FI/LM09': { volume: 5, losCount: 3, priority: 'Critical', studyStatus: 'Not Started' },
  'FI/LM10': { volume: 5, losCount: 3, priority: 'Critical', studyStatus: 'Not Started' },
  'FI/LM11': { volume: 6, losCount: 2, priority: 'Critical', studyStatus: 'Not Started' },
  'FI/LM12': { volume: 6, losCount: 3, priority: 'Critical', studyStatus: 'Not Started' },
  'FI/LM13': { volume: 6, losCount: 4, priority: 'Critical', studyStatus: 'Not Started' },
  'FI/LM14': { volume: 6, losCount: 3, priority: 'High', studyStatus: 'Not Started' },
  'FI/LM15': { volume: 6, losCount: 1, priority: 'High', studyStatus: 'Not Started' },
  'FI/LM16': { volume: 6, losCount: 3, priority: 'High', studyStatus: 'Not Started' },
  'FI/LM17': { volume: 6, losCount: 2, priority: 'High', studyStatus: 'Not Started' },
  'FI/LM18': { volume: 6, losCount: 4, priority: 'Medium', studyStatus: 'Not Started' },
  'FI/LM19': { volume: 6, losCount: 4, priority: 'Medium', studyStatus: 'Not Started' },
  'DER/LM01': { volume: 6, losCount: 2, priority: 'Medium', studyStatus: 'Not Started' },
  'DER/LM02': { volume: 6, losCount: 3, priority: 'High', studyStatus: 'Not Started' },
  'DER/LM03': { volume: 6, losCount: 2, priority: 'Medium', studyStatus: 'Not Started' },
  'DER/LM04': { volume: 6, losCount: 2, priority: 'High', studyStatus: 'Not Started' },
  'DER/LM05': { volume: 6, losCount: 2, priority: 'Critical', studyStatus: 'Not Started' },
  'DER/LM06': { volume: 6, losCount: 2, priority: 'High', studyStatus: 'Not Started' },
  'DER/LM07': { volume: 6, losCount: 2, priority: 'High', studyStatus: 'Not Started' },
  'DER/LM08': { volume: 6, losCount: 4, priority: 'High', studyStatus: 'Not Started' },
  'DER/LM09': { volume: 6, losCount: 2, priority: 'High', studyStatus: 'Not Started' },
  'DER/LM10': { volume: 6, losCount: 2, priority: 'Medium', studyStatus: 'Not Started' },
  'ALT/LM01': { volume: 6, losCount: 3, priority: 'Low', studyStatus: 'Not Started' },
  'ALT/LM02': { volume: 6, losCount: 2, priority: 'Medium', studyStatus: 'Not Started' },
  'ALT/LM03': { volume: 6, losCount: 3, priority: 'Medium', studyStatus: 'Not Started' },
  'ALT/LM04': { volume: 6, losCount: 4, priority: 'Medium', studyStatus: 'Not Started' },
  'ALT/LM05': { volume: 6, losCount: 3, priority: 'Low', studyStatus: 'Not Started' },
  'ALT/LM06': { volume: 6, losCount: 3, priority: 'Medium', studyStatus: 'Not Started' },
  'ALT/LM07': { volume: 6, losCount: 4, priority: 'Low', studyStatus: 'Not Started' },
  'PM/LM01': { volume: 6, losCount: 7, priority: 'High', studyStatus: 'Not Started' },
  'PM/LM02': { volume: 6, losCount: 9, priority: 'High', studyStatus: 'Not Started' },
  'PM/LM03': { volume: 6, losCount: 6, priority: 'Medium', studyStatus: 'Not Started' },
  'PM/LM04': { volume: 6, losCount: 8, priority: 'Medium', studyStatus: 'Not Started' },
  'PM/LM05': { volume: 6, losCount: 3, priority: 'Medium', studyStatus: 'Not Started' },
  'PM/LM06': { volume: 6, losCount: 7, priority: 'Medium', studyStatus: 'Not Started' },
}

const DEFAULT_LM_META = { volume: 1, losCount: 0, priority: 'Medium', studyStatus: 'Not Started' }

const RAW_LMS: [string, string, string, number, number, string, string][] = LM_DATA.map(([topic, lmCode, title]) => {
  const meta = LM_META[`${topic}/${lmCode}`] || DEFAULT_LM_META
  return [topic, lmCode, title, meta.volume, meta.losCount, meta.priority, meta.studyStatus]
})

function generateDefaultAssets(): Asset[] {
  return ASSET_TEMPLATES.map(t => ({
    title: t.title, type: t.type, category: t.category, format: t.format,
    size: '—', status: 'missing' as const, download_url: '', updated_at: '',
  }))
}

function mergeManifestAssets(topic: string, lmCode: string, manifest: Manifest): Asset[] {
  const manifestMap = new Map<string, ManifestAsset>()
  for (const a of manifest.assets) {
    const type = FILENAME_TO_TYPE[a.filename]
    if (type) manifestMap.set(type, a)
  }
  const genDate = manifest.generated_at
    ? new Date(manifest.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''
  return ASSET_TEMPLATES.map(t => {
    const real = manifestMap.get(t.type)
    if (real && real.status === 'success') {
      const ext = real.filename.split('.').pop()?.toUpperCase() || t.format
      return {
        title: real.title || t.title, type: t.type, category: t.category,
        format: ext || t.format, size: `${real.size_kb} KB`,
        status: 'available' as const,
        download_url: `${API_BASE}/api/content/generated/${topic}/${lmCode}/${real.filename}`,
        updated_at: genDate, filename: real.filename,
      }
    }
    return {
      title: t.title, type: t.type, category: t.category, format: t.format,
      size: '—', status: 'missing' as const, download_url: '', updated_at: '',
    }
  })
}

const BASE_LMS: LMInfo[] = RAW_LMS.map(r => ({
  topic: r[0], lmCode: r[1], title: r[2], volume: r[3] as number,
  losCount: r[4] as number, priority: r[5] as LMInfo['priority'],
  studyStatus: r[6] as LMInfo['studyStatus'],
  assets: generateDefaultAssets(),
}))

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  Critical: { bg: 'rgba(239,68,68,0.15)', text: '#F87171' },
  High:     { bg: 'rgba(245,158,11,0.15)', text: '#FBBF24' },
  Medium:   { bg: 'rgba(59,130,246,0.15)', text: '#60A5FA' },
  Low:      { bg: 'rgba(107,114,128,0.15)', text: '#9CA3AF' },
}
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  'Not Started': { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8' },
  'In Progress': { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B' },
  'To Review':   { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6' },
  'Mastered':    { bg: 'rgba(34,197,94,0.12)', text: '#22C55E' },
}
const ASSET_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: 'rgba(34,197,94,0.12)', text: '#22C55E', label: 'Available' },
  missing:   { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', label: 'Missing' },
  outdated:  { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', label: 'Outdated' },
}
const FORMAT_ICONS: Record<string, string> = { PDF: '📄', MP3: '🎵', JSON: '{}', CSV: '📋', MD: '📝', SVG: '🗺️' }

// ── MAIN PAGE ──────────────────────────────────────────────
export default function LibraryPage() {
  const searchParams = useSearchParams()
  const toast = useToast()

  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [selectedLMKey, setSelectedLMKey] = useState<string>('')  // "TOPIC/LMCODE"
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [manifests, setManifests] = useState<Record<string, Manifest>>({})
  const [generating, setGenerating] = useState<string | null>(null)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [jobState, setJobState] = useState<{
    job_id: string; topic: string; lm_code: string
    status: 'running' | 'done' | 'error'
    phase: string; step: number; total_steps: number
    label: string; sub_message: string; sub_pct: number
    in_flight?: string[]   // asset stems currently being generated (parallel pool)
    error?: string
  } | null>(null)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [generatingAudio, setGeneratingAudio] = useState(false)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [cmOpen, setCmOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [trashItems, setTrashItems] = useState<{ topic: string; lm_code: string; filename: string; trashed_at: string; size_kb: number }[]>([])
  const [showTrash, setShowTrash] = useState(false)
  const [trashing, setTrashing] = useState<string | null>(null)

  // Per-LM mastery (for ROI computation, same source as Today Mission).
  const [lmProgress, setLmProgress] = useState<Record<string, number>>({})
  useEffect(() => {
    try {
      const s = localStorage.getItem('wingman_lm_progress')
      if (s) setLmProgress(JSON.parse(s))
    } catch { /* ignore */ }
  }, [])

  // ROI per LM = expected mastery gain after one ~60-min session.
  // Mirrors the Today Mission Hero formula : `gap * 0.12 * (time/60)` capped 15%.
  const roiFor = useCallback((topic: string, lmCode: string): number => {
    const mastery = lmProgress[`${topic}/${lmCode}`] ?? 0
    const gap = Math.max(0, 100 - mastery)
    return Math.min(15, Math.round(gap * 0.12))
  }, [lmProgress])

  // Fetch manifests from backend
  useEffect(() => {
    async function fetchManifests() {
      try {
        const res = await fetch(`${API_BASE}/api/content/generated`, { headers: getAuthHeaders(), credentials: 'include' as RequestCredentials })
        if (!res.ok) return
        const modules: { topic: string; lm_code: string }[] = await res.json()
        const promises = modules.map(async (m) => {
          try {
            const r = await fetch(`${API_BASE}/api/content/generated/${m.topic}/${m.lm_code}`, { headers: getAuthHeaders(), credentials: 'include' as RequestCredentials })
            if (r.ok) {
              const manifest: Manifest = await r.json()
              return { key: `${m.topic}/${m.lm_code}`, manifest }
            }
          } catch { /* ignore */ }
          return null
        })
        const results = await Promise.all(promises)
        const newManifests: Record<string, Manifest> = {}
        for (const r of results) { if (r) newManifests[r.key] = r.manifest }
        setManifests(newManifests)
      } catch { /* ignore */ }
    }
    fetchManifests()
  }, [])

  // Merge manifests into LMs
  const ALL_LMS = useMemo(() => {
    return BASE_LMS.map(lm => {
      const key = `${lm.topic}/${lm.lmCode}`
      const manifest = manifests[key]
      if (manifest) return { ...lm, assets: mergeManifestAssets(lm.topic, lm.lmCode, manifest) }
      return lm
    })
  }, [manifests])

  // Handle URL param ?lm=ETH/LM01
  useEffect(() => {
    const lmParam = searchParams.get('lm')
    if (lmParam && lmParam.includes('/')) {
      const [topic, code] = lmParam.split('/')
      if (TOPIC_ORDER.includes(topic)) {
        setSelectedTopic(topic)
        setSelectedLMKey(lmParam)
      }
    }
  }, [searchParams])

  // LMs for selected topic
  const topicLMs = useMemo(() => {
    if (!selectedTopic) return []
    return ALL_LMS.filter(lm => lm.topic === selectedTopic)
  }, [selectedTopic, ALL_LMS])

  // Current LM
  const currentLM = useMemo(() => {
    if (!selectedLMKey) return null
    return ALL_LMS.find(lm => `${lm.topic}/${lm.lmCode}` === selectedLMKey) || null
  }, [selectedLMKey, ALL_LMS])

  // Assets filtered by category
  const filteredAssets = useMemo(() => {
    if (!currentLM) return []
    if (categoryFilter === 'All') return currentLM.assets
    return currentLM.assets.filter(a => a.category === categoryFilter)
  }, [currentLM, categoryFilter])

  // Group assets by category
  const groupedAssets = useMemo(() => {
    const groups: Record<string, Asset[]> = {}
    filteredAssets.forEach(a => {
      if (!groups[a.category]) groups[a.category] = []
      groups[a.category].push(a)
    })
    return groups
  }, [filteredAssets])

  // Topic change → reset LM
  const handleTopicChange = useCallback((topic: string) => {
    setSelectedTopic(topic)
    setSelectedLMKey('')
    setCategoryFilter('All')
  }, [])

  // LM change
  const handleLMChange = useCallback((key: string) => {
    setSelectedLMKey(key)
    setCategoryFilter('All')
  }, [])

  // Refresh manifests
  const refreshManifests = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/content/generated`, { headers: getAuthHeaders(), credentials: 'include' as RequestCredentials })
      if (!res.ok) return
      const modules: { topic: string; lm_code: string }[] = await res.json()
      const promises = modules.map(async (m) => {
        try {
          const r = await fetch(`${API_BASE}/api/content/generated/${m.topic}/${m.lm_code}`, { headers: getAuthHeaders(), credentials: 'include' as RequestCredentials })
          if (r.ok) {
            const manifest: Manifest = await r.json()
            return { key: `${m.topic}/${m.lm_code}`, manifest }
          }
        } catch { /* ignore */ }
        return null
      })
      const results = await Promise.all(promises)
      const newManifests: Record<string, Manifest> = {}
      for (const r of results) { if (r) newManifests[r.key] = r.manifest }
      setManifests(newManifests)
    } catch { /* ignore */ }
  }, [])

  // Fetch trash items
  const fetchTrash = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/content/trash`, { headers: getAuthHeaders(), credentials: 'include' as RequestCredentials })
      if (res.ok) setTrashItems(await res.json())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchTrash() }, [fetchTrash])

  // Upload files to current module
  const handleUpload = useCallback(async (files: FileList) => {
    if (!currentLM || uploading) return
    setUploading(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) formData.append('files', files[i])
      // No `headers: getAuthHeaders()` here: it forces Content-Type: application/json,
      // which prevents the browser from setting `multipart/form-data; boundary=...`
      // → FastAPI rejects the body with 422 "Field required". Auth still works via
      // the cookie (credentials: 'include').
      const res = await fetch(`${API_BASE}/api/content/upload/${currentLM.topic}/${currentLM.lmCode}`, {
        method: 'POST',
        credentials: 'include' as RequestCredentials,
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        toast.success('Upload successful', `${data.uploaded?.length || files.length} file(s) uploaded`)
        await refreshManifests()
      } else {
        toast.error('Upload failed', 'Could not upload files')
      }
    } catch (e) {
      toast.error('Upload error', `${e}`)
    } finally {
      setUploading(false)
    }
  }, [currentLM, uploading, refreshManifests, toast])

  // Move asset to trash
  const trashAsset = useCallback(async (topic: string, lmCode: string, filename: string) => {
    setTrashing(filename)
    try {
      const res = await fetch(`${API_BASE}/api/content/generated/${topic}/${lmCode}/${filename}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include' as RequestCredentials,
      })
      if (res.ok) {
        toast.success('Moved to trash', filename)
        await refreshManifests()
        await fetchTrash()
      } else {
        toast.error('Failed', 'Could not trash file')
      }
    } catch (e) {
      toast.error('Error', `${e}`)
    } finally {
      setTrashing(null)
    }
  }, [refreshManifests, fetchTrash, toast])

  // Restore from trash
  const restoreFromTrash = useCallback(async (topic: string, lmCode: string, filename: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/content/trash/restore?topic=${topic}&lm_code=${lmCode}&filename=${filename}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include' as RequestCredentials,
      })
      if (res.ok) {
        toast.success('Restored', filename)
        await refreshManifests()
        await fetchTrash()
      } else {
        toast.error('Restore failed', 'Could not restore file')
      }
    } catch (e) {
      toast.error('Error', `${e}`)
    }
  }, [refreshManifests, fetchTrash, toast])

  // Empty trash
  const emptyTrash = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/content/trash/empty`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include' as RequestCredentials,
      })
      if (res.ok) {
        const data = await res.json()
        toast.success('Trash emptied', `${data.deleted_count} file(s) permanently deleted`)
        setTrashItems([])
      }
    } catch (e) {
      toast.error('Error', `${e}`)
    }
  }, [toast])

  // Generate asset — uses local generator (generate-all) since API has no credits
  const generateAsset = useCallback(async (topic: string, lmCode: string, lmTitle: string, assetType: string) => {
    if (generating) return
    const assetKey = TYPE_TO_ASSET_KEY[assetType]
    if (!assetKey) {
      toast.error('Error', `Unknown type: ${assetType}`)
      return
    }
    setGenerating(assetType)
    try {
      const res = await fetch(`${API_BASE}/api/content/generate-one/${topic}/${lmCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify({ lm_title: lmTitle, asset_key: assetKey }),
      })
      if (res.ok) {
        toast.success('Asset generated', `${assetKey} created for ${topic}/${lmCode}`)
        await refreshManifests()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error('Generation failed', err.detail || res.statusText)
      }
    } catch (e) {
      toast.error('Generation error', `${e}`)
    } finally {
      setGenerating(null)
    }
  }, [generating, refreshManifests, toast])

  // Poll a generate-all job until it ends, updating jobState live.
  const pollJob = useCallback(async (jobId: string, topic: string, lmCode: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/content/generate-all/job/${jobId}`)
      if (res.status === 404) {
        // Job expired or never existed — clear and stop polling.
        try { localStorage.removeItem(ACTIVE_JOB_KEY) } catch {}
        setGeneratingAll(false)
        setJobState(null)
        return
      }
      if (!res.ok) throw new Error(`Poll ${res.status}`)
      const s = await res.json()
      setJobState(prev => {
        // Refresh manifests when an asset has just completed (step advanced)
        // so the user sees "Missing" → "Available" transitions in real time.
        if (prev && s.status === 'running' && s.step > prev.step) {
          refreshManifests()
        }
        return {
          job_id: jobId, topic, lm_code: lmCode,
          status: s.status, phase: s.phase, step: s.step, total_steps: s.total_steps,
          label: s.label || '', sub_message: s.sub_message || '', sub_pct: s.sub_pct || 0,
          in_flight: Array.isArray(s.in_flight) ? s.in_flight : undefined,
          error: s.error,
        }
      })
      if (s.status === 'done') {
        try { localStorage.removeItem(ACTIVE_JOB_KEY) } catch {}
        toast.success('Generate All terminé', s.sub_message || `${s.total_steps} étapes OK`)
        await refreshManifests()
        setGeneratingAll(false)
        setTimeout(() => setJobState(null), 4000)
      } else if (s.status === 'error') {
        try { localStorage.removeItem(ACTIVE_JOB_KEY) } catch {}
        toast.error('Generate All échec', s.error || 'Erreur inconnue')
        setGeneratingAll(false)
        // Keep the error bar visible — the user needs time to read the error
        // and decide whether to click "Reprendre". It clears on Reprendre, on
        // navigation away, or on page reload.
      } else {
        pollRef.current = setTimeout(() => pollJob(jobId, topic, lmCode), 1500)
      }
    } catch (e) {
      toast.error('Polling error', `${e}`)
      setGeneratingAll(false)
      setJobState(null)
    }
  }, [refreshManifests, toast])

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current) }, [])

  // Cancel a running Generate All job (kills the subprocess on the backend).
  const cancelJob = useCallback(async (jobId: string) => {
    try {
      await fetch(`${API_BASE}/api/content/generate-all/job/${jobId}/cancel`, { method: 'POST' })
    } catch (e) { /* fall through — polling will pick up the error state */ }
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null }
    try { localStorage.removeItem(ACTIVE_JOB_KEY) } catch {}
    toast.success('Pipeline annulé', 'Les assets déjà générés restent accessibles.')
    setGeneratingAll(false)
    setJobState(null)
  }, [toast])

  // Resume polling on mount if a job was started in a previous session/page —
  // the backend pipeline keeps running independently of the UI, so the user
  // can navigate away and come back to see live progress.
  const pollJobRef = useRef(pollJob)
  useEffect(() => { pollJobRef.current = pollJob }, [pollJob])
  useEffect(() => {
    if (typeof window === 'undefined') return
    let stored: { job_id: string; topic: string; lm_code: string } | null = null
    try {
      const raw = localStorage.getItem(ACTIVE_JOB_KEY)
      if (raw) stored = JSON.parse(raw)
    } catch { stored = null }
    if (!stored || !stored.job_id) return
    setGeneratingAll(true)
    setJobState({
      job_id: stored.job_id, topic: stored.topic, lm_code: stored.lm_code,
      status: 'running', phase: 'starting', step: 1, total_steps: 19,
      label: 'Reprise...', sub_message: '', sub_pct: 0,
    })
    pollJobRef.current(stored.job_id, stored.topic, stored.lm_code)
  }, [])

  // Generate ALL assets + full course .md + .mp3 for a module (async job)
  const generateAllAssets = useCallback(async (topic: string, lmCode: string, lmTitle: string) => {
    if (generatingAll) return
    setGeneratingAll(true)
    try {
      const res = await fetch(`${API_BASE}/api/content/generate-all/${topic}/${lmCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lm_title: lmTitle }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error('Generation failed to start', err.detail || res.statusText)
        setGeneratingAll(false)
        return
      }
      const { job_id, total_steps } = await res.json()
      try {
        localStorage.setItem(ACTIVE_JOB_KEY, JSON.stringify({ job_id, topic, lm_code: lmCode }))
      } catch {}
      setJobState({
        job_id, topic, lm_code: lmCode,
        status: 'running', phase: 'starting', step: 1, total_steps,
        label: 'Démarrage', sub_message: '', sub_pct: 0,
      })
      pollJob(job_id, topic, lmCode)
    } catch (e) {
      toast.error('Generation error', `${e}`)
      setGeneratingAll(false)
    }
  }, [generatingAll, pollJob, toast])

  // Generate audio MP3 for a module
  const generateAudio = useCallback(async (topic: string, lmCode: string, lmTitle: string) => {
    if (generatingAudio) return
    setGeneratingAudio(true)
    try {
      const res = await fetch(`${API_BASE}/api/content/generate-audio/${topic}/${lmCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lm_title: lmTitle }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success('Audio generated', `${data.filename} (${data.size_kb} KB)`)
        await refreshManifests()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error('Audio generation failed', err.detail || res.statusText)
      }
    } catch (e) {
      toast.error('Audio generation error', `${e}`)
    } finally {
      setGeneratingAudio(false)
    }
  }, [generatingAudio, refreshManifests, toast])

  // Stats
  const availableCount = currentLM ? currentLM.assets.filter(a => a.status === 'available').length : 0
  const missingCount = currentLM ? currentLM.assets.filter(a => a.status === 'missing').length : 0

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 mb-5">
          {/* Left — title + KPI strip on the same line */}
          <div className="flex items-start gap-6 min-w-0">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white">Library</h1>
              <p className="text-xs text-slate-500 mt-0.5">{ALL_LMS.length} modules · {ASSET_TEMPLATES.length} assets per module</p>
            </div>
            <div className="flex items-center gap-4 pt-1">
              <div>
                <div className="text-lg font-bold text-white tabular-nums leading-none">{ALL_LMS.length}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-[0.12em] mt-1">Modules</div>
              </div>
              <div className="w-px h-7 bg-white/[0.06]" />
              <div>
                <div className="text-lg font-bold text-emerald-400 tabular-nums leading-none">
                  {ALL_LMS.reduce((acc, lm) => acc + lm.assets.filter(a => a.status === 'available').length, 0)}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-[0.12em] mt-1">Assets Ready</div>
              </div>
            </div>
          </div>

          {/* Right — actions: Upload primary, Content Manager + Trash secondary */}
          <div className="flex items-center gap-2 shrink-0">
            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              !currentLM || uploading
                ? 'bg-blue-500/15 text-blue-400/60 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {uploading ? 'Uploading...' : 'Upload'}
              <input
                type="file"
                multiple
                className="hidden"
                disabled={!currentLM || uploading}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) handleUpload(e.target.files)
                  e.target.value = ''
                }}
              />
            </label>
            <button
              onClick={() => setCmOpen(true)}
              title="Open Content Manager (admin)"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Manager
            </button>
            <button
              onClick={() => { setShowTrash(!showTrash); if (!showTrash) fetchTrash() }}
              title={showTrash ? 'Hide trash' : 'Show trash'}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                showTrash
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Trash{trashItems.length > 0 ? ` (${trashItems.length})` : ''}
            </button>
          </div>
        </div>

        {/* ── SELECTORS ── */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Topic dropdown */}
          <div className="flex-1">
            <label className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider mb-1.5 block">Subject</label>
            <select
              value={selectedTopic}
              onChange={(e) => handleTopicChange(e.target.value)}
              className="w-full px-3 py-3 rounded-2xl bg-surface-800 border border-surface-600 text-sm text-white outline-none focus:border-accent-blue transition-colors appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              <option value="" className="bg-surface-900">-- Select a subject --</option>
              {TOPIC_ORDER.map(t => (
                <option key={t} value={t} className="bg-surface-900">
                  {t} — {SHARED_TOPICS[t]} ({TOPIC_WEIGHTS[t]})
                </option>
              ))}
            </select>
          </div>

          {/* LM dropdown */}
          <div className="flex-[1.5]">
            <label className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider mb-1.5 block">Learning Module</label>
            <select
              value={selectedLMKey}
              onChange={(e) => handleLMChange(e.target.value)}
              disabled={!selectedTopic}
              className="w-full px-3 py-3 rounded-2xl bg-surface-800 border border-surface-600 text-sm text-white outline-none focus:border-accent-blue transition-colors appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              <option value="" className="bg-surface-900">-- Select a LM --</option>
              {topicLMs.map(lm => {
                const roi = roiFor(lm.topic, lm.lmCode)
                return (
                  <option key={`${lm.topic}/${lm.lmCode}`} value={`${lm.topic}/${lm.lmCode}`} className="bg-surface-900">
                    {lm.lmCode} — {lm.title}{roi > 0 ? `  · ROI +${roi}%` : ''}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* Selected topic pills (quick switch) */}
        {selectedTopic && (
          <div className="flex flex-wrap gap-2 mt-3">
            {TOPIC_ORDER.map(t => (
              <button
                key={t}
                onClick={() => handleTopicChange(t)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                  t === selectedTopic
                    ? 'text-white border-transparent'
                    : 'text-slate-500 border-white/[0.06] hover:text-slate-300 hover:border-white/[0.1]'
                }`}
                style={t === selectedTopic ? { background: TOPIC_COLORS[t], borderColor: TOPIC_COLORS[t] } : {}}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══ EMPTY STATE ═══ */}
      {!currentLM && (
        <div className="card flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4 opacity-30">📚</div>
            <h2 className="text-lg font-bold text-white mb-2">Select a module</h2>
            <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
              Choose a subject then a Learning Module to access your {ASSET_TEMPLATES.length} resources.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(ASSET_CATEGORIES).map(([key, cat]) => (
                <span key={key} className="text-[11px] px-2.5 py-1 rounded-full border border-white/[0.06] text-slate-400">
                  {cat.icon} {cat.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ LM CONTENT ═══ */}
      {currentLM && (
        <>
          {/* LM Info header */}
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded text-white"
                    style={{ background: TOPIC_COLORS[currentLM.topic] }}>
                    {currentLM.topic}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-semibold">{currentLM.lmCode}</span>
                  <span className="text-[11px] text-slate-600">Vol. {currentLM.volume}</span>
                </div>
                <h2 className="text-lg font-bold text-white mb-2">{currentLM.title}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded"
                    style={{ background: PRIORITY_STYLES[currentLM.priority].bg, color: PRIORITY_STYLES[currentLM.priority].text }}>
                    {currentLM.priority}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded"
                    style={{ background: STATUS_STYLES[currentLM.studyStatus].bg, color: STATUS_STYLES[currentLM.studyStatus].text }}>
                    {currentLM.studyStatus}
                  </span>
                  <span className="text-[11px] text-slate-500">{currentLM.losCount} LOS</span>
                  <span className="text-[11px] text-slate-500">{TOPIC_WEIGHTS[currentLM.topic]} exam</span>
                  {(() => {
                    const mastery = lmProgress[`${currentLM.topic}/${currentLM.lmCode}`] ?? 0
                    const roi = roiFor(currentLM.topic, currentLM.lmCode)
                    return (
                      <>
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded"
                              style={{
                                background: mastery >= 70 ? 'rgba(34,197,94,.10)' : mastery >= 40 ? 'rgba(245,158,11,.10)' : 'rgba(255,255,255,.04)',
                                color:      mastery >= 70 ? '#4ade80'             : mastery >= 40 ? '#fbbf24'             : '#94a3b8',
                              }}
                              title="Current mastery on this LM">
                          {mastery > 0 ? `${Math.round(mastery)}% mastery` : 'unseen'}
                        </span>
                        {roi > 0 && (
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(0,224,184,.10)', color: '#00e0b8' }}
                                title="Estimated mastery gain after a focused 60-min session">
                            Est. ROI +{roi}%
                          </span>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Inline progress bar (Generate All async job) */}
              {jobState && jobState.topic === currentLM.topic && jobState.lm_code === currentLM.lmCode && (() => {
                // step is the 1-based index of the step CURRENTLY in flight
                // (1..total_steps). Progress = how many full steps are done plus
                // the in-flight step's sub_pct.
                const pct = jobState.status === 'done'
                  ? 100
                  : Math.max(0, Math.min(100, ((jobState.step - 1) + (jobState.sub_pct || 0) / 100) / jobState.total_steps * 100))
                const isError = jobState.status === 'error'
                const isDone = jobState.status === 'done'
                const barColor = isError ? 'bg-red-500' : 'bg-emerald-500'
                const titleSuffix = isError ? 'Échec' : isDone ? 'Terminé' : 'En cours'
                return (
                  <div className="flex-1 min-w-0 max-w-[480px] self-stretch flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-white">
                        {isError ? (
                          <span className="text-red-400 leading-none">✕</span>
                        ) : isDone ? (
                          <span className="text-emerald-400 leading-none">✓</span>
                        ) : (
                          <svg className="w-3.5 h-3.5 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        )}
                        Generate All — {titleSuffix}
                      </div>
                      <span className="text-[11px] tabular-nums text-slate-400">{jobState.step}/{jobState.total_steps}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-700 overflow-hidden mb-1.5">
                      <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isError ? 'text-red-400' : 'text-slate-300'}>{jobState.label || '—'}</span>
                      <span className="text-slate-500 tabular-nums">{pct.toFixed(0)}%</span>
                    </div>
                    {jobState.sub_message && !isError && (
                      <div className="mt-1 text-[10px] text-slate-500">↳ {jobState.sub_message}</div>
                    )}
                    {isError && jobState.error && (
                      <div className="mt-1.5 text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-1 break-words">
                        {jobState.error}
                      </div>
                    )}
                    {/* Action buttons: Cancel while running, Reprendre after error */}
                    {(jobState.status === 'running' || isError) && (
                      <div className="mt-2 flex items-center gap-2">
                        {jobState.status === 'running' && (
                          <button
                            onClick={() => cancelJob(jobState.job_id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30 transition-all"
                            title="Annuler la génération en cours"
                          >
                            Annuler
                          </button>
                        )}
                        {isError && (
                          <button
                            onClick={() => {
                              setJobState(null)
                              generateAllAssets(currentLM.topic, currentLM.lmCode, currentLM.title)
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
                            title="Relancer (les assets déjà générés sont conservés)"
                          >
                            Reprendre
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Stats + Action Buttons */}
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-white tabular-nums">{ASSET_TEMPLATES.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Total</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-400 tabular-nums">{availableCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Ready</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-400 tabular-nums">{missingCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Missing</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Generate All button */}
                  <button
                    onClick={() => {
                      if (currentLM) generateAllAssets(currentLM.topic, currentLM.lmCode, currentLM.title)
                    }}
                    disabled={generatingAll || availableCount === ASSET_TEMPLATES.length}
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all shadow-lg ${
                      generatingAll
                        ? 'bg-emerald-500/20 text-emerald-400 animate-pulse cursor-wait shadow-emerald-500/10'
                        : availableCount === ASSET_TEMPLATES.length
                          ? 'bg-emerald-500/10 text-emerald-600 cursor-not-allowed opacity-50'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    }`}
                  >
                    {generatingAll ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate All
                      </>
                    )}
                  </button>
                  {/* Download All button */}
                  <button
                    onClick={() => {
                      if (!currentLM) return
                      const url = `${API_BASE}/api/content/generated/${currentLM.topic}/${currentLM.lmCode}/download-all`
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${currentLM.topic}-${currentLM.lmCode}-content.zip`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                    }}
                    disabled={availableCount === 0}
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all shadow-lg ${
                      availableCount === 0
                        ? 'bg-purple-500/10 text-purple-700 cursor-not-allowed opacity-50'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download All
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {['All', ...Object.keys(ASSET_CATEGORIES)].map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  categoryFilter === cat
                    ? 'bg-accent-blue text-white'
                    : 'bg-surface-800 text-slate-400 hover:text-slate-300 hover:bg-surface-700'
                }`}>
                {cat === 'All' ? 'All' : `${ASSET_CATEGORIES[cat]?.icon} ${ASSET_CATEGORIES[cat]?.label}`}
              </button>
            ))}
          </div>

          {/* Asset groups */}
          {Object.entries(groupedAssets).map(([category, assets]) => {
            const catInfo = ASSET_CATEGORIES[category]
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">{catInfo?.icon}</span>
                  <span className="text-xs font-bold text-white">{catInfo?.label || category}</span>
                  <span className="text-[11px] text-slate-500">{assets.length} items</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assets.map(asset => {
                    const astStyle = ASSET_STATUS_STYLES[asset.status]
                    return (
                      <div key={asset.type}
                        className={`rounded-2xl border p-4 transition-all group ${
                          asset.status === 'available'
                            ? 'border-white/[0.06] bg-surface-800 hover:bg-surface-700 hover:border-white/[0.1]'
                            : asset.status === 'outdated'
                              ? 'border-amber-500/20 bg-amber-500/[0.03]'
                              : 'border-white/[0.04] bg-surface-800/50 opacity-70 hover:opacity-90'
                        }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{FORMAT_ICONS[asset.format] || '📄'}</span>
                            <div>
                              <div className="text-sm font-semibold text-white leading-tight">{asset.title}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{asset.format} · {asset.size}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                            style={{ background: astStyle.bg, color: astStyle.text }}>
                            {astStyle.label}
                          </span>
                        </div>
                        {/* Audio player for MP3 */}
                        {asset.type === 'audio_mp3' && asset.status === 'available' && asset.download_url && (
                          <div className="mb-3">
                            <audio
                              controls
                              className="w-full h-8 rounded-lg"
                              style={{ filter: 'invert(1) hue-rotate(180deg) brightness(0.8)' }}
                              src={asset.download_url}
                              onPlay={() => setPlayingAudio(asset.download_url)}
                              onPause={() => setPlayingAudio(null)}
                              onEnded={() => setPlayingAudio(null)}
                            />
                          </div>
                        )}
                        {/* ── In-flight progress bar (Generate All) ── */}
                        {(() => {
                          const stepIdx = TYPE_TO_PIPELINE_STEP[asset.type]
                          if (!jobState || jobState.status !== 'running' || stepIdx === undefined) return null
                          if (jobState.topic !== currentLM.topic || jobState.lm_code !== currentLM.lmCode) return null
                          const isInFlight = (jobState.phase === 'assets' && jobState.step === stepIdx)
                            || (jobState.phase === 'tts' && stepIdx === 19)
                          if (!isInFlight) return null
                          const sub = jobState.sub_pct || 0
                          const w = Math.max(sub, 25)
                          return (
                            <div className="mb-3">
                              <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 animate-pulse transition-all duration-500"
                                  style={{ width: `${w}%` }}
                                />
                              </div>
                              {jobState.sub_message && (
                                <div className="mt-1 text-[10px] text-emerald-400/70 truncate">{jobState.sub_message}</div>
                              )}
                            </div>
                          )
                        })()}
                        {/* ── Action icons row ── */}
                        <div className="flex items-center justify-end gap-3 mt-1 pt-3 border-t border-white/[0.04]">
                          {asset.status === 'available' ? (
                            <>
                              {/* Download */}
                              <button
                                onClick={() => {
                                  if (!asset.download_url) return
                                  const a = document.createElement('a')
                                  a.href = asset.download_url
                                  a.download = asset.filename || asset.title
                                  document.body.appendChild(a)
                                  a.click()
                                  document.body.removeChild(a)
                                }}
                                className="p-2 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/15 transition-all"
                                title="Download"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </button>
                              {/* Import / Replace */}
                              <label
                                className="p-2 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/15 transition-all cursor-pointer"
                                title="Import / Replace"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0 && currentLM) handleUpload(e.target.files)
                                    e.target.value = ''
                                  }}
                                />
                              </label>
                              {/* Trash */}
                              <button
                                onClick={() => {
                                  if (currentLM && asset.filename)
                                    trashAsset(currentLM.topic, currentLM.lmCode, asset.filename!)
                                }}
                                disabled={trashing === asset.filename}
                                className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-all"
                                title="Delete"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Generate */}
                              {asset.type === 'audio_mp3' ? (
                                <button
                                  onClick={() => {
                                    if (currentLM && !generatingAudio)
                                      generateAudio(currentLM.topic, currentLM.lmCode, currentLM.title)
                                  }}
                                  disabled={generatingAudio}
                                  className={`p-2 rounded-lg transition-all ${
                                    generatingAudio
                                      ? 'text-emerald-400 animate-pulse'
                                      : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15'
                                  }`}
                                  title="Generate Audio"
                                >
                                  {generatingAudio ? (
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728" />
                                    </svg>
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (currentLM && !generating)
                                      generateAsset(currentLM.topic, currentLM.lmCode, currentLM.title, asset.type)
                                  }}
                                  disabled={!!generating}
                                  className={`p-2 rounded-lg transition-all ${
                                    generating === asset.type
                                      ? 'text-purple-400 animate-pulse'
                                      : generating
                                        ? 'text-slate-700 cursor-not-allowed'
                                        : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/15'
                                  }`}
                                  title="Generate"
                                >
                                  {generating === asset.type ? (
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                  )}
                                </button>
                              )}
                              {/* Import */}
                              <label
                                className="p-2 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/15 transition-all cursor-pointer"
                                title="Import"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0 && currentLM) handleUpload(e.target.files)
                                    e.target.value = ''
                                  }}
                                />
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {filteredAssets.length === 0 && (
            <div className="card text-center py-8 text-slate-500 text-sm">
              No assets match the filter
            </div>
          )}
        </>
      )}

      {/* ═══ TRASH PANEL ═══ */}
      {showTrash && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h2 className="text-sm font-bold text-white">Trash</h2>
              <span className="text-[11px] text-slate-500">{trashItems.length} items</span>
            </div>
            {trashItems.length > 0 && (
              <button
                onClick={emptyTrash}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Empty Trash
              </button>
            )}
          </div>
          {trashItems.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Trash is empty</p>
          ) : (
            <div className="space-y-3">
              {trashItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-surface-800 border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <span className="text-lg opacity-50">📄</span>
                    <div>
                      <div className="text-sm font-medium text-slate-300">{item.filename}</div>
                      <div className="text-[11px] text-slate-600">{item.topic}/{item.lm_code} — {item.size_kb} KB — trashed {item.trashed_at}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => restoreFromTrash(item.topic, item.lm_code, item.filename)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ FORMULA NAVIGATOR ═══ */}
      <div className="card">
        <FormulaNavigator />
      </div>

      {/* Content Manager Modal */}
      <ContentManager open={cmOpen} onClose={() => setCmOpen(false)} />
    </div>
  )
}
