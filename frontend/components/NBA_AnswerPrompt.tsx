'use client'

import { KeyboardEvent, useEffect, useRef, useState } from 'react'

interface SubmitFeedback {
  level: 'success' | 'info' | 'warning' | 'error'
  message: string
}

interface NBA_AnswerPromptProps {
  /** Optional handler — return feedback to display inline. If omitted, the
   *  prompt just confirms locally that the answer was captured. */
  onSubmit?: (text: string) => Promise<SubmitFeedback | void> | SubmitFeedback | void
  /** Hint about what's being asked (shown above the prompt). */
  losCode?: string | null
  losDescription?: string | null
  placeholder?: string
  autoFocus?: boolean
}

const ACCENT = '#00e0b8'  // teal — recall / understanding lane
const LEVEL_BG: Record<SubmitFeedback['level'], string> = {
  success: 'rgba(34,197,94,.08)',
  info:    'rgba(108,140,255,.08)',
  warning: 'rgba(245,158,11,.08)',
  error:   'rgba(239,68,68,.08)',
}
const LEVEL_BORDER: Record<SubmitFeedback['level'], string> = {
  success: 'rgba(34,197,94,.30)',
  info:    'rgba(108,140,255,.30)',
  warning: 'rgba(245,158,11,.30)',
  error:   'rgba(239,68,68,.30)',
}
const LEVEL_TEXT: Record<SubmitFeedback['level'], string> = {
  success: '#22c55e',
  info:    '#a0b4ff',
  warning: '#fbbf24',
  error:   '#f87171',
}

export const NBA_AnswerPrompt = ({
  onSubmit,
  losCode,
  losDescription,
  placeholder = 'Tape ton calcul ou ton raisonnement…',
  autoFocus,
}: NBA_AnswerPromptProps) => {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus) taRef.current?.focus()
  }, [autoFocus])

  // Grow the textarea up to a cap as the user types.
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`
  }, [value])

  async function fire() {
    const text = value.trim()
    if (!text || submitting) return
    setSubmitting(true)
    setFeedback(null)
    try {
      if (onSubmit) {
        const result = await onSubmit(text)
        if (result) setFeedback(result)
        else setFeedback({ level: 'success', message: 'Réponse soumise.' })
      } else {
        setFeedback({ level: 'info', message: 'Réponse capturée localement (pas encore évaluée).' })
      }
      setValue('')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Échec de la soumission.'
      setFeedback({ level: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl + Enter submits; plain Enter inserts a newline.
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      fire()
    }
  }

  return (
    <div
      className="rounded-[18px] p-5"
      style={{
        background: 'rgba(0,224,184,.04)',
        border: `1px solid ${ACCENT}33`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full inline-flex items-center gap-1.5"
            style={{ background: 'rgba(0,224,184,.10)', border: `1px solid ${ACCENT}77`, color: ACCENT }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }}
            />
            Recall Prompt
          </span>
          {losCode && (
            <span className="text-[10px] font-mono text-slate-400">{losCode}</span>
          )}
        </div>
        <span className="text-[10px] text-slate-500 hidden sm:inline">
          ⌘/Ctrl + Enter pour soumettre
        </span>
      </div>

      {/* Hint about the LOS */}
      {losDescription && (
        <p className="text-[12px] text-slate-400 leading-relaxed mb-3">
          {losDescription}
        </p>
      )}

      {/* Prompt */}
      <div
        className="rounded-[12px] px-3 py-2.5 font-mono text-[13px] flex items-start gap-2"
        style={{ background: 'rgba(0,0,0,.30)', border: `1px solid ${ACCENT}55` }}
      >
        <span
          className="shrink-0 underline underline-offset-2 select-none mt-[2px]"
          style={{ color: ACCENT }}
        >
          ANS_PROMPT_&gt;
        </span>
        <textarea
          ref={taRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={onKey}
          spellCheck={false}
          autoComplete="off"
          rows={1}
          className="bg-transparent outline-none border-none w-full text-slate-100 placeholder:text-slate-600 resize-none leading-relaxed"
          placeholder={placeholder}
          style={{ minHeight: 22 }}
          disabled={submitting}
        />
      </div>

      {/* Submit row */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[10px] text-slate-500">
          {value.trim().length > 0
            ? `${value.trim().length} chars · ${value.trim().split(/\s+/).length} mots`
            : 'En attente de saisie…'}
        </span>
        <button
          onClick={fire}
          disabled={!value.trim() || submitting}
          className="px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: ACCENT,
            color: '#04282a',
          }}
        >
          {submitting ? 'Évaluation…' : 'Soumettre'}
        </button>
      </div>

      {/* Inline feedback */}
      {feedback && (
        <div
          className="mt-3 rounded-[10px] px-3 py-2 text-[12px]"
          style={{
            background: LEVEL_BG[feedback.level],
            border: `1px solid ${LEVEL_BORDER[feedback.level]}`,
            color: LEVEL_TEXT[feedback.level],
          }}
        >
          {feedback.message}
        </div>
      )}
    </div>
  )
}

export default NBA_AnswerPrompt
