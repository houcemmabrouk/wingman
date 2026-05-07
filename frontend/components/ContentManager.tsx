'use client'

import { useState, useEffect, useMemo } from 'react'
import { TOPICS, TOPIC_COLORS, TOPIC_ORDER } from '@/lib/lm-data'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Asset type labels
const ASSET_TYPES: { key: string; label: string; category: string }[] = [
  { key: '01_summary_notes', label: 'Summary Notes', category: 'Core Learning' },
  { key: '02_synthesis', label: 'Synthesis', category: 'Core Learning' },
  { key: '03_los_sheet', label: 'LOS Sheet', category: 'Core Learning' },
  { key: '04_exam_traps', label: 'Exam Traps', category: 'Exam Prep' },
  { key: '05_concept_on_concept', label: 'Concept on Concept', category: 'Exam Prep' },
  { key: '06_decision_tree', label: 'Decision Tree', category: 'Exam Prep' },
  { key: '07_essential_sheet', label: 'Essential Sheet', category: 'Exam Prep' },
  { key: '08_formula_sheet', label: 'Formula Sheet', category: 'Core Learning' },
  { key: '09_reading_summary', label: 'Reading Summary', category: 'Core Learning' },
  { key: '10_tds_sheet', label: 'TDS Sheet', category: 'Exam Prep' },
  { key: '11_blank_recall', label: 'Blank Recall', category: 'Active Recall' },
  { key: '12_flashcards', label: 'Flashcards', category: 'Active Recall' },
  { key: '13_mock_pack', label: 'Mock Pack', category: 'Active Recall' },
  { key: '14_audio_script', label: 'Audio Script', category: 'Audio' },
  { key: '00_full_course', label: 'Full Course Audio (MP3)', category: 'Audio' },
  { key: '00_full_course_script', label: 'Full Course (PDF)', category: 'Audio' },
  { key: '15_knowledge_audit', label: 'Knowledge Audit', category: 'Diagnostics' },
  { key: '16_weakness_pool', label: 'Weakness Pool', category: 'Diagnostics' },
  { key: '17_learning_map', label: 'Learning Map', category: 'Diagnostics' },
]

interface ModuleInfo {
  topic: string
  lm_code: string
  title: string
  asset_count: number
  total_size_kb: number
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

/** Fetch the URL, save the response as a blob with the given filename.
 *  Avoids the cross-origin `<a download>` quirk (Chrome ignores the download
 *  attribute for cross-origin URLs unless the server sends Content-Disposition,
 *  which it does — but the browser still navigates the tab while waiting,
 *  hiding the download from the user during slow ZIP generation).
 *  Returns true on success. */
async function triggerDownload(url: string, filename: string): Promise<boolean> {
  try {
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) {
      console.error('[download] HTTP', res.status, url)
      return false
    }
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000)
    return true
  } catch (e) {
    console.error('[download] failed', url, e)
    return false
  }
}

export default function ContentManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [modules, setModules] = useState<ModuleInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'modules' | 'fiches'>('modules')
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null)

  /** Wrap a download in a per-button loading state. The button whose URL
   *  matches `downloadingUrl` shows a spinner; all other download buttons are
   *  disabled while one is in flight (so we don't saturate the single uvicorn
   *  worker with parallel ZIP requests). */
  const startDownload = async (url: string, filename: string) => {
    if (downloadingUrl) return
    setDownloadingUrl(url)
    try {
      await triggerDownload(url, filename)
    } finally {
      setDownloadingUrl(null)
    }
  }

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`${API_BASE}/api/content/generated`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(setModules)
      .catch(() => setModules([]))
      .finally(() => setLoading(false))
  }, [open])

  // Group modules by topic
  const byTopic = useMemo(() => {
    const map: Record<string, ModuleInfo[]> = {}
    modules.forEach(m => {
      if (!map[m.topic]) map[m.topic] = []
      map[m.topic].push(m)
    })
    return map
  }, [modules])

  const totalAssets = modules.reduce((a, m) => a + m.asset_count, 0)
  const totalSizeKB = modules.reduce((a, m) => a + m.total_size_kb, 0)
  const totalSizeMB = (totalSizeKB / 1024).toFixed(1)

  // Topics that have content
  const availableTopics = TOPIC_ORDER.filter(t => byTopic[t]?.length)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-surface-900 border border-surface-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden mx-4">
        {/* Header */}
        <div className="p-5 border-b border-surface-600 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Content Manager
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Download all your content to work offline</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 text-center">
              <div>
                <div className="text-xl font-bold text-white tabular-nums">{modules.length}</div>
                <div className="text-[9px] text-slate-500 uppercase">Modules</div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-400 tabular-nums">{totalAssets}</div>
                <div className="text-[9px] text-slate-500 uppercase">Assets</div>
              </div>
              <div>
                <div className="text-xl font-bold text-purple-400 tabular-nums">{totalSizeMB} MB</div>
                <div className="text-[9px] text-slate-500 uppercase">Total</div>
              </div>
            </div>
            <div className="ml-auto">
              {(() => {
                const url = `${API_BASE}/api/content/download-everything`
                const isDl = downloadingUrl === url
                return (
                  <button
                    onClick={() => startDownload(url, 'wingman-all-content.zip')}
                    disabled={totalAssets === 0 || (downloadingUrl !== null && !isDl)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                  >
                    {isDl
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <DownloadIcon />}
                    {isDl ? 'Downloading…' : 'Download all'}
                  </button>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-600 shrink-0">
          <button
            onClick={() => setTab('modules')}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors ${
              tab === 'modules' ? 'text-white border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            By Module
          </button>
          <button
            onClick={() => setTab('fiches')}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors ${
              tab === 'fiches' ? 'text-white border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            By Asset Type
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl opacity-30 mb-3">📦</div>
              <p className="text-sm text-slate-500">No content generated yet.</p>
              <p className="text-xs text-slate-600 mt-1">Generate assets from the Library.</p>
            </div>
          ) : tab === 'modules' ? (
            /* ── PAR MODULE ── */
            <div className="space-y-4">
              {availableTopics.map(topic => (
                <div key={topic}>
                  {/* Topic header with download all for topic */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: TOPIC_COLORS[topic] }} />
                      <span className="text-sm font-bold text-white">{topic}</span>
                      <span className="text-[10px] text-slate-500">{TOPICS[topic]}</span>
                      <span className="text-[10px] text-slate-600">
                        {byTopic[topic].length} module{byTopic[topic].length > 1 ? 's' : ''}
                      </span>
                    </div>
                    {(() => {
                      const url = `${API_BASE}/api/content/download-by-topic/${topic}`
                      const isDl = downloadingUrl === url
                      return (
                        <button
                          onClick={() => startDownload(url, `wingman-${topic}-content.zip`)}
                          disabled={downloadingUrl !== null && !isDl}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isDl
                            ? <span className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                            : <DownloadIcon className="w-3 h-3" />}
                          {isDl ? 'Downloading…' : `All ${topic}`}
                        </button>
                      )
                    })()}
                  </div>

                  {/* LMs */}
                  <div className="space-y-1.5 ml-4">
                    {byTopic[topic].map(m => (
                      <div
                        key={`${m.topic}-${m.lm_code}`}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface-800 border border-surface-600 hover:border-surface-500 transition-all group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold" style={{ color: TOPIC_COLORS[m.topic] }}>
                              {m.topic}/{m.lm_code}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
                              {m.asset_count} assets
                            </span>
                            <span className="text-[10px] text-slate-600">{m.total_size_kb} KB</span>
                          </div>
                          <div className="text-xs text-slate-300 mt-0.5 truncate">{m.title}</div>
                        </div>
                        {(() => {
                          const url = `${API_BASE}/api/content/generated/${m.topic}/${m.lm_code}/download-all`
                          const isDl = downloadingUrl === url
                          return (
                            <button
                              onClick={() => startDownload(url, `${m.topic}-${m.lm_code}-content.zip`)}
                              disabled={downloadingUrl !== null && !isDl}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-white/[0.04] text-slate-300 hover:bg-purple-600 hover:text-white transition-colors shrink-0 ml-3 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isDl
                                ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <DownloadIcon className="w-3.5 h-3.5" />}
                              {isDl ? '…' : 'ZIP'}
                            </button>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── PAR TYPE DE FICHE ── */
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 mb-3">
                Download all assets of the same type across all generated modules.
              </p>
              {ASSET_TYPES.map(at => {
                const catColors: Record<string, string> = {
                  'Core Learning': '#3B82F6', 'Exam Prep': '#EF4444',
                  'Active Recall': '#8B5CF6', 'Audio': '#059669', 'Diagnostics': '#F59E0B',
                }
                return (
                  <div
                    key={at.key}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-800 border border-surface-600 hover:border-surface-500 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 rounded-full" style={{ background: catColors[at.category] || '#6B7280' }} />
                      <div>
                        <div className="text-sm font-semibold text-white">{at.label}</div>
                        <div className="text-[10px] text-slate-500">{at.category}</div>
                      </div>
                    </div>
                    {(() => {
                      const url = `${API_BASE}/api/content/download-by-type/${at.key}`
                      const isDl = downloadingUrl === url
                      return (
                        <button
                          onClick={() => startDownload(url, `wingman-${at.key}.zip`)}
                          disabled={downloadingUrl !== null && !isDl}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-white/[0.04] text-slate-300 hover:bg-purple-600 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isDl
                            ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <DownloadIcon className="w-3.5 h-3.5" />}
                          {isDl ? 'Downloading…' : 'Download all'}
                        </button>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-600 bg-surface-800/50 shrink-0">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>ZIP files: <code className="font-mono text-slate-400">TOPIC-LMxx-asset.ext</code> — self-describing, ready for offline study</span>
            <span>{availableTopics.length} topics generated</span>
          </div>
        </div>
      </div>
    </div>
  )
}
