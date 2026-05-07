'use client'

import { useState, useEffect, useRef } from 'react'
import ChallengeQuestion from '@/components/ChallengeQuestion'

interface Question {
  id: number
  stem: string
  option_a: string
  option_b: string
  option_c: string
}

interface QCMSessionProps {
  sessionId: number
  questions: Question[]
  timeLimitMin: number
  /**
   * 'after_each' (default): show correct answer + explanation as soon as the user picks.
   * 'end_only': lock the question silently — no color cues, no explanation — until session end.
   */
  revealMode?: 'after_each' | 'end_only'
  onComplete: (result: unknown) => void
}

interface CheckResult {
  user_answer: string
  correct_answer: string
  is_correct: boolean
  explanation: string | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function QCMSession({ sessionId, questions, timeLimitMin, revealMode = 'after_each', onComplete }: QCMSessionProps) {
  const blindMode = revealMode === 'end_only'
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  // Per-question check results — once set, the question is locked.
  const [checks, setChecks] = useState<Record<number, CheckResult>>({})
  const [checking, setChecking] = useState(false)
  // Transient flash highlight on the correct option after answering.
  const [flashing, setFlashing] = useState<Record<number, boolean>>({})
  const [timeLeft, setTimeLeft] = useState(timeLimitMin * 60)
  const [submitting, setSubmitting] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleSubmit()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const q = questions[currentIdx]

  const handlePick = async (letter: 'A' | 'B' | 'C') => {
    if (!q) return
    // Already locked for this question — ignore.
    if (checks[q.id]) return
    if (checking) return

    setChecking(true)
    setAnswers(prev => ({ ...prev, [q.id]: letter }))

    try {
      const res = await fetch(`${API_URL}/api/qcm/check`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: q.id, answer: letter }),
      })
      const data = await res.json()
      if (data && typeof data.is_correct === 'boolean') {
        setChecks(prev => ({ ...prev, [q.id]: data as CheckResult }))
        // Brief flash on the correct option.
        setFlashing(prev => ({ ...prev, [q.id]: true }))
        setTimeout(() => {
          setFlashing(prev => ({ ...prev, [q.id]: false }))
        }, 900)
      }
    } catch {
      // Network failure — release the lock so the user can retry.
      setAnswers(prev => {
        const next = { ...prev }
        delete next[q.id]
        return next
      })
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    if (intervalRef.current) clearInterval(intervalRef.current)

    const answerList = Object.entries(answers).map(([qid, ans]) => ({
      question_id: parseInt(qid),
      answer: ans,
    }))

    try {
      const res = await fetch(`${API_URL}/api/qcm/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, answers: answerList }),
      })
      const data = await res.json()
      onComplete(data)
    } catch {
      onComplete({ error: 'Submit failed' })
    }
  }

  if (!q) return null

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const selected = answers[q.id]
  const check = checks[q.id]
  const locked = Boolean(check)
  const flashOn = Boolean(flashing[q.id])

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-slate-400">
          Question {currentIdx + 1} / {questions.length}
        </span>
        <span className={`font-mono text-sm ${timeLeft < 60 ? 'text-red-400' : 'text-slate-300'}`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Progress */}
      <div className="w-full bg-surface-700 rounded-full h-1 mb-6">
        <div className="h-1 bg-accent-blue rounded-full transition-all"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Stem */}
      <p className="text-sm text-slate-200 mb-6 leading-relaxed">{q.stem}</p>

      {/* Options */}
      <div className="space-y-2 mb-4">
        {(['A', 'B', 'C'] as const).map((letter) => {
          const key = `option_${letter.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c'
          const isSelected = selected === letter
          const isCorrectAnswer = locked && check!.correct_answer === letter
          const isUserWrong = locked && check!.user_answer === letter && !check!.is_correct

          let classes = 'border-surface-600 bg-surface-700/50 text-slate-300'
          if (locked) {
            if (blindMode) {
              // Exam mode: hide correctness — just dim everything, accent the picked option.
              classes = isSelected
                ? 'border-blue-500 bg-blue-950/40 text-blue-100'
                : 'border-surface-600 bg-surface-700/30 text-slate-500 opacity-70'
            } else if (isCorrectAnswer) {
              // Correct answer: solid green (with a quick flash/ring right after reveal).
              classes = `border-emerald-500 bg-emerald-500/20 text-emerald-100 ${
                flashOn ? 'ring-2 ring-emerald-400 animate-pulse' : ''
              }`
            } else if (isUserWrong) {
              classes = 'border-red-500 bg-red-500/15 text-red-200'
            } else {
              classes = 'border-surface-600 bg-surface-700/30 text-slate-500 opacity-70'
            }
          } else if (isSelected) {
            classes = 'border-accent-blue bg-blue-950/30 text-white'
          } else {
            classes += ' hover:border-surface-500 hover:bg-surface-700'
          }

          return (
            <button
              key={letter}
              onClick={() => handlePick(letter)}
              disabled={locked || checking}
              className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${classes} ${
                locked ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`font-mono mr-1 ${
                  locked
                    ? blindMode
                      ? isSelected ? 'text-blue-400' : 'text-slate-600'
                      : isCorrectAnswer ? 'text-emerald-400'
                      : isUserWrong ? 'text-red-400'
                      : 'text-slate-600'
                    : 'text-accent-blue'
                }`}>
                  {letter}.
                </span>
                <span className="flex-1">{q[key]}</span>
                {locked && !blindMode && isCorrectAnswer && (
                  <span className="text-emerald-400 text-base leading-none">✓</span>
                )}
                {locked && !blindMode && isUserWrong && (
                  <span className="text-red-400 text-base leading-none">✗</span>
                )}
                {locked && blindMode && isSelected && (
                  <span className="text-blue-400 text-base leading-none">●</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Explanation — hidden in exam mode until session end. */}
      {locked && !blindMode && (
        <div
          className={`rounded-lg border p-3 mb-4 text-[13px] leading-relaxed ${
            check!.is_correct
              ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-100'
              : 'border-red-500/30 bg-red-500/5 text-red-100'
          }`}
        >
          <p className="font-semibold mb-1">
            {check!.is_correct
              ? '✓ Correct'
              : `✗ Incorrect — correct answer: ${check!.correct_answer}`}
          </p>
          {check!.explanation && (
            <p className="text-slate-300/90 whitespace-pre-line">{check!.explanation}</p>
          )}
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-end">
            <ChallengeQuestion
              questionId={q.id}
              selectedAnswer={check!.user_answer}
              correctAnswer={check!.correct_answer}
            />
          </div>
        </div>
      )}
      {locked && blindMode && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 mb-4 text-[12px] text-blue-100">
          Answer locked. Correct answer + explanation will appear in the score recap at the end.
        </div>
      )}

      {/* Nav */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          className="btn-ghost"
        >
          Précédent
        </button>

        {currentIdx < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIdx(i => i + 1)}
            disabled={!locked}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            title={locked ? '' : 'Choose an answer first'}
          >
            Suivant
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !locked}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Envoi...' : 'Terminer'}
          </button>
        )}
      </div>
    </div>
  )
}
