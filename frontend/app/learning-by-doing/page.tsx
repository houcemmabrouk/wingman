'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  TOPICS,
  TOPIC_ORDER,
  TOPIC_COLORS,
  EXAM_WEIGHT_RANGES,
  LM_DATA,
} from '@/lib/lm-data'

const FICHE_FILENAME = 'level1_active_discovery.pdf'

function ficheUrl(topic: string, lmCode: string): string {
  // Same-origin via Next.js rewrite (next.config.js → /proxy-api/* →
  // backend /api/*). Required because Edge blocks cross-origin PDF iframes.
  return `/proxy-api/content/generated/${topic}/${lmCode}/${FICHE_FILENAME}`
}

function FicheViewer({
  topic, lmCode, lmTitle, levelLabel,
}: { topic: string; lmCode: string; lmTitle: string; levelLabel: string }) {
  const url = ficheUrl(topic, lmCode)
  const [status, setStatus] = useState<'checking' | 'ready' | 'missing'>('checking')

  useEffect(() => {
    setStatus('checking')
    let cancelled = false
    fetch(url, { method: 'HEAD' })
      .then(res => { if (!cancelled) setStatus(res.ok ? 'ready' : 'missing') })
      .catch(() => { if (!cancelled) setStatus('missing') })
    return () => { cancelled = true }
  }, [url])

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5 pb-5 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
              style={{ background: TOPIC_COLORS[topic] }}
            >
              {topic}
            </span>
            <span className="text-xs font-mono text-slate-400 font-semibold">{lmCode}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {levelLabel}
            </span>
          </div>
          <h2 className="text-base font-bold text-white">{lmTitle}</h2>
        </div>
        {status === 'ready' && (
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              Ouvrir nouvel onglet ↗
            </a>
            <a
              href={url}
              download
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Télécharger
            </a>
          </div>
        )}
      </div>

      {status === 'checking' && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
          <div className="text-[12px] text-slate-500">Chargement…</div>
        </div>
      )}
      {status === 'missing' && (
        <div className="rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-10 text-center">
          <div className="text-4xl mb-3 opacity-40">⚙️</div>
          <div className="text-sm text-slate-300 font-semibold mb-1">Fiche pas encore générée</div>
          <div className="text-[12px] text-slate-500 leading-relaxed max-w-md mx-auto">
            Aucune fiche Level 1 n&apos;existe pour <span className="text-slate-300">{topic}/{lmCode}</span>.
            La génération à la demande sera branchée prochainement.
          </div>
        </div>
      )}
      {status === 'ready' && (
        <iframe
          src={url}
          title={`${topic}/${lmCode} — ${levelLabel}`}
          className="w-full rounded-xl border border-white/[0.06] bg-white"
          style={{ height: 'calc(100vh - 300px)', minHeight: 600 }}
        />
      )}
    </div>
  )
}

const LEVELS = [
  { id: 'L1_DISCOVERY', label: 'Level 1 — Active Discovery', enabled: true },
  // Levels 2+ to be defined later — kept here as a marker so the dropdown
  // structure is ready when the user fleshes them out.
] as const

const SELECT_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748b' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`

export default function LearningByDoingPage() {
  const [topic, setTopic] = useState<string>('')
  const [lmKey, setLmKey] = useState<string>('')   // `${topic}/${lmCode}`
  const [level, setLevel] = useState<string>('')

  // Reset LM when topic changes (the previously selected LM may not exist
  // for the new topic).
  const handleTopicChange = (t: string) => {
    setTopic(t)
    setLmKey('')
  }

  const topicLMs = useMemo(() => {
    if (!topic) return []
    return LM_DATA.filter(([t]) => t === topic).map(([t, lm, title]) => ({ topic: t, lmCode: lm, title }))
  }, [topic])

  const allSelected = topic && lmKey && level
  const [, lmCode] = lmKey ? lmKey.split('/') : ['', '']
  const lmTitle = lmKey ? LM_DATA.find(([t, lm]) => `${t}/${lm}` === lmKey)?.[2] : ''
  const levelLabel = LEVELS.find(l => l.id === level)?.label || ''

  return (
    <div className="min-h-screen bg-surface-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ═══ HEADER ═══ */}
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-[0.18em] text-amber-400 font-semibold mb-2">Training</div>
          <h1 className="text-2xl font-bold mb-2">Learning by Doing</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
            Sélectionne un Topic, un Learning Module et un Level pour accéder à
            la fiche d&apos;exercices guidés correspondante.
          </p>
        </div>

        {/* ═══ SELECTORS (3 dropdowns) ═══ */}
        <div className="card p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Topic */}
            <div className="flex-1">
              <label className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider mb-1.5 block">Topic</label>
              <select
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                className="w-full px-3 py-3 rounded-2xl bg-surface-800 border border-surface-600 text-sm text-white outline-none focus:border-accent-blue transition-colors appearance-none cursor-pointer"
                style={{ backgroundImage: SELECT_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                <option value="" className="bg-surface-900">-- Select a topic --</option>
                {TOPIC_ORDER.map(t => (
                  <option key={t} value={t} className="bg-surface-900">
                    {t} — {TOPICS[t]} ({EXAM_WEIGHT_RANGES[t]})
                  </option>
                ))}
              </select>
            </div>

            {/* Learning Module */}
            <div className="flex-[1.5]">
              <label className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider mb-1.5 block">Learning Module</label>
              <select
                value={lmKey}
                onChange={(e) => setLmKey(e.target.value)}
                disabled={!topic}
                className="w-full px-3 py-3 rounded-2xl bg-surface-800 border border-surface-600 text-sm text-white outline-none focus:border-accent-blue transition-colors appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundImage: SELECT_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                <option value="" className="bg-surface-900">-- Select a LM --</option>
                {topicLMs.map(lm => (
                  <option key={`${lm.topic}/${lm.lmCode}`} value={`${lm.topic}/${lm.lmCode}`} className="bg-surface-900">
                    {lm.lmCode} — {lm.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div className="flex-1">
              <label className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider mb-1.5 block">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                disabled={!lmKey}
                className="w-full px-3 py-3 rounded-2xl bg-surface-800 border border-surface-600 text-sm text-white outline-none focus:border-accent-blue transition-colors appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundImage: SELECT_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                <option value="" className="bg-surface-900">-- Select a level --</option>
                {LEVELS.map(l => (
                  <option key={l.id} value={l.id} disabled={!l.enabled} className="bg-surface-900">
                    {l.label}{!l.enabled ? '  (à venir)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic pills (quick switch) */}
          {topic && (
            <div className="flex flex-wrap gap-2 mt-4">
              {TOPIC_ORDER.map(t => (
                <button
                  key={t}
                  onClick={() => handleTopicChange(t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                    t === topic
                      ? 'text-white border-transparent'
                      : 'text-slate-500 border-white/[0.06] hover:text-slate-300 hover:border-white/[0.1]'
                  }`}
                  style={t === topic ? { background: TOPIC_COLORS[t], borderColor: TOPIC_COLORS[t] } : {}}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ═══ CONTENT AREA ═══ */}
        {!allSelected ? (
          <div className="card flex items-center justify-center py-16">
            <div className="text-center max-w-md">
              <div className="text-5xl mb-4 opacity-30">🧪</div>
              <h2 className="text-lg font-bold text-white mb-2">Tous les filtres requis</h2>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                Sélectionne un <span className="text-slate-300">Topic</span>,
                un <span className="text-slate-300">Learning Module</span> et
                un <span className="text-slate-300">Level</span> pour
                déverrouiller la fiche.
              </p>
            </div>
          </div>
        ) : (
          <FicheViewer topic={topic} lmCode={lmCode} lmTitle={lmTitle || ''} levelLabel={levelLabel} />
        )}

      </div>
    </div>
  )
}
