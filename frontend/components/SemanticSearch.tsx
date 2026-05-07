'use client'

import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface SearchResult {
  asset_id: number
  title: string
  lm_code: string
  excerpt: string
}

export default function SemanticSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/content/search`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), top_k: 5 }),
      })
      setResults(await res.json())
    } catch { setResults([]) }
    setLoading(false)
  }

  return (
    <div className="card">
      <h2 className="card-header">Recherche sémantique</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Chercher dans le contenu CFA..."
          className="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-white
                     placeholder-slate-500 focus:outline-none focus:border-accent-blue"
        />
        <button onClick={handleSearch} disabled={loading} className="btn-primary">
          {loading ? '...' : 'Rechercher'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r, i) => (
            <div key={i} className="bg-surface-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="badge text-[10px] bg-blue-900/40 text-blue-400">{r.lm_code}</span>
                <span className="text-sm text-slate-200">{r.title}</span>
              </div>
              <p className="text-xs text-slate-400">{r.excerpt}</p>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query && !loading && (
        <p className="text-xs text-slate-500 text-center">No results</p>
      )}
    </div>
  )
}
