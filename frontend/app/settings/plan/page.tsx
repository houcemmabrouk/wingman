'use client'

import { useState, useEffect } from 'react'

export default function PlanPage() {
  const [examDate, setExamDate] = useState('')
  const [hoursPerWeek, setHoursPerWeek] = useState(12)
  const [preferredDays, setPreferredDays] = useState<string[]>(['M', 'T', 'W', 'Th', 'F'])
  const [level, setLevel] = useState('beginner')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('wingman_onboarding')
      if (raw) {
        const d = JSON.parse(raw)
        if (d.exam_date) setExamDate(d.exam_date)
        if (d.hours_per_week) setHoursPerWeek(d.hours_per_week)
        if (d.preferred_days) setPreferredDays(d.preferred_days)
        if (d.level) setLevel(d.level)
      }
    } catch {}
  }, [])

  const toggleDay = (day: string) => {
    setPreferredDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  const handleSave = () => {
    const raw = localStorage.getItem('wingman_onboarding')
    const ob = raw ? JSON.parse(raw) : {}
    ob.exam_date = examDate
    ob.hours_per_week = hoursPerWeek
    ob.preferred_days = preferredDays
    ob.level = level
    localStorage.setItem('wingman_onboarding', JSON.stringify(ob))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Study Plan</h1>

      <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5 space-y-4">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Target Exam Date</label>
          <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none" style={{ background: '#1a2540', border: '1px solid #2a3560' }} />
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Hours per Week</label>
          <div className="flex gap-2">
            {[6, 8, 10, 12, 15, 20].map(h => (
              <button key={h} onClick={() => setHoursPerWeek(h)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${hoursPerWeek === h ? 'bg-blue-500 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'}`}>{h}h</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Preferred Study Days</label>
          <div className="flex gap-2">
            {[['M','Mon'],['T','Tue'],['W','Wed'],['Th','Thu'],['F','Fri'],['S','Sat'],['Su','Sun']].map(([key, label]) => (
              <button key={key} onClick={() => toggleDay(key)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${preferredDays.includes(key) ? 'bg-emerald-500 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'}`}>{label}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 block">Experience Level</label>
          <div className="flex gap-2">
            {['beginner', 'intermediate', 'advanced'].map(l => (
              <button key={l} onClick={() => setLevel(l)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${level === l ? 'bg-purple-500 text-white' : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'}`}>{l}</button>
            ))}
          </div>
        </div>

        <button onClick={handleSave}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
          {saved ? 'Saved!' : 'Save Plan Settings'}
        </button>
      </div>
    </div>
  )
}
