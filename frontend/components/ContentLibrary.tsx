'use client'

import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Asset {
  id: number
  type: string
  title: string
  url: string
}

interface LibraryItem {
  lm_id: number
  lm_code: string
  lm_title: string
  topic_code: string
  assets: Asset[]
}

const topicColors: Record<string, string> = {
  ETH: 'bg-purple-900/40 text-purple-400',
  QM: 'bg-blue-900/40 text-blue-400',
  ECO: 'bg-green-900/40 text-green-400',
  FRA: 'bg-amber-900/40 text-amber-400',
  CF: 'bg-red-900/40 text-red-400',
  EQ: 'bg-cyan-900/40 text-cyan-400',
  FI: 'bg-orange-900/40 text-orange-400',
  DER: 'bg-pink-900/40 text-pink-400',
  AI: 'bg-violet-900/40 text-violet-400',
  PM: 'bg-teal-900/40 text-teal-400',
}

interface ContentLibraryProps {
  items: LibraryItem[]
  onSelectAsset: (asset: Asset) => void
  onGenerate: (lmId: number) => void
}

export default function ContentLibrary({ items, onSelectAsset, onGenerate }: ContentLibraryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const hasPdf = item.assets.some(a => a.type === 'pdf')
        const hasAudio = item.assets.some(a => a.type === 'summary' || a.type === 'video')

        return (
          <div key={item.lm_code} className="card hover:border-accent-blue transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs font-mono text-accent-blue">{item.lm_code}</span>
                <h3 className="text-sm text-slate-200 mt-1">{item.lm_title}</h3>
              </div>
              <span className={`badge text-[10px] ${topicColors[item.topic_code] || 'bg-slate-700 text-slate-400'}`}>
                {item.topic_code}
              </span>
            </div>

            {/* Asset badges */}
            <div className="flex gap-2 mb-3">
              {hasPdf && <span className="badge-green text-[10px]">PDF</span>}
              {hasAudio && <span className="badge-amber text-[10px]">MP3</span>}
              {!hasPdf && !hasAudio && (
                <span className="badge text-[10px] bg-slate-700 text-slate-500">No content</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {item.assets.map((a) => (
                <button key={a.id} onClick={() => onSelectAsset(a)}
                  className="btn-ghost text-xs flex-1">
                  {a.type === 'pdf' ? 'Voir PDF' : 'Écouter'}
                </button>
              ))}
              {!hasPdf && (
                <button onClick={() => onGenerate(item.lm_id)} className="btn-primary text-xs flex-1">
                  Générer
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
