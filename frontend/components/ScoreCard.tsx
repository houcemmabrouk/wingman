'use client'

import AIAnalysis from '@/components/AIAnalysis'

interface ScoreDetail {
  question_id: number
  stem: string
  user_answer: string
  correct_answer: string
  is_correct: boolean
  explanation: string | null
}

interface ScoreCardProps {
  scorePct: number
  correct: number
  incorrect: number
  total: number
  details: ScoreDetail[]
  onRecalibrate?: () => void
  sessionId?: number
  showAIAnalysis?: boolean
}

export default function ScoreCard({ scorePct, correct, incorrect, total, details, onRecalibrate, sessionId, showAIAnalysis }: ScoreCardProps) {
  const color = scorePct >= 80 ? 'text-green-400' : scorePct >= 60 ? 'text-amber-400' : 'text-red-400'
  const ringColor = scorePct >= 80 ? 'border-green-500' : scorePct >= 60 ? 'border-amber-500' : 'border-red-500'

  const errors = details.filter(d => !d.is_correct)

  return (
    <div className="card space-y-6">
      {/* Score display */}
      <div className="flex flex-col items-center">
        <div className={`w-32 h-32 rounded-full border-4 ${ringColor} flex items-center justify-center mb-3`}>
          <span className={`text-4xl font-bold ${color}`}>{scorePct}%</span>
        </div>
        <p className="text-sm text-slate-400">
          {correct} correctes / {total} questions
        </p>
        {scorePct < 60 && onRecalibrate && (
          <button onClick={onRecalibrate} className="btn-danger mt-3 text-xs">
            Corriger le plan
          </button>
        )}
      </div>

      {/* AI Analysis */}
      {showAIAnalysis && sessionId && (
        <AIAnalysis sessionId={sessionId} autoLoad />
      )}

      {/* Errors review */}
      {errors.length > 0 && (
        <div>
          <h3 className="card-header">Errors ({errors.length})</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {errors.map((d) => (
              <div key={d.question_id} className="bg-surface-700/50 rounded-lg p-3">
                <p className="text-sm text-slate-300 mb-2">{d.stem}</p>
                <div className="flex gap-4 text-xs">
                  <span className="text-red-400">Your answer: {d.user_answer}</span>
                  <span className="text-green-400">Bonne réponse : {d.correct_answer}</span>
                </div>
                {d.explanation && (
                  <p className="text-xs text-slate-500 mt-2 border-t border-surface-600 pt-2">
                    {d.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
