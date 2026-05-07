'use client'

import { useState } from 'react'

export default function NotificationsPage() {
  const [emailDigest, setEmailDigest] = useState(true)
  const [streakReminder, setStreakReminder] = useState(true)
  const [reviewDue, setReviewDue] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(false)
  const [saved, setSaved] = useState(false)

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)}
      className={`w-10 h-5 rounded-full transition-all ${value ? 'bg-blue-500' : 'bg-white/[0.08]'}`}>
      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Notifications</h1>

      <div className="rounded-2xl bg-surface-800/60 border border-white/[0.06] p-5 space-y-4">
        {[
          { label: 'Daily email digest', desc: 'Summary of your progress and next actions', value: emailDigest, set: setEmailDigest },
          { label: 'Streak reminder', desc: 'Alert when your streak is at risk', value: streakReminder, set: setStreakReminder },
          { label: 'SRS review due', desc: 'Notify when flashcards are due for review', value: reviewDue, set: setReviewDue },
          { label: 'Weekly performance report', desc: 'Detailed analytics sent every Sunday', value: weeklyReport, set: setWeeklyReport },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-2">
            <div>
              <div className="text-[13px] font-medium text-white">{item.label}</div>
              <div className="text-[11px] text-slate-500">{item.desc}</div>
            </div>
            <Toggle value={item.value} onChange={item.set} />
          </div>
        ))}

        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
          {saved ? 'Saved!' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
