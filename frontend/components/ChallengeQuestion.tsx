'use client'

import { useState } from 'react'
import { Modal, ModalCard } from '@/components/ui/Modal'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ChallengeQuestionProps {
  questionId: number
  selectedAnswer: string
  correctAnswer: string
}

interface DisputeResolution {
  dispute_id: number
  status: 'upheld' | 'rejected' | 'needs_human' | 'auto_review'
  verdict?: string | null
  confidence?: number
  standard_citation?: string | null
  reason?: string
  mastery_bonus_pp?: number
}

export default function ChallengeQuestion({
  questionId,
  selectedAnswer,
  correctAnswer,
}: ChallengeQuestionProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [claimed, setClaimed] = useState<'A' | 'B' | 'C'>(() => {
    const s = selectedAnswer?.toUpperCase()
    if ((s === 'A' || s === 'B' || s === 'C') && s !== correctAnswer) return s
    return 'A'
  })
  const [reason, setReason] = useState('')
  const [resolution, setResolution] = useState<DisputeResolution | null>(null)

  const close = () => {
    setOpen(false)
    // Defer reset so the closing animation isn't snapped back to the form.
    setTimeout(() => {
      setResolution(null)
      setReason('')
      setSubmitting(false)
    }, 200)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/questions/${questionId}/dispute`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_answer: selectedAnswer || null,
          claimed_answer: claimed,
          user_reason: reason.trim() || null,
        }),
      })
      const data = (await res.json()) as DisputeResolution
      setResolution(data)
    } catch {
      setResolution({
        dispute_id: 0,
        status: 'needs_human',
        verdict: null,
        reason: 'Connexion impossible. Réessaie plus tard.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] text-slate-500 hover:text-amber-400 underline underline-offset-2 transition-colors"
      >
        Contester cette question
      </button>

      <Modal open={open} onClose={close}>
        <ModalCard>
          <div className="p-6 space-y-4">
            {!resolution ? (
              <>
                <h3 className="text-[15px] font-bold text-white">Contester la question</h3>
                <p className="text-[12px] text-slate-400">
                  Tu penses que la bonne réponse n&rsquo;est pas{' '}
                  <span className="font-mono text-slate-200">{correctAnswer}</span>. Indique
                  laquelle et donne une raison si tu peux. Un examinateur (Claude) tranchera
                  contre les standards officiels.
                </p>

                <div>
                  <label className="text-[11px] text-slate-500 uppercase font-semibold">
                    Bonne réponse selon toi
                  </label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {(['A', 'B', 'C'] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setClaimed(l)}
                        className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                          claimed === l
                            ? 'bg-amber-500 text-white'
                            : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 uppercase font-semibold">
                    Pourquoi (optionnel) — cite une règle si possible
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value.slice(0, 2000))}
                    rows={4}
                    placeholder="Ex: Sous IAS 1.56, les actifs d&rsquo;impôt différé sont toujours non-courants…"
                    className="mt-1.5 w-full rounded-lg bg-white/[0.04] border border-white/[0.08] p-2 text-[13px] text-slate-200 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                  <div className="text-[10px] text-slate-600 mt-1 text-right">
                    {reason.length}/2000
                  </div>
                </div>
              </>
            ) : (
              <ResolutionView resolution={resolution} />
            )}
          </div>

          <div className="px-6 pb-5 flex gap-3">
            <button
              type="button"
              onClick={close}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-slate-300 bg-white/[0.06] hover:bg-white/[0.1] transition-all active:scale-[0.98]"
            >
              {resolution ? 'Fermer' : 'Annuler'}
            </button>
            {!resolution && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-amber-500 hover:brightness-110 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {submitting ? 'Arbitrage…' : 'Soumettre'}
              </button>
            )}
          </div>
        </ModalCard>
      </Modal>
    </>
  )
}

function ResolutionView({ resolution }: { resolution: DisputeResolution }) {
  const upheld = resolution.status === 'upheld'
  const human = resolution.status === 'needs_human'
  const title = upheld
    ? '✓ Tu avais raison'
    : human
      ? '⏳ Cas ambigu'
      : '✗ Réponse maintenue'
  const color = upheld ? 'text-emerald-400' : human ? 'text-amber-400' : 'text-slate-200'

  return (
    <div className="space-y-3">
      <h3 className={`text-[15px] font-bold ${color}`}>{title}</h3>
      {resolution.standard_citation ? (
        <p className="text-[12px] text-slate-400">
          <span className="text-slate-500">Référence&nbsp;:</span>{' '}
          <span className="font-mono text-slate-200">{resolution.standard_citation}</span>
        </p>
      ) : null}
      {resolution.reason ? (
        <p className="text-[13px] text-slate-300 whitespace-pre-line leading-relaxed">
          {resolution.reason}
        </p>
      ) : null}
      {upheld && resolution.mastery_bonus_pp ? (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[12px] text-emerald-200">
          🎯 Bonus mastery <strong>+{resolution.mastery_bonus_pp}pp</strong> sur ce LOS. La
          question est retirée du QBank.
        </div>
      ) : null}
      {human ? (
        <p className="text-[12px] text-slate-500">
          Le cas est transmis pour révision humaine. Tu seras notifié si le verdict change.
        </p>
      ) : null}
    </div>
  )
}
