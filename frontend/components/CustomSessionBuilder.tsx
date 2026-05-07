'use client'

import { useState } from 'react'
import { TOPIC_ORDER, TOPICS } from '@/lib/lm-data'
import type { ResourceItem } from '@/lib/sessionMatrix'

const ACCENT_BLUE = '#6c8cff'
const BLUE_LIGHT = '#a0b4ff'

const SESSION_MODES = [
  { key: 'discovery',  name: 'Discovery',          desc: 'First guided reading of the module' },
  { key: 'reinforce',  name: 'Reinforcement',      desc: 'Consolidate weak LOS' },
  { key: 'eval',       name: 'Targeted Assessment', desc: 'Quiz on critical points' },
  { key: 'audio',      name: 'Passive Audio',       desc: 'Listen with zero cognitive effort' },
  { key: 'flashcards', name: 'Flashcards',          desc: 'Active recall via SRS cards' },
]

interface Props {
  isOpen: boolean
  activeTab: 'custom' | 'lib'
  onTabChange: (tab: 'custom' | 'lib') => void
  onBuildCustom: (topics: string[], mode: string) => void
  onOpenResource: (resource: ResourceItem) => void
  relatedResources: ResourceItem[]
}

export default function CustomSessionBuilder({
  isOpen, activeTab, onTabChange, onBuildCustom, onOpenResource, relatedResources,
}: Props) {
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [selectedMode, setSelectedMode] = useState<string | null>(null)

  const toggleTopic = (code: string) => {
    setSelectedTopics(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  const canBuild = selectedTopics.size > 0 && selectedMode !== null

  return (
    <div
      className={isOpen ? 'flex-1 overflow-hidden flex flex-col' : 'shrink-0 overflow-hidden transition-all'}
      style={isOpen ? {
        background: '#07091a',
      } : {
        width: 0,
        background: '#07091a',
      }}
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="shrink-0 flex gap-1 p-3 pb-0">
          {(['custom', 'lib'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all"
              style={{
                background: activeTab === tab ? 'rgba(108,140,255,.11)' : 'transparent',
                color: activeTab === tab ? BLUE_LIGHT : 'rgba(255,255,255,.35)',
              }}
            >
              {tab === 'custom' ? 'Custom Session' : 'Related Resources'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'custom' ? (
            <>
              {/* Topics */}
              <div className="mb-5">
                <div className="text-[10px] font-semibold uppercase tracking-[.1em] mb-2.5" style={{ color: 'rgba(255,255,255,.3)' }}>
                  Subject(s)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {TOPIC_ORDER.map(code => {
                    const sel = selectedTopics.has(code)
                    return (
                      <button
                        key={code}
                        onClick={() => toggleTopic(code)}
                        className="px-3 py-2 rounded-lg text-[11px] font-semibold text-left transition-all"
                        style={{
                          background: sel ? 'rgba(108,140,255,.1)' : 'rgba(255,255,255,.03)',
                          border: `1px solid ${sel ? 'rgba(108,140,255,.28)' : 'rgba(255,255,255,.06)'}`,
                          color: sel ? BLUE_LIGHT : 'rgba(255,255,255,.4)',
                        }}
                      >
                        {TOPICS[code] ? `${code}` : code}
                        <div className="text-[9px] font-normal truncate" style={{ color: 'rgba(255,255,255,.2)' }}>
                          {TOPICS[code]?.split(' ').slice(0, 3).join(' ')}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Mode */}
              <div className="mb-5">
                <div className="text-[10px] font-semibold uppercase tracking-[.1em] mb-2.5" style={{ color: 'rgba(255,255,255,.3)' }}>
                  Session Mode
                </div>
                <div className="space-y-1.5">
                  {SESSION_MODES.map(m => {
                    const sel = selectedMode === m.key
                    return (
                      <button
                        key={m.key}
                        onClick={() => setSelectedMode(m.key)}
                        className="w-full text-left px-3 py-2.5 rounded-lg transition-all"
                        style={{
                          background: sel ? 'rgba(108,140,255,.1)' : 'rgba(255,255,255,.02)',
                          border: `1px solid ${sel ? 'rgba(108,140,255,.28)' : 'rgba(255,255,255,.04)'}`,
                        }}
                      >
                        <div className="text-[12px] font-semibold" style={{ color: sel ? BLUE_LIGHT : 'rgba(255,255,255,.5)' }}>
                          {m.name}
                        </div>
                        <div className="text-[10px]" style={{ color: 'rgba(255,255,255,.3)' }}>
                          {m.desc}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Build button */}
              <button
                onClick={() => canBuild && onBuildCustom([...selectedTopics], selectedMode!)}
                disabled={!canBuild}
                className="w-full py-3 rounded-xl text-[13px] font-bold text-white transition-all"
                style={{
                  background: ACCENT_BLUE,
                  opacity: canBuild ? 1 : 0.35,
                  cursor: canBuild ? 'pointer' : 'not-allowed',
                  height: 44,
                }}
              >
                Build This Session →
              </button>
            </>
          ) : (
            /* Resources tab */
            <div className="space-y-2">
              {relatedResources.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-[11px]" style={{ color: 'rgba(255,255,255,.25)' }}>
                    No related resources for this session
                  </div>
                </div>
              )}
              {relatedResources.map(r => (
                <button
                  key={r.id}
                  onClick={() => onOpenResource(r)}
                  className="w-full text-left p-3 rounded-lg transition-all hover:bg-white/[0.04]"
                  style={{ border: '1px solid rgba(255,255,255,.04)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
                    <span className="text-[12px] font-semibold text-white truncate">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.4)' }}>
                      {r.type}
                    </span>
                    <span className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,.3)' }}>
                      {r.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
