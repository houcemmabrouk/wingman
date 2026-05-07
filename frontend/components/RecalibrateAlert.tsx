'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

interface RecalibrateAlertProps {
  lmId: number
  lmCode: string
  scorePct: number
  onRecalibrated?: () => void
}

export default function RecalibrateAlert({ lmId, lmCode, scorePct, onRecalibrated }: RecalibrateAlertProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  if (scorePct >= 60) return null

  const handleRecalibrate = async () => {
    setLoading(true)
    try {
      const data = await api.recalibratePlan(lmId, scorePct)
      if (data.action === 'recalibrated') {
        setResult(`${data.lm_code} reinjected on ${data.injected_date}`)
      } else {
        setResult(data.message || 'No action needed')
      }
      onRecalibrated?.()
    } catch {
      setResult('Error during recalibration')
    }
    setLoading(false)
  }

  return (
    <div className="border-l-4 border-l-red-500 bg-red-950/20 rounded-r-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-red-400">
            Low score on {lmCode}: {scorePct}%
          </p>
          <p className="text-xs text-slate-400 mt-1">
            This module will be reinjected into your plan for closer review.
          </p>
        </div>
        {!result ? (
          <button
            onClick={handleRecalibrate}
            disabled={loading}
            className="btn-danger text-xs"
          >
            {loading ? 'Recalibrating...' : 'Recalibrate plan'}
          </button>
        ) : (
          <span className="badge-green text-xs">{result}</span>
        )}
      </div>
    </div>
  )
}
