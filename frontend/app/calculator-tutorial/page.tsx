'use client'

import { useState, useEffect } from 'react'

const SETUP_LIST_URL = '/proxy-api/content/setup'
// `encodeURIComponent` so filenames with spaces or `+` (e.g. "BA 2 + Statistical.pdf")
// reach the backend correctly. The proxy passes through whatever Next.js sends.
const SETUP_FILE_URL = (name: string) => `/proxy-api/content/setup/${encodeURIComponent(name)}`

interface SetupFile { filename: string; size_kb: number; ext: string }

function humanizeName(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
  return base.charAt(0).toUpperCase() + base.slice(1)
}

function fmtSize(kb: number): string {
  return kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`
}

export default function CalculatorTutorialPage() {
  const [files, setFiles] = useState<SetupFile[] | null>(null)
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(SETUP_LIST_URL)
      .then(r => r.ok ? r.json() : { files: [] })
      .then(d => {
        if (cancelled) return
        const list: SetupFile[] = d.files || []
        setFiles(list)
        if (list.length > 0) setActive(list[0].filename)
      })
      .catch(() => { if (!cancelled) setFiles([]) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-surface-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-[0.18em] text-amber-400 font-semibold mb-2">Training</div>
          <h1 className="text-2xl font-bold mb-2">Calculator Tutorial</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
            Setup et tutoriels pour la <strong className="text-white">BA II Plus</strong> —
            menus TVM, CF, STAT, BOND, ICONV, conventions Wingman.
          </p>
        </div>

        {files === null && (
          <div className="card flex items-center justify-center py-16">
            <div className="text-[12px] text-slate-500">Chargement…</div>
          </div>
        )}

        {files && files.length === 0 && (
          <div className="card flex items-center justify-center py-16">
            <div className="text-center max-w-md">
              <div className="text-5xl mb-4 opacity-30">📟</div>
              <h2 className="text-lg font-bold text-white mb-2">Aucun tutoriel pour l&apos;instant</h2>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                Drop tes PDFs dans <code className="px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-300 text-[11px]">backend/setup_assets/</code>.
                Ils apparaîtront ici automatiquement (pas de rebuild nécessaire).
              </p>
            </div>
          </div>
        )}

        {files && files.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
            {/* Sidebar list */}
            <div className="card p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-2 pb-2">
                Tutoriels ({files.length})
              </div>
              <div className="flex flex-col gap-1">
                {files.map(f => (
                  <button
                    key={f.filename}
                    onClick={() => setActive(f.filename)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      active === f.filename
                        ? 'bg-amber-500/15 border border-amber-500/30'
                        : 'hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <span className={active === f.filename ? 'text-amber-300' : 'text-slate-400'}>📄</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[12px] font-semibold truncate ${active === f.filename ? 'text-amber-100' : 'text-slate-200'}`}>
                        {humanizeName(f.filename)}
                      </div>
                      <div className="text-[10px] text-slate-500 tabular-nums">{fmtSize(f.size_kb)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Viewer */}
            <div className="card p-4">
              {active && (
                <>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/[0.06]">
                    <div className="font-semibold text-sm text-white">{humanizeName(active)}</div>
                    <div className="flex gap-2">
                      <a
                        href={SETUP_FILE_URL(active)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                      >
                        Nouvel onglet ↗
                      </a>
                      <a
                        href={SETUP_FILE_URL(active)}
                        download
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                      >
                        Télécharger
                      </a>
                    </div>
                  </div>
                  <iframe
                    src={SETUP_FILE_URL(active)}
                    title={humanizeName(active)}
                    className="w-full rounded-xl border border-white/[0.06] bg-white"
                    style={{ height: 'calc(100vh - 280px)', minHeight: 600 }}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
