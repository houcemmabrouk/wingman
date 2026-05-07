'use client'

import { KeyboardEvent, useEffect, useRef, useState } from 'react'

interface CommandResult {
  cmd: string
  out: string
  level: 'info' | 'success' | 'error' | 'echo'
}

interface NBA_TerminalInputProps {
  /** Called for every Enter; the parent decides what to do with `start` etc. */
  onCommand?: (raw: string) => CommandResult | void
  /** Initial banner shown on first render (e.g., welcome line). */
  banner?: string
  /** When true, autofocus the input on mount. */
  autoFocus?: boolean
}

const ACCENT = '#6c8cff'

const HELP_LINES = [
  'start | go | execute    →  launch a session on the current NBA',
  'refresh | r             →  re-fetch the critical path',
  'help | ?                →  show this help',
  'clear | cls             →  clear the log',
]

const LEVEL_COLOR: Record<CommandResult['level'], string> = {
  info:    '#a0b4ff',
  success: '#22c55e',
  error:   '#f87171',
  echo:    '#cbd5e1',
}

export const NBA_TerminalInput = ({ onCommand, banner, autoFocus }: NBA_TerminalInputProps) => {
  const [value, setValue] = useState('')
  const [log, setLog] = useState<CommandResult[]>(banner ? [{ cmd: '', out: banner, level: 'info' }] : [])
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState<number>(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'end' })
  }, [log])

  const append = (entry: CommandResult) => setLog(prev => [...prev.slice(-30), entry])

  const handleResponse = (e: KeyboardEvent<HTMLInputElement>) => {
    // ↑ / ↓: navigate command history
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length === 0) return
      const next = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1)
      setHistIdx(next)
      setValue(history[next])
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (history.length === 0 || histIdx < 0) return
      const next = histIdx + 1
      if (next >= history.length) {
        setHistIdx(-1)
        setValue('')
      } else {
        setHistIdx(next)
        setValue(history[next])
      }
      return
    }

    if (e.key !== 'Enter') return

    const raw = value.trim()
    if (!raw) return

    setHistory(prev => [...prev, raw])
    setHistIdx(-1)
    setValue('')

    const cmd = raw.toLowerCase()

    // Built-in commands first.
    if (cmd === 'help' || cmd === '?') {
      append({ cmd: raw, out: HELP_LINES.join('\n'), level: 'info' })
      return
    }
    if (cmd === 'clear' || cmd === 'cls') {
      setLog([])
      return
    }

    append({ cmd: raw, out: '', level: 'echo' })
    if (onCommand) {
      const result = onCommand(raw)
      if (result) append(result)
    }
  }

  return (
    <div
      className="rounded-[18px] p-5"
      style={{
        background: 'rgba(108,140,255,.04)',
        border: `1px solid ${ACCENT}33`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/[0.06]">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full inline-flex items-center gap-1.5"
          style={{ background: 'rgba(108,140,255,.10)', border: `1px solid ${ACCENT}77`, color: ACCENT }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }}
          />
          Command Line
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Type &lsquo;help&rsquo; for commands
        </span>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div
          className="rounded-[12px] p-3 mb-3 max-h-48 overflow-y-auto font-mono text-[12px] leading-relaxed"
          style={{ background: 'rgba(0,0,0,.25)', border: '1px solid rgba(255,255,255,.04)' }}
        >
          {log.map((entry, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {entry.cmd && (
                <div className="flex gap-1.5">
                  <span className="text-slate-500 shrink-0">$</span>
                  <span className="text-white">{entry.cmd}</span>
                </div>
              )}
              {entry.out && (
                <div style={{ color: LEVEL_COLOR[entry.level] }} className={entry.cmd ? 'pl-3' : ''}>
                  {entry.out}
                </div>
              )}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}

      {/* Prompt + input */}
      <div
        className="flex items-center gap-2 rounded-[12px] px-3 py-2 font-mono text-[13px]"
        style={{ background: 'rgba(0,0,0,.30)', border: `1px solid ${ACCENT}55` }}
      >
        <span className="shrink-0 text-[11px] uppercase tracking-wider text-slate-500">
          wingman_input
        </span>
        <span className="shrink-0" style={{ color: ACCENT }}>$</span>
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleResponse}
          spellCheck={false}
          autoComplete="off"
          className="bg-transparent outline-none border-none w-full text-slate-200 placeholder:text-slate-600"
          placeholder="Tape une commande (help)…"
        />
      </div>
    </div>
  )
}

export default NBA_TerminalInput
