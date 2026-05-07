'use client'

import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    // Simulate sync
    await new Promise(r => setTimeout(r, 1500))
    setLastSync(new Date().toLocaleString())
    setSyncing(false)
  }

  const handleExport = () => {
    const data = {
      topic_progress: localStorage.getItem('wingman_topic_progress'),
      onboarding: localStorage.getItem('wingman_onboarding'),
      study_plan: localStorage.getItem('wingman_study_plan'),
      exported_at: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `wingman-export-${new Date().toISOString().split('T')[0]}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Sync & Data</h1>

      <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5">
        <h2 className="text-sm font-bold text-white mb-4">Cloud Sync</h2>
        <p className="text-[12px] text-slate-500 mb-4">Sync your progress and settings with the server.</p>
        <div className="flex items-center gap-3">
          <button onClick={handleSync} disabled={syncing}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 transition-colors">
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
          {lastSync && <span className="text-[11px] text-slate-500">Last sync: {lastSync}</span>}
        </div>
      </div>

      <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5">
        <h2 className="text-sm font-bold text-white mb-4">Export Data</h2>
        <p className="text-[12px] text-slate-500 mb-4">Download your progress and settings as a JSON file.</p>
        <button onClick={handleExport}
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06] transition-colors">
          Export JSON
        </button>
      </div>

      <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5">
        <h2 className="text-sm font-bold text-white mb-3">API Connection</h2>
        <div className="space-y-2 text-[12px]">
          <div className="flex justify-between"><span className="text-slate-500">Backend</span><span className="text-emerald-400">{API_URL}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Database</span><span className="text-emerald-400">PostgreSQL 16 (native)</span></div>
          <div className="flex justify-between"><span className="text-slate-500">AI Provider</span><span className="text-emerald-400">Anthropic Claude</span></div>
          <div className="flex justify-between"><span className="text-slate-500">TTS</span><span className="text-emerald-400">Edge TTS</span></div>
        </div>
      </div>
    </div>
  )
}
