'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

interface Flashcard {
  id: number
  front: string
  back: string
  tags: string[]
}

interface FlashcardDeckProps {
  cards: Flashcard[]
  lmId: number
  onComplete?: () => void
}

export default function FlashcardDeck({ cards, lmId, onComplete }: FlashcardDeckProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  if (cards.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-sm text-slate-500">No flashcards available for this module</p>
      </div>
    )
  }

  const card = cards[currentIdx]
  if (!card) {
    return (
      <div className="card text-center py-8">
        <p className="text-lg text-green-400 font-bold">Deck complete!</p>
        <p className="text-sm text-slate-400 mt-2">{reviewed} cards reviewed</p>
        {onComplete && (
          <button onClick={onComplete} className="btn-primary mt-4">Back</button>
        )}
      </div>
    )
  }

  const handleReview = async (score: number) => {
    try {
      await api.reviewFlashcard(card.id, lmId, score)
    } catch { /* ignore */ }

    setReviewed(r => r + 1)
    setFlipped(false)
    setCurrentIdx(i => i + 1)
  }

  return (
    <div className="card flex flex-col items-center">
      {/* Progress */}
      <div className="w-full flex justify-between text-xs text-slate-400 mb-4">
        <span>Card {currentIdx + 1} / {cards.length}</span>
        <span>{reviewed} reviewed</span>
      </div>

      {/* Card */}
      <div
        onClick={() => setFlipped(f => !f)}
        className="w-full min-h-[200px] bg-surface-700 rounded-xl border border-surface-600 p-6 cursor-pointer
                   flex items-center justify-center text-center transition-all hover:border-accent-blue mb-4"
      >
        <div>
          <p className="text-xs text-slate-500 mb-2">{flipped ? 'BACK' : 'FRONT'}</p>
          <p className="text-sm text-slate-200 leading-relaxed">
            {flipped ? card.back : card.front}
          </p>
        </div>
      </div>

      {/* Review buttons (only when flipped) */}
      {flipped && (
        <div className="flex gap-3">
          <button onClick={() => handleReview(0)}
            className="btn bg-red-900/40 text-red-400 hover:bg-red-900/60">
            Failed
          </button>
          <button onClick={() => handleReview(1)}
            className="btn bg-amber-900/40 text-amber-400 hover:bg-amber-900/60">
            Hard
          </button>
          <button onClick={() => handleReview(2)}
            className="btn bg-green-900/40 text-green-400 hover:bg-green-900/60">
            Easy
          </button>
        </div>
      )}

      {!flipped && (
        <p className="text-xs text-slate-500">Click to flip</p>
      )}
    </div>
  )
}
